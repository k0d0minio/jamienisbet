import type { Metadata } from "next"
import Link from "next/link"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
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

import { ArchiveToggle } from "@/components/archive-toggle"
import { ClientActions } from "@/components/client-actions"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ComplianceList, type ComplianceItem } from "@/components/compliance-list"
import { LeadCreateForm } from "@/components/lead-create-form"
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

/** Only an open lead can be "waiting" — a won or lost one isn't owed anything. */
function isStale(client: Client, now: number): boolean {
  return (
    (openStatuses as readonly string[]).includes(client.status) &&
    daysWaiting(client, now) >= STALE_AFTER_DAYS
  )
}

// The two figures worth knowing at a glance: what's still in play, and what
// comes in every month. Both are Jamie's own numbers off the profiles — Stripe
// is the authority on what has actually been invoiced and paid.
function totals(rows: Client[]) {
  let pipeline = 0
  let monthly = 0
  for (const row of rows) {
    if (row.valueMinor <= 0) continue
    if (row.billingType === "monthly") {
      if ((customerStatuses as readonly string[]).includes(row.status)) {
        monthly += row.valueMinor
      }
    } else if ((openStatuses as readonly string[]).includes(row.status)) {
      pipeline += row.valueMinor
    }
  }
  return { pipeline, monthly }
}

/** What a lead is worth, rendered so a retainer never reads as a one-off. */
function valueLabel(client: Client): string | null {
  if (client.valueMinor <= 0) return null
  const amount = formatMoney(client.valueMinor, "eur")
  return client.billingType === "monthly" ? `${amount}/mo` : amount
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
  const { pipeline, monthly } = totals(rows)

  // Counts sit on the filter chips so the shape of the pipeline is readable
  // without clicking through each one.
  const countFor = (key: FilterKey): number => {
    const f = FILTERS.find((x) => x.key === key)!
    if (!f.statuses) return rows.length
    return rows.filter((r) => (f.statuses as readonly string[]).includes(r.status))
      .length
  }

  const overdueCompliance = compliance.filter((c) => c.overdue).length
  const overdueTasks = tasks.filter((t) => t.overdue).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <ArchiveToggle basePath="/" archived={archived} />
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

      {!archived ? <LeadCreateForm /> : null}

      {/* Filters + the money the list adds up to. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => {
            const active = f.key === filterKey
            const href =
              f.key === "all"
                ? archived
                  ? "/?archived=1"
                  : "/"
                : `/?${archived ? "archived=1&" : ""}filter=${f.key}`
            return (
              <Link
                key={f.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}{" "}
                <span className="text-xs tabular-nums opacity-70">
                  {countFor(f.key)}
                </span>
              </Link>
            )
          })}
        </div>
        {pipeline > 0 || monthly > 0 ? (
          <p className="text-sm text-muted-foreground">
            {pipeline > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {formatMoney(pipeline, "eur")}
                </span>{" "}
                in play
              </>
            ) : null}
            {pipeline > 0 && monthly > 0 ? " · " : null}
            {monthly > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {formatMoney(monthly, "eur")}
                </span>{" "}
                / month
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {archived
              ? "Nothing archived."
              : rows.length === 0
                ? "No leads yet — add the first one above."
                : "Nothing under this filter."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll. */}
          <div className="flex flex-col gap-3 md:hidden">
            {visible.map((row) => {
              const stale = isStale(row, now)
              const value = valueLabel(row)
              return (
                <Card key={row.id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${row.id}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {row.name}
                        </Link>
                        {row.company ? (
                          <div className="text-sm text-muted-foreground">
                            {row.company}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {value ? (
                          <span className="text-sm font-medium tabular-nums">
                            {value}
                          </span>
                        ) : null}
                        <Badge variant="secondary">
                          {sourceLabel(row.source)}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm">
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
                        <span className="text-muted-foreground">
                          No contact info
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "text-xs",
                        stale
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      Last worked {waitingLabel(daysWaiting(row, now))} ago
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                      <ClientStatusSelect id={row.id} value={row.status} />
                      <ClientActions id={row.id} archived={archived} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

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
