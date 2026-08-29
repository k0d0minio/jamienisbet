import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ChevronRight,
  CircleCheck,
  FileText,
  Receipt,
  Ticket as TicketIcon,
  TriangleAlert,
} from "lucide-react"

import {
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  cn,
} from "@jamie-nisbet/ui"
import {
  clientStatusLabel,
  listClients,
  listOpenComplianceDates,
  listOpenTasks,
  type Client,
} from "@jamie-nisbet/services"

import { AddTodo, type TodoLead } from "@/components/add-todo"
import { AppScreen } from "@/components/app-screen"
import { LeadRow } from "@/components/lead-row"
import {
  OverdueList,
  type OverdueCompliance,
  type OverdueTodo,
} from "@/components/overdue-list"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  listInvoicesNeedingAction,
  type InvoiceNeedingAction,
} from "@/lib/finance"
import { daysWaiting, isStale, waitedLabel, whoLabel } from "@/lib/leads"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"
import { listBoard, type Ticket } from "@/lib/tickets"

export const metadata: Metadata = { title: "Needs you" }

// No `dynamic = "force-dynamic"` here on purpose. Awaiting searchParams already
// makes this request-time, and the Neon reads below are plain queries the Data
// Cache never touches — so it changed nothing about how fresh this feed is. It
// did set `fetchCache: "force-no-store"` across the segment, which overrode the
// 60-second revalidate on every GitHub read behind `listBoard()`. Once home
// started reading the board, that was the estate re-fetched from GitHub on
// every open of the app. See the header of `lib/tickets.ts`.

// Home. The dashboard used to open on the roster — everyone, longest-waiting
// first — which answered "who exists" when the only question you have at 8am is
// "what needs me". So the roster moved to /leads and this took its place: one
// prioritised list, four sections, nothing in it that doesn't want something.
//
// The rule that shapes every row: a row either **acts in place** or
// **deep-links**. Nothing here edits something that has a proper home
// elsewhere. Marking a lead touched and ticking a todo happen under the thumb,
// because there is nowhere better to send you for either. An invoice and a
// ticket are links — an invoice especially, because finalizing and emailing one
// is a deliberate click on Money and the estate's "no outbound action without
// review" rule does not bend for a feed.
//
// Sections render only when they have something. The empty feed is the point:
// a designed all-clear rather than a broken screen, because the app opening on
// "nothing needs you" is a good day.

/** How many rows a section shows before it stops and points at its own screen.
 *  A feed you have to scroll past is a feed you stop reading. */
const SECTION_LIMIT = 8

/** Tickets are the section you are least likely to act on from here, so it
 *  takes the smallest slice of the fold. */
const TICKET_LIMIT = 6

/** A compliance date this close is worth seeing before it is late — the
 *  contabilista needs asking *before* the deadline, not after it. */
const COMPLIANCE_HORIZON_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Reads. Three sources, three failure modes, and none of them may take the
// others down: Neon is the app's spine, Stripe and GitHub are each optional
// and each says so in its own words when it is not there.

type DbReads = {
  /** When the read happened. Sampled here rather than during render — `now`
   *  is impure, and every "how late is this" on the screen has to be measured
   *  against one instant anyway. */
  now: number
  waiting: Client[]
  todos: OverdueTodo[]
  compliance: OverdueCompliance[]
  /** Open todos that are filed but not yet due — counted, never listed, so
   *  the Overdue section can say it is a filter rather than the whole list. */
  filed: number
  /** Everyone a todo can be pointed at, for the add sheet's picker. */
  leads: TodoLead[]
  error: string | null
}

