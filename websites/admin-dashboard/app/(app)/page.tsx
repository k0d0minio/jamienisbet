import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  cn,
} from "@jamie-nisbet/ui"
import {
  customerStatuses,
  listClients,
  listOpenComplianceDates,
  listOpenTasks,
  openStatuses,
  type Client,
} from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { ArchiveChip, Chip } from "@/components/chip"
import { ClientActions } from "@/components/client-actions"
import { ClientCreateForm } from "@/components/client-create-form"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ComplianceList, type ComplianceItem } from "@/components/compliance-list"
import { DealBadges } from "@/components/deal-badges"
import { LeadRow } from "@/components/lead-row"
import { ViewTransitionLink } from "@/components/view-transition-link"
import { TaskList, type TaskItem, type TaskLead } from "@/components/task-list"
import { WorkingList } from "@/components/working-list"
import { daysSince, waitingLabel, whatsappUrl } from "@/lib/format"
import { formatMoney } from "@/lib/money"

export const metadata: Metadata = { title: "Leads" }
export const dynamic = "force-dynamic"

// The one screen the dashboard opens on: every lead and customer in a single
// list, longest-waiting first (the sort is done in the query). Everything else
// here is a small strip above it — the working list of todos and compliance
// dates — kept collapsed so the leads stay the page.
//
// On a phone the list is the whole screen: one rail of view chips, then rows
// that are each a single big tap target into the lead, carrying only what you
// scan for (how long they've waited, who they are, what it's worth) plus the
// two things worth doing without opening them — change status, call or email.
// The wide table is the desktop affordance, not the other way round.

// A lead nobody has touched in this long is overdue a nudge.
const STALE_AFTER_DAYS = 7

// The filters across the top. Each is a set of statuses; "all" means no filter.
// With the ladder down to three rungs plus `lost`, the three named chips are a
// clean partition of it — "Open" is new + talking, "Customers" is client — so
// their counts add up to All rather than overlapping.
const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "open", label: "Open", statuses: openStatuses },
  { key: "customers", label: "Customers", statuses: customerStatuses },
  { key: "lost", label: "Lost", statuses: ["lost"] },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

function isFilterKey(value: string | undefined): value is FilterKey {
  return FILTERS.some((f) => f.key === value)
}

function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact"
  if (source === "referral") return "Referral"
  return "Manual"
}

/** Days since the lead was last worked — intake counts as the first touch. */
function daysWaiting(client: Client, now: number): number {
  return daysSince(client.lastTouchedAt ?? client.createdAt, now)
}

function isOpen(client: Client): boolean {
  return (openStatuses as readonly string[]).includes(client.status)
}

/** Only an open lead can be "waiting" — a client or a lost one isn't owed a
 *  reply. */
function isStale(client: Client, now: number): boolean {
  return isOpen(client) && daysWaiting(client, now) >= STALE_AFTER_DAYS
}

// The figures worth knowing at a glance: what cash is still in play, what comes
// in every month, and what is being traded rather than invoiced. All are Jamie's
// own numbers off the profiles — Stripe is the authority on what has actually
// been invoiced and paid.
//
// Barter is kept out of the first two on purpose. A swap can be worth real money
// and still put nothing in the bank, so folding it into "in play" would quietly
// overstate the pipeline; it gets its own "in kind" figure instead.
function totals(rows: Client[]) {
  let pipeline = 0
  let monthly = 0
  let inKind = 0
  for (const row of rows) {
    if (row.valueMinor <= 0) continue
    const open = (openStatuses as readonly string[]).includes(row.status)
    const customer = (customerStatuses as readonly string[]).includes(row.status)

    if (row.dealType === "barter") {
      if (open || customer) inKind += row.valueMinor
    } else if (row.billingType === "monthly") {
      if (customer) monthly += row.valueMinor
    } else if (open) {
      pipeline += row.valueMinor
    }
  }
  return { pipeline, monthly, inKind }
}

/** What a lead is worth, rendered so a retainer never reads as a one-off. */
function valueLabel(client: Client): string | null {
  if (client.valueMinor <= 0) return null
  const amount = formatMoney(client.valueMinor, "eur")
  return client.billingType === "monthly" ? `${amount}/mo` : amount
}

/** The leading line of a phone row — what the list is sorted on. A client or a
 *  lost lead isn't waiting on anything, so it just reports when it last
 *  moved. */
function waitedLabel(days: number, open: boolean): string {
  if (days <= 0) return "Worked today"
  const elapsed = waitingLabel(days)
  return open ? `Waiting ${elapsed}` : `Last worked ${elapsed} ago`
}

