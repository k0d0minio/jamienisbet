import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Phone } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
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

import { ArchiveChip, Chip } from "@/components/chip"
import { ClientActions } from "@/components/client-actions"
import { ClientCreateForm } from "@/components/client-create-form"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ComplianceList, type ComplianceItem } from "@/components/compliance-list"
import { DealBadges } from "@/components/deal-badges"
import { TaskList, type TaskItem } from "@/components/task-list"
import { WorkingList } from "@/components/working-list"
import { daysSince, waitingLabel } from "@/lib/format"
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

/** Only an open lead can be "waiting" — a won or lost one isn't owed anything. */
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

/** The leading line of a phone row — what the list is sorted on. A won or lost
 *  lead isn't waiting on anything, so it just reports when it last moved. */
function waitedLabel(days: number, open: boolean): string {
  if (days <= 0) return "Worked today"
  const elapsed = waitingLabel(days)
  return open ? `Waiting ${elapsed}` : `Last worked ${elapsed} ago`
}

// The subtitle under the page title: whichever of the three totals are non-zero,
// separated by dots. Driven by a list rather than nested conditionals — with
// three figures the "is there one before me?" separator logic is where the bugs
// would live.
function TotalsLine({
  figures,
}: {
  figures: { amount: number; label: string }[]
}) {
  const shown = figures.filter((f) => f.amount > 0)
  if (shown.length === 0) return null

  return (
    <p className="text-sm text-muted-foreground">
      {shown.map((figure, i) => (
        <span key={figure.label}>
          {i > 0 ? " · " : null}
          <span className="font-medium text-foreground">
            {formatMoney(figure.amount, "eur")}
          </span>{" "}
          {figure.label}
        </span>
      ))}
    </p>
  )
}

// Tap-to-call / tap-to-email straight off the row — on a phone these are the
// actions, not decoration next to an address you'd copy with a mouse.
function ContactButton({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: typeof Phone
}) {
  return (
    <Button asChild variant="ghost" size="icon-sm" aria-label={label}>
      <a href={href}>
        <Icon />
      </a>
    </Button>
  )
}

// Everything the page reads, gathered outside the component so the render stays
// pure — `now` is sampled once here rather than during render, and a DB error
// degrades into a banner instead of an empty page.
async function loadLeads(archived: boolean) {
  const now = Date.now()

  let rows: Client[] = []
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
    tasks = openTasks.map((t) => ({
      id: t.id,
      title: t.title,
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

  return { now, rows, tasks, compliance, error }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; filter?: string }>
}) {
  const params = await searchParams
  const archived = params.archived === "1"
  const filterKey: FilterKey = isFilterKey(params.filter) ? params.filter : "all"

  const { now, rows, tasks, compliance, error } = await loadLeads(archived)

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
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Title, and what the list adds up to as its subtitle — on a phone that
          reads as one block instead of a heading with a figure floated beside
          it that wraps onto its own line anyway. */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold">Leads</h1>
          <TotalsLine
            figures={[
              { amount: pipeline, label: "in play" },
              { amount: monthly, label: "/ month" },
              { amount: inKind, label: "in kind" },
            ]}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ArchiveChip href={hrefFor(filterKey, !archived)} archived={archived} />
          {/* Renders the desktop button here and, on a phone, a floating one. */}
          {!archived ? <ClientCreateForm /> : null}
        </div>
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
            <TaskList tasks={tasks} />
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
          {/* Phone: one row per lead. The card body is a single stretched tap
              target into the profile; the strip under it holds the only two
              things worth doing without opening them. Archive and delete are
              deliberately not here — they live on the lead's own page, one tap
              away, except in the archive where restoring is the whole point. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {visible.map((row) => {
              const stale = isStale(row, now)
              const value = valueLabel(row)
              return (
                <li
                  key={row.id}
                  className="relative rounded-lg border bg-card text-card-foreground"
                >
                  <Link
                    href={`/leads/${row.id}`}
                    className="flex flex-col gap-1 rounded-t-lg px-4 pt-3 pb-2 transition-colors after:absolute after:inset-0 after:rounded-lg active:bg-muted/50"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          stale ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {waitedLabel(daysWaiting(row, now), isOpen(row))}
                      </span>
                      {value ? (
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {value}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-base leading-tight font-medium">
                      {row.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {row.company
                        ? `${row.company} · ${sourceLabel(row.source)}`
                        : sourceLabel(row.source)}
                    </span>
                    {/* Barter, commission, equity, work started — below the
                        name rather than beside the figure, where they'd fight
                        the amount for the same corner of a narrow card. */}
                    <DealBadges client={row} className="mt-1" />
                  </Link>

                  {/* Above the stretched link, so these stay tappable. */}
                  <div className="relative z-10 flex items-center gap-2 border-t px-3 py-2">
                    <ClientStatusSelect
                      id={row.id}
                      value={row.status}
                      className="w-32"
                    />
                    <div className="ml-auto flex items-center gap-1">
                      {row.phone ? (
                        <ContactButton
                          href={`tel:${row.phone}`}
                          label={`Call ${row.name}`}
                          icon={Phone}
                        />
                      ) : null}
                      {row.email ? (
                        <ContactButton
                          href={`mailto:${row.email}`}
                          label={`Email ${row.name}`}
                          icon={Mail}
                        />
                      ) : null}
                      {archived ? (
                        <ClientActions id={row.id} archived compact />
                      ) : null}
                    </div>
                  </div>
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
                            <Link
                              href={`/leads/${row.id}`}
                              className="font-medium underline-offset-2 hover:underline"
                            >
                              {row.name}
                            </Link>
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
                            {row.phone ? (
                              <a
                                className="text-muted-foreground underline underline-offset-2"
                                href={`tel:${row.phone}`}
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
                          <td className="px-4 py-3">
                            <ClientActions id={row.id} archived={archived} />
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
  )
}