async function loadDb(): Promise<DbReads> {
  const now = Date.now()
  const empty = { now, waiting: [], todos: [], compliance: [], filed: 0, leads: [] }
  try {
    const [clients, tasks, dates] = await Promise.all([
      listClients({ archived: false }),
      listOpenTasks(),
      listOpenComplianceDates(),
    ])

    // Open leads past the staleness threshold, longest first. The list is
    // already sorted by who has waited longest, so the filter preserves it.
    const waiting = clients.filter((client) => isStale(client, now))

    // Only what has actually come due. A todo with no date is filed, not
    // owed — it is on its lead's profile and in the count under this section,
    // and it starts chasing you the day it gets a date.
    const todos = tasks
      .flatMap((task) => {
        const due = task.dueDate
        if (due === null || due.getTime() > now) return []
        return [
          {
            id: task.id,
            title: task.title,
            clientName: task.clientName,
            dueDate: due.toISOString(),
            // "Late" is a day past, not a minute past: a todo due today shows
            // in the section but is not scolded for it until tomorrow.
            late: due.getTime() < now - DAY_MS,
          },
        ]
      })

    const horizon = now + COMPLIANCE_HORIZON_DAYS * DAY_MS
    const compliance = dates
      .filter((date) => date.dueDate.getTime() <= horizon)
      .map((date) => ({
        id: date.id,
        title: date.title,
        notes: date.notes,
        dueDate: date.dueDate.toISOString(),
        recurrence: date.recurrence,
        late: date.dueDate.getTime() < now,
      }))

    return {
      now,
      waiting,
      todos,
      compliance,
      filed: tasks.length - todos.length,
      leads: clients.map((c) => ({ id: c.id, name: c.name })),
      error: null,
    }
  } catch (err) {
    return {
      ...empty,
      error:
        err instanceof Error ? err.message : "Could not reach the database.",
    }
  }
}

type MoneyReads = {
  invoices: InvoiceNeedingAction[]
  /** A sentence for the feed's notes when the section could not be read. */
  note: string | null
}

async function loadMoney(): Promise<MoneyReads> {
  if (!isStripeConfigured()) {
    return {
      invoices: [],
      note: "Stripe isn't configured here, so unpaid invoices aren't part of this list.",
    }
  }
  try {
    return { invoices: (await listInvoicesNeedingAction()) ?? [], note: null }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "no answer"
    return { invoices: [], note: `Stripe didn't answer — ${detail}` }
  }
}

type TicketReads = { strip: Ticket[]; note: string | null }

async function loadTickets(): Promise<TicketReads> {
  try {
    const board = await listBoard()
    if (!board.configured) {
      return {
        strip: [],
        note: "GitHub isn't configured here, so today's tickets aren't part of this list.",
      }
    }
    if (board.dbError) return { strip: [], note: null }
    const unreachable = board.errors.map((e) => e.repo.slug)
    return {
      strip: board.strip,
      note:
        unreachable.length > 0
          ? `Couldn't read ${unreachable.join(", ")} — tickets there aren't in this list.`
          : null,
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "no answer"
    return { strip: [], note: `GitHub didn't answer — ${detail}` }
  }
}

// ---------------------------------------------------------------------------
// The screen.

export default async function NeedsYouPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; filter?: string }>
}) {
  const params = await searchParams

  // This route used to be the leads list, and its two view params rode in the
  // query string — so a bookmark or a home-screen shortcut of "my open leads"
  // is a `/?filter=open`. Those still mean the list, which now lives at
  // /leads; a bare `/` means the feed and stays here.
  if (params.archived != null || params.filter != null) {
    const query = new URLSearchParams()
    if (params.archived) query.set("archived", params.archived)
    if (params.filter) query.set("filter", params.filter)
    const suffix = query.toString()
    redirect(suffix ? `/leads?${suffix}` : "/leads")
  }

  const [db, money, tickets] = await Promise.all([
    loadDb(),
    loadMoney(),
    loadTickets(),
  ])

  const notes = [money.note, tickets.note].filter(
    (note): note is string => note !== null
  )

  const count =
    db.waiting.length +
    db.todos.length +
    db.compliance.length +
    money.invoices.length +
    tickets.strip.length

  const allClear = count === 0 && db.error === null

  return (
    <AppScreen
      title="Needs you"
      // One quiet line, and only when there is something to count — the
      // all-clear state below says its own piece, and a subtitle repeating it
      // would be the same sentence twice.
      subtitle={
        count > 0
          ? `${count} thing${count === 1 ? "" : "s"} waiting on you`
          : undefined
      }
      actions={<AddTodo leads={db.leads} />}
    >
      <div className="flex flex-col gap-app-section pt-1 pb-2">
        {/* Neon is the spine: without it two of the four sections simply are
            not there, so this is a stated failure rather than a footnote. */}
        {db.error ? (
          <GroupedSection>
            <GroupedRow
              icon={<TriangleAlert />}
              label="Database unavailable"
              variant="destructive"
              chevron={false}
            />
            <GroupedBlock>{db.error}</GroupedBlock>
          </GroupedSection>
        ) : null}

        {db.waiting.length > 0 ? (
          <WaitingOnYou leads={db.waiting} now={db.now} />
        ) : null}

        {db.todos.length > 0 || db.compliance.length > 0 ? (
          <OverdueList
            todos={db.todos}
            compliance={db.compliance}
            filed={db.filed}
          />
        ) : null}

        {money.invoices.length > 0 ? (
          <MoneyNeedingAction invoices={money.invoices} />
        ) : null}

        {tickets.strip.length > 0 ? (
          <TodaysTickets strip={tickets.strip} />
        ) : null}

        {allClear ? <AllClear partial={notes.length > 0} /> : null}

        {notes.length > 0 ? <FeedNotes notes={notes} /> : null}
      </div>
    </AppScreen>
  )
}