// The line under the large title: whichever of the three totals are non-zero,
// separated by dots. Driven by a list rather than nested conditionals — with
// three figures the "is there one before me?" separator logic is where the bugs
// would live.
//
// A function rather than a component, and inline elements rather than a <p>,
// because this is handed to the header as its `subtitle` — which already sets
// the line in the app tier's subhead and owns the paragraph around it. Nothing
// to show returns nothing, so the header skips the line entirely rather than
// leaving an empty one under the title.
function totalsLine(
  figures: { amount: number; label: string }[]
): React.ReactNode {
  const shown = figures.filter((f) => f.amount > 0)
  if (shown.length === 0) return null

  return (
    <>
      {shown.map((figure, i) => (
        <span key={figure.label}>
          {i > 0 ? " · " : null}
          {/* Figures in mono — the brand's signature, on every tier. */}
          <span className="font-mono font-medium text-app-label">
            {formatMoney(figure.amount, "eur")}
          </span>{" "}
          {figure.label}
        </span>
      ))}
    </>
  )
}

// Everything the page reads, gathered outside the component so the render stays
// pure — `now` is sampled once here rather than during render, and a DB error
// degrades into a banner instead of an empty page.
async function loadLeads(archived: boolean) {
  const now = Date.now()

  let rows: Client[] = []
  let leads: TaskLead[] = []
  let tasks: TaskItem[] = []
  let compliance: ComplianceItem[] = []
  let error: string | null = null

  try {
    const [clientRows, openTasks, openCompliance] = await Promise.all([
      listClients({ archived }),
      listOpenTasks(),
      listOpenComplianceDates(),
    ])
    rows = clientRows
    // Who a todo can be pointed at. The archive view lists archived leads, but
    // a todo is work still to do — so the picker is always the live ones, read
    // again only on the view where `rows` isn't already them.
    leads = (archived ? await listClients({ archived: false }) : clientRows).map(
      (c) => ({ id: c.id, name: c.name })
    )
    tasks = openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      clientId: t.clientId,
      clientName: t.clientName,
      dueDate: t.dueDate?.toISOString() ?? null,
      overdue: t.dueDate !== null && t.dueDate.getTime() < now,
      completed: false,
    }))
    compliance = openCompliance.map((c) => ({
      id: c.id,
      title: c.title,
      notes: c.notes,
      dueDate: c.dueDate.toISOString(),
      recurrence: c.recurrence,
      overdue: c.dueDate.getTime() < now,
    }))
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  return { now, rows, leads, tasks, compliance, error }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; filter?: string }>
}) {
  const params = await searchParams
  const archived = params.archived === "1"
  const filterKey: FilterKey = isFilterKey(params.filter) ? params.filter : "all"

  const { now, rows, leads, tasks, compliance, error } = await loadLeads(archived)

  const filter = FILTERS.find((f) => f.key === filterKey)!
  const visible = filter.statuses
    ? rows.filter((r) => (filter.statuses as readonly string[]).includes(r.status))
    : rows
  const { pipeline, monthly, inKind } = totals(rows)

  // Counts sit on the filter chips so the shape of the pipeline is readable
  // without clicking through each one.
  const countFor = (key: FilterKey): number => {
    const f = FILTERS.find((x) => x.key === key)!
    if (!f.statuses) return rows.length
    return rows.filter((r) => (f.statuses as readonly string[]).includes(r.status))
      .length
  }

  const hrefFor = (key: FilterKey, toArchive: boolean): string => {
    const parts: string[] = []
    if (toArchive) parts.push("archived=1")
    if (key !== "all") parts.push(`filter=${key}`)
    return parts.length > 0 ? `/?${parts.join("&")}` : "/"
  }

  const overdueCompliance = compliance.filter((c) => c.overdue).length
  const overdueTasks = tasks.filter((t) => t.overdue).length

  return (
    // The screen's name sets large and hands off to the compact bar on scroll;
    // what the list adds up to rides under it as the subtitle.
    <AppScreen
      title="Leads"
      subtitle={totalsLine([
        { amount: pipeline, label: "in play" },
        { amount: monthly, label: "/ month" },
        { amount: inKind, label: "in kind" },
      ])}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <ArchiveChip href={hrefFor(filterKey, !archived)} archived={archived} />
          {/* Renders the desktop button here and, on a phone, a floating one. */}
          {!archived ? <ClientCreateForm /> : null}
        </div>

        {/* The status filters, as a rail that scrolls sideways rather than
            wrapping — a second row of chips would push the list down the screen
            on exactly the width where that hurts most. */}
        <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              href={hrefFor(f.key, archived)}
              active={f.key === filterKey}
              count={countFor(f.key)}
            >
              {f.label}
            </Chip>
          ))}
        </div>

        {/* The working list — todos and compliance dates. Collapsed by default so
            the leads stay the page; the summary line carries anything overdue. */}
        <WorkingList
          openTasks={tasks.length}
          overdueTasks={overdueTasks}
          openCompliance={compliance.length}
          overdueCompliance={overdueCompliance}
        >
          <div className="flex flex-col gap-6 border-t px-4 py-4">
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">Todos</h2>
              <TaskList tasks={tasks} leads={leads} />
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                Compliance dates
              </h2>
              <p className="text-xs text-muted-foreground">
                Decision-support only — every date needs confirmation by your
                contabilista.
              </p>
              <ComplianceList items={compliance} />
            </section>
          </div>
        </WorkingList>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Database unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {visible.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {archived
                ? "Nothing archived."
                : rows.length === 0
                  ? "No leads yet — add the first one."
                  : "Nothing under this filter."}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Phone: one compact row per lead — two lines, no controls in the
                body. The whole row is the tap target into the profile; the
                actions ride behind it as gestures. Swipe left: call, email,
                archive (restore/delete in the archive view). Swipe right: mark
                touched. Status is read here and changed on the lead's page, one
                tap away — the dropdown per row was most of the old chunk. */}
            <ul className="flex flex-col gap-2 md:hidden">
              {visible.map((row) => {
                const stale = isStale(row, now)
                const value = valueLabel(row)
                return (
                  <li key={row.id}>
                    <LeadRow
                      id={row.id}
                      name={row.name}
                      phone={row.phone}
                      email={row.email}
                      archived={archived}
                    >
                      {/* Into the profile and back is the move this screen makes
                          most; on a browser that supports it the two pages
                          cross-fade instead of hard-cutting. */}
                      <ViewTransitionLink
                        href={`/leads/${row.id}`}
                        className="flex flex-col gap-0.5 bg-card px-4 py-3 transition-colors active:bg-muted/50"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[15px] leading-snug font-medium">
                            {row.name}
                          </span>
                          {value ? (
                            <span className="shrink-0 text-sm font-medium tabular-nums">
                              {value}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-baseline justify-between gap-3 text-xs">
                          <span
                            className={cn(
                              "truncate",
                              stale
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            {waitedLabel(daysWaiting(row, now), isOpen(row))}
                            {row.company ? ` · ${row.company}` : ""}
                          </span>
                          <span className="shrink-0 text-muted-foreground capitalize">
                            {row.status}
                          </span>
                        </span>
                        {/* Barter, commission, equity, started — only the rows
                            that carry them grow a third line. */}
                        <DealBadges client={row} className="mt-1" />
                      </ViewTransitionLink>
                    </LeadRow>
                  </li>
                )
              })}
            </ul>

            {/* Desktop: table. */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Waiting</th>
                        <th className="px-4 py-3 font-medium">Lead</th>
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium text-right">Value</th>
                        <th className="px-4 py-3 font-medium">Deal</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => {
                        const stale = isStale(row, now)
                        const value = valueLabel(row)
                        return (
                          <tr key={row.id} className="border-b align-top last:border-0">
                            <td
                              className={cn(
                                "whitespace-nowrap px-4 py-3",
                                stale
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground"
                              )}
                            >
                              {waitingLabel(daysWaiting(row, now))}
                            </td>
                            <td className="px-4 py-3">
                              <ViewTransitionLink
                                href={`/leads/${row.id}`}
                                className="font-medium underline-offset-2 hover:underline"
                              >
                                {row.name}
                              </ViewTransitionLink>
                              <div className="text-muted-foreground">
                                {row.company ?? sourceLabel(row.source)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {row.email ? (
                                <div>
                                  <a
                                    className="underline underline-offset-2"
                                    href={`mailto:${row.email}`}
                                  >
                                    {row.email}
                                  </a>
                                </div>
                              ) : null}
                              {/* The number reads as itself but opens the
                                  WhatsApp chat — never dials. */}
                              {row.phone ? (
                                <a
                                  className="text-muted-foreground underline underline-offset-2"
                                  href={whatsappUrl(row.phone)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {row.phone}
                                </a>
                              ) : null}
                              {!row.email && !row.phone ? (
                                <span className="text-muted-foreground">—</span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              {value ?? <span className="text-muted-foreground">—</span>}
                            </td>
                            {/* How it's settled, beside what it's worth — the two
                                only mean anything together. Empty for the ordinary
                                cash deal that hasn't started yet. */}
                            <td className="px-4 py-3">
                              <DealBadges client={row} />
                            </td>
                            <td className="px-4 py-3">
                              <ClientStatusSelect id={row.id} value={row.status} />
                            </td>
                            {/* Icons only: archive and delete are rare next to
                                everything else in the row, and spelling them out
                                gave the least-used column the most width. */}
                            <td className="px-4 py-3">
                              <ClientActions
                                id={row.id}
                                archived={archived}
                                compact
                                className="justify-end"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppScreen>
  )
}
