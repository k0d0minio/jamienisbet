import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ChevronRight,
  CircleCheck,
  FileText,
  Flag,
  Hourglass,
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
  IDLE_AFTER_DAYS,
  bestChannel,
  clientStatusLabel,
  countCracks,
  listClients,
  listDueOutreach,
  listWokenNurture,
  touchChannelLabel,
  type Client,
  type CrackCounts,
} from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { ChannelGlyph } from "@/components/channel-glyph"
import { LeadRow } from "@/components/lead-row"
import { NurtureWakes, type Wake } from "@/components/nurture-wakes"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  listInvoicesNeedingAction,
  type InvoiceNeedingAction,
} from "@/lib/finance"
import { daysSince, formatShortDay } from "@/lib/format"
import {
  daysWaiting,
  isProspect,
  isStale,
  prospectLabel,
  waitedLabel,
  whoLabel,
} from "@/lib/leads"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"
import { listStrip, type Ticket } from "@/lib/tickets"

export const metadata: Metadata = { title: "Needs you" }

// No `dynamic = "force-dynamic"` here on purpose. Awaiting searchParams already
// makes this request-time, and the Neon reads below are plain queries the Data
// Cache never touches — so it changed nothing about how fresh this feed is. It
// did set `fetchCache: "force-no-store"` across the segment, which overrode the
// revalidate on every GitHub read behind the strip. Once home started reading
// the board, that was the estate re-fetched from GitHub on every open of the
// app. See the header of `lib/tickets.ts`.

// Home. The dashboard used to open on the roster — everyone, longest-waiting
// first — which answered "who exists" when the only question you have at 8am is
// "what needs me". So the roster moved to /leads and this took its place: one
// prioritised list, nothing in it that doesn't want something.
//
// Sequence 6 of the lead-engine epic made it the daily cockpit as well: the
// outreach owed today, the parked relationships that have woken up, and — at
// the very foot, counted rather than listed — the two cracks nothing else on
// the screen would mention. That is Jamie's decision 5, and the reason there is
// no separate outreach destination in the nav: a thirty-minute morning block
// should be worked from the screen the app already opens on.
//
// The rule that shapes every row: a row either **acts in place** or
// **deep-links**. Nothing here edits something that has a proper home
// elsewhere. Marking a lead touched happens under the thumb, because there is
// nowhere better to send you for it. An invoice and a
// ticket are links — an invoice especially, because finalizing and emailing one
// is a deliberate click on Money and the estate's "no outbound action without
// review" rule does not bend for a feed.
//
// Sections render only when they have something. The empty feed is the point:
// a designed all-clear rather than a broken screen, because the app opening on
// "nothing needs you" is a good day.

// The fold budget. Every cap here is a share of one screenful on a phone,
// which is the constraint the whole feed is designed against — and it got
// tighter the day outreach and wakes joined it. So the two oldest sections gave
// a couple of rows back rather than the screen growing a third scroll.

/** How many rows a section shows before it stops and points at its own screen.
 *  A feed you have to scroll past is a feed you stop reading. */
const SECTION_LIMIT = 6

/** Tickets are the section you are least likely to act on from here, so it
 *  takes the smallest slice of the fold. */
const TICKET_LIMIT = 4

/** The estate's daily ritual number, and the breakdown's: ten is a morning's
 *  work. Anything past it rolls into tomorrow's queue rather than turning this
 *  section into a list nobody finishes — which is what a queue is *for*. */
const OUTREACH_LIMIT = 10

/** A wake is two taps, so a few of them cost almost nothing — but they are the
 *  least time-critical thing on the screen (the date already passed; another
 *  day changes nothing), so they take the smallest slice of all. */
const WAKE_LIMIT = 3


// ---------------------------------------------------------------------------
// Reads. Three sources, three failure modes, and none of them may take the
// others down: Neon is the app's spine, Stripe and GitHub are each optional
// and each says so in its own words when it is not there.

/** A row of the outreach queue, pre-formatted on the server — the feed reads
 *  the clock once, in `loadDb`, and nothing downstream reads it again. */