// ---------------------------------------------------------------------------
// Waiting on you — open leads past the staleness threshold.

/** The one row in the feed that carries the leads list's gestures, because it
 *  is the leads list's record: swipe right to mark them touched, swipe left
 *  for the tray, tap to open the profile. Marking someone touched drops them
 *  out of this section on the next read, which is the point of the stroke. */
function WaitingOnYou({ leads, now }: { leads: Client[]; now: number }) {
  const shown = leads.slice(0, SECTION_LIMIT)
  const more = leads.length - shown.length

  return (
    <GroupedSection
      header="Waiting on you"
      footer={
        more > 0 ? (
          <>
            {more} more open{" "}
            {more === 1 ? "lead has" : "leads have"} gone quiet —{" "}
            <Link
              href="/leads?filter=open"
              className="text-app-tint underline underline-offset-2"
            >
              see them on Leads
            </Link>
            .
          </>
        ) : (
          "Swipe a row right to mark them worked; swipe left to reach them."
        )
      }
    >
      <ul>
        {shown.map((lead, index) => {
          const days = daysWaiting(lead, now)
          const who = whoLabel(lead)
          return (
            <li key={lead.id}>
              <LeadRow
                id={lead.id}
                name={lead.name}
                phone={lead.phone}
                email={lead.email}
                archived={false}
              >
                {/* One row, one fill, one hairline — the same construction the
                    leads list uses, so a lead reads the same on both screens.
                    The fill is what hides the swipe tray behind it. */}
                <div
                  className={cn(
                    "relative flex items-center gap-3 bg-app-group px-4 py-2.5",
                    "transition-colors spring-press has-[a:active]:bg-app-press",
                    "md:gap-4 md:px-5 md:py-3.5",
                    index > 0 &&
                      "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"
                  )}
                >
                  <ViewTransitionLink
                    href={`/leads/${lead.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 after:absolute after:inset-0"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-app-body font-semibold text-app-label">
                        {lead.name}
                      </span>
                      {/* How long they have waited is the figure this section
                          is sorted on, so it sets in mono and carries the tint
                          that says it has gone past the threshold. Compact on
                          screen, spoken in full — "12d" is a glance, not a
                          sentence. */}
                      <span className="shrink-0 font-mono text-app-subhead font-semibold tabular-nums text-destructive">
                        <span aria-hidden>{days}d</span>
                        <span className="sr-only">
                          {waitedLabel(days, true)}
                        </span>
                      </span>
                    </span>
                    {/* Where they sit and who they are — the two things the
                        figure beside them doesn't already say. The status word
                        comes from the one label lookup, never from capitalising
                        the stored string. */}
                    <span className="truncate text-app-footnote text-app-label-3">
                      {clientStatusLabel(lead.status)}
                      {who ? ` · ${who}` : ""}
                    </span>
                  </ViewTransitionLink>

                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-app-label-3"
                  />
                </div>
              </LeadRow>
            </li>
          )
        })}
      </ul>
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// Money — invoices waiting on a decision. Links only.

function MoneyNeedingAction({
  invoices,
}: {
  invoices: InvoiceNeedingAction[]
}) {
  const shown = invoices.slice(0, SECTION_LIMIT)
  const more = invoices.length - shown.length

  return (
    <GroupedSection
      header="Money"
      // The standing rule, said where it is being obeyed: nothing on this
      // screen sends anything.
      footer={
        more > 0
          ? `${more} more on Money. Finalizing and sending stays a deliberate click there.`
          : "Finalizing and sending an invoice stays a deliberate click on Money."
      }
    >
      {shown.map((invoice) => (
        <GroupedRow
          key={invoice.id}
          asChild
          icon={invoice.reason === "draft" ? <FileText /> : <Receipt />}
          label={invoice.customerName ?? invoice.number ?? "Invoice"}
          description={
            invoice.reason === "draft"
              ? "Draft — never finalized"
              : `${invoice.daysLate} ${invoice.daysLate === 1 ? "day" : "days"} past due`
          }
          value={
            <span
              className={cn(
                "font-mono tabular-nums",
                invoice.reason === "overdue" && "font-medium text-destructive"
              )}
            >
              {formatMoney(invoice.amountDue, invoice.currency)}
            </span>
          }
        >
          {/* Into Money, at its invoices — the row finds the work, that screen
              is where the work is done. */}
          <Link href="/money#invoices" />
        </GroupedRow>
      ))}
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// Today's tickets — the board's now-strip, deep-linked into Tickets.

const TICKET_GROUP_LABEL: Record<string, string> = {
  today: "Today",
  "in-flight": "In flight",
  blocked: "Blocked",
}

function TodaysTickets({ strip }: { strip: Ticket[] }) {
  const shown = strip.slice(0, TICKET_LIMIT)
  const more = strip.length - shown.length

  return (
    <GroupedSection
      header="Today's tickets"
      footer={
        more > 0 ? (
          <>
            {more} more on the now-strip —{" "}
            <Link
              href="/tickets"
              className="text-app-tint underline underline-offset-2"
            >
              open Tickets
            </Link>
            .
          </>
        ) : (
          "Today's picks, runs in flight, and anything stuck. A ticket is worked in its own repo."
        )
      }
    >
      {shown.map((ticket) => (
        <GroupedRow
          key={`${ticket.repo.fullName}/${ticket.path}`}
          asChild
          icon={<TicketIcon />}
          label={ticket.title}
          description={
            <>
              <span className="font-mono">{ticket.repo.slug}</span>
              {` · ${TICKET_GROUP_LABEL[ticket.group] ?? ticket.group}`}
            </>
          }
        >
          {/* Into the board, filtered to the repo this ticket lives in — the
              board is where a ticket opens, and every launcher on it is a
              session link a human sends. */}
          <Link href={`/tickets?repo=${ticket.repo.slug}`} />
        </GroupedRow>
      ))}
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// The two quiet states.

/** Nothing needs you. This is the screen's best day, so it is designed for:
 *  centred words on the canvas rather than an empty slab, which reads as a
 *  card that failed to load. It never claims more than it knows — when a
 *  source could not be read, it says the list is only as complete as what it
 *  could see and the notes below name what was missing. */
function AllClear({ partial }: { partial: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <CircleCheck
        aria-hidden
        className="size-8 text-app-tint"
        strokeWidth={1.5}
      />
      <p className="text-app-title-3 font-semibold text-app-label">
        Nothing needs you
      </p>
      <p className="max-w-xs text-app-footnote text-app-label-3">
        {partial
          ? "Nothing in what this could read. Everyone has been worked recently, and nothing is due."
          : "No lead has gone quiet, nothing is due, no invoice is waiting, and no ticket is up. Go and do the work."}
      </p>
    </div>
  )
}

/** What the feed could not read. The house "not configured" note, sized as a
 *  footnote and set at the foot of the list rather than as a card of its own:
 *  a missing key is a fact about this deployment, not a thing that needs you,
 *  and it should not take a section's worth of the fold every single day. */
function FeedNotes({ notes }: { notes: string[] }) {
  return (
    <div className="flex flex-col gap-1 px-4 pb-2">
      {notes.map((note) => (
        <p key={note} className="text-app-footnote text-app-label-3">
          {note}
        </p>
      ))}
    </div>
  )
}