type DueRow = {
  id: string
  name: string
  /** What was decided, or null where a date was set and the step never was —
   *  which is a crack the row says out loud rather than rendering a blank. */
  action: string | null
  /** The door to reach for: the cadence's own answer, from what the row can
   *  actually be reached on. Null when it can be reached on nothing at all. */
  channel: string | null
  /** Whole days past the due date. 0 means it is owed today. */
  late: number
}

type DbReads = {
  /** When the read happened. Sampled here rather than during render — `now`
   *  is impure, and every "how late is this" on the screen has to be measured
   *  against one instant anyway. */
  now: number
  waiting: Client[]
  /** The outreach owed today, already capped and ordered by the crack-finder:
   *  overdue first, then fit tier. */
  due: DueRow[]
  /** Parked relationships whose date has come, capped the same way. */
  wakes: Wake[]
  /** How big each of the four cracks actually is — the two the feed lists (so
   *  each can admit what it left off) and the two it only counts. */
  cracks: CrackCounts
  /** Whether anyone is on a cadence at all. Without it an empty outreach
   *  section has no way to tell "worked it, done for the day" from "this
   *  business has no cold pool", and the first deserves saying out loud while
   *  the second is just a section nobody asked for. */
  onCadence: boolean
  error: string | null
}

async function loadDb(): Promise<DbReads> {
  const now = Date.now()
  // The same instant as a Date, for the crack-finder — it takes `now` so a page
  // and a script reading together agree on where today ends.
  const at = new Date(now)
  const empty = {
    now,
    waiting: [],
    due: [],
    wakes: [],
    cracks: { due: 0, unplanned: 0, woken: 0, idle: 0 },
    onCadence: false,
  }
  try {
    // Four reads, in parallel, and three of them are the crack-finder's — the
    // queue and the wakes as rows, everything else as one counting statement.
    // The lists are asked of the database rather than sliced out of `clients`
    // above on purpose: the ordering *is* the feature (overdue first, then fit
    // tier), it is written down once in packages/services, and the operator
    // scripts read the same functions.
    const [clients, due, woken, cracks] = await Promise.all([
      listClients({ archived: false }),
      listDueOutreach({ now: at, limit: OUTREACH_LIMIT }),
      listWokenNurture({ now: at, limit: WAKE_LIMIT }),
      countCracks({ now: at }),
    ])

    // Open leads past the staleness threshold, longest first. The list is
    // already sorted by who has waited longest, so the filter preserves it.
    // Prospects can never appear here: an imported business is not an open
    // lead, so `isStale` is false for the whole cold pool by construction —
    // which is what keeps this section six rows rather than ninety.
    //
    // Minus the ones already on the queue below. An open lead can be both
    // stale *and* owed a step today, and it would have been two rows about the
    // same person on a screen whose whole budget is one screenful. The queue
    // wins that tie: "call them back · 2 days late" is the work, and "waiting
    // 9 days" is only the alarm that goes off when nobody has decided.
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    const onQueue = (client: Client): boolean =>
      client.nextActionDue !== null &&
      client.nextActionDue.getTime() <= endOfToday.getTime()
    const waiting = clients.filter(
      (client) => isStale(client, now) && !onQueue(client)
    )

    return {
      now,
      waiting,
      // What to do, and which door to knock on. The channel is the cadence's
      // own `bestChannel` rather than a stored column: there isn't one, and
      // inventing it would mean a second place for "how do I reach these
      // people" to be wrong.
      due: due.map((row) => ({
        id: row.id,
        name: row.name,
        action: row.nextAction,
        channel: bestChannel(row),
        late: row.nextActionDue ? daysSince(row.nextActionDue, now) : 0,
      })),
      wakes: woken.map((row) => ({
        id: row.id,
        name: row.name,
        wakeLabel: formatShortDay(row.wakeAt),
        late: row.wakeAt ? daysSince(row.wakeAt, now) : 0,
        detail: prospectLabel(row),
      })),
      cracks,
      onCadence: clients.some((c) => isProspect(c) || c.nextActionDue !== null),
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

// The strip, not the board: this section shows a handful of rows and has no
// use for the repo sections /tickets folds. `listStrip()` shares its GitHub
// reads with that screen through the Data Cache, so home costs the estate's
// trees at worst and usually nothing at all.
async function loadTickets(): Promise<TicketReads> {
  try {
    const board = await listStrip()
    if (!board.configured) {
      return {
        strip: [],
        note: "GitHub isn't configured here, so today's tickets aren't part of this list.",
      }
    }
    if (board.dbError) return { strip: [], note: null }
    const unreachable = board.errors.map((e) => e.repo.slug)
    // Two different absences, and the feed says which. A named repo that
    // couldn't be read is a gap in a known list; a failed roster call means
    // the list itself is short, and reading that as "no tickets" is what the
    // outage did.
    const notes = [
      board.rosterError
        ? `Couldn't list the estate's repos — ${board.rosterError}`
        : null,
      unreachable.length > 0
        ? `Couldn't read ${unreachable.join(", ")} — tickets there aren't in this list.`
        : null,
    ].filter((n): n is string => n !== null)
    return { strip: board.strip, note: notes.join(" ") || null }
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

  // What the subtitle counts: everything owed, in full rather than as shown —
  // the sections cap themselves and say so in their own footers. Nobody is
  // counted twice: a stale lead that is also owed a step today was already
  // handed to the queue above. The two quiet
  // cracks are deliberately not in it. They are gaps, not obligations (decision
  // 7: enforcement is gentle), and a business with eighty unworked prospects
  // would otherwise open the app to a three-figure number every morning.
  const count =
    db.waiting.length +
    db.cracks.due +
    db.cracks.woken +
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

        {/* The day's block. It sits below the section with a real deadline on
            it — somebody waiting on a reply — and above everything that is a
            link rather than a task. */}
        {db.due.length > 0 ? (
          <OutreachDue rows={db.due} total={db.cracks.due} />
        ) : db.onCadence && !allClear ? (
          <OutreachClear />
        ) : null}

        {db.wakes.length > 0 ? (
          <NurtureWakes
            wakes={db.wakes}
            more={db.cracks.woken - db.wakes.length}
          />
        ) : null}

        {money.invoices.length > 0 ? (
          <MoneyNeedingAction invoices={money.invoices} />
        ) : null}

        {tickets.strip.length > 0 ? (
          <TodaysTickets strip={tickets.strip} />
        ) : null}

        {allClear ? <AllClear partial={notes.length > 0} /> : null}

        {/* Last, and quiet on purpose: these two inform, they never nag. */}
        <QuietCracks unplanned={db.cracks.unplanned} idle={db.cracks.idle} />

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
// Outreach due — the day's block, and the reason the feed is the cockpit.

/** How late a row is, in the two words a queue is scanned on. Mono, because it
 *  is the figure this section is sorted on; tinted only once the date has
 *  actually passed, since a step owed today is on time. Compact on screen and
 *  spoken in full — "3d late" is a glance, not a sentence. */
function DueState({ late }: { late: number }) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        late > 0 ? "font-medium text-destructive" : "text-app-label-3"
      )}
    >
      <span aria-hidden>{late > 0 ? `${late}d late` : "Today"}</span>
      <span className="sr-only">
        {late > 0 ? `${late} ${late === 1 ? "day" : "days"} late` : "Due today"}
      </span>
    </span>
  )
}

/**
 * The outreach owed today — ten rows at most, overdue first and then by fit
 * tier, in whatever order the crack-finder handed them over. Nothing is
 * re-sorted here: the ordering is the model's, written down once in
 * packages/services, and a screen quietly disagreeing with it is how two
 * surfaces start calling for different leads.
 *
 * Every row deep-links. Working a touch means a channel, a draft and an
 * outcome, and all three live on the lead's own page — a queue that tried to
 * do it in place would be the profile again, badly, under the thumb.
 */
function OutreachDue({ rows, total }: { rows: DueRow[]; total: number }) {
  const more = total - rows.length

  return (
    <GroupedSection
      header="Outreach due"
      footer={
        more > 0
          ? `${more} more ${more === 1 ? "is" : "are"} owed. They roll into tomorrow's queue rather than down this screen — ten is a morning's work.`
          : "Overdue first, then fit tier. Tapping one opens them where the draft is written."
      }
    >
      {rows.map((row) => (
        <GroupedRow
          key={row.id}
          asChild
          // Which door to knock on, as a glyph — the cadence's own answer from
          // what this lead can actually be reached on.
          icon={<ChannelGlyph channel={row.channel} />}
          label={row.name}
          description={
            <>
              {/* The glyph is decorative, so the channel is named here for
                  anyone who can't see it — and only there, because the word
                  would cost the line the width the action needs. */}
              <span className="sr-only">
                {row.channel
                  ? `${touchChannelLabel(row.channel)}. `
                  : "No channel on file. "}
              </span>
              {/* A date can be set without a step ever being decided. That is
                  a crack, not a blank row, so it says so and the tap goes to
                  the one screen that can fix it. */}
              {row.action ?? "Nothing planned — open them and decide"}
            </>
          }
          value={<DueState late={row.late} />}
        >
          <ViewTransitionLink href={`/leads/${row.id}`} />
        </GroupedRow>
      ))}
    </GroupedSection>
  )
}

/** The queue, worked. This is the one empty state on the feed that renders
 *  while other sections still have rows, and it earns that: the whole point of
 *  a capped daily queue is that it *ends*, and a section that simply vanished
 *  would take the only evidence of it with it. It stays quiet when nobody is
 *  running a cadence at all, and it stands down entirely when the feed is
 *  already saying "nothing needs you" — that is the same sentence twice. */
function OutreachClear() {
  return (
    <GroupedSection header="Outreach due">
      <GroupedBlock>
        Nothing owed today. The queue fills itself again as the cadence comes
        round.
      </GroupedBlock>
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// Worth a look — the two cracks the feed counts rather than lists.

/** A count as the row's trailing figure. Mono, like every number on this
 *  tier — and deliberately not a badge: a badge is a nag, and these two are
 *  the gentle half of the invariant (decision 7). */
function Tally({ count }: { count: number }) {
  return <span className="font-mono tabular-nums">{count}</span>
}

/**
 * Two rows, at the very foot, in the quietest section on the screen.
 *
 * Neither is late and neither is a task — they are the shapes of a gap the
 * writes never refuse, so they inform and then get out of the way. A section
 * per problem would have made the feed a list of complaints; a count apiece,
 * below everything that is actually owed, is the whole reporting budget they
 * get. Each taps through to the leads list filtered to exactly the rows it
 * counted, so the number and the screen behind it can never disagree.
 */
function QuietCracks({
  unplanned,
  idle,
}: {
  unplanned: number
  idle: number
}) {
  if (unplanned === 0 && idle === 0) return null

  return (
    <GroupedSection
      header="Worth a look"
      footer="Neither is late. They are the two gaps nothing else on this screen would mention."
    >
      {unplanned > 0 ? (
        <GroupedRow
          asChild
          icon={<Flag />}
          label="Nothing planned next"
          description="Prospects and open leads with no next step, or one nobody dated"
          value={<Tally count={unplanned} />}
        >
          <Link href="/leads?crack=unplanned" />
        </GroupedRow>
      ) : null}

      {idle > 0 ? (
        <GroupedRow
          asChild
          icon={<Hourglass />}
          label="Gone quiet"
          description={`In discussion, and nothing has happened in ${IDLE_AFTER_DAYS} days`}
          value={<Tally count={idle} />}
        >
          <Link href="/leads?crack=idle" />
        </GroupedRow>
      ) : null}
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
// Today's tickets — today's picks, runs in flight and what's stuck, each
// deep-linked to its own ticket on the Tickets board.

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
            {more} more on the board —{" "}
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
          {/* Straight to the ticket on the board — the board is where a
              ticket opens, and every launcher on it is a session link a
              human sends. */}
          <Link
            href={`/tickets?${new URLSearchParams({ t: `${ticket.repo.slug}/${ticket.id}` })}`}
          />
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
          : "No lead has gone quiet, no outreach is owed, nothing is due, no invoice is waiting, and no ticket is up. Go and do the work."}
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
