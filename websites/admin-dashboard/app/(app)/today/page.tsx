import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import {
  listClients,
  listDeals,
  listDocumentsForDeal,
  listOpenComplianceDates,
  listOpenTasks,
  parsePaymentSchedule,
  type Client,
  type Deal,
} from "@jamie-nisbet/services"

import { ComplianceList, type ComplianceItem } from "@/components/compliance-list"
import { TaskList, type TaskItem } from "@/components/task-list"
import { listInvoices, type InvoiceRow } from "@/lib/finance"
import { formatMoney } from "@/lib/money"
import { nextActionFor, type NextAction } from "@/lib/next-action"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Today" }
export const dynamic = "force-dynamic"

// The morning brief — the dashboard page that replaced the markdown tracker/.
// Everything derivable is derived live (deal next-actions, stale leads,
// receivables); only manual todos and the compliance calendar are stored rows.

const OPEN_DEAL = ["new", "qualified", "proposed"]
const STALE_STATUSES = ["new", "contacted", "qualified"]
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000
// Enough for a one-person pipeline; a cap so a busy day can't unbounded-fan-out
// the per-deal document reads.
const MAX_NEXT_ACTIONS = 8

type DealAction = {
  deal: Deal
  clientName: string
  action: NextAction
}

async function readDealActions(
  deals: Deal[],
  clientsById: Map<string, Client>
): Promise<DealAction[]> {
  const open = deals.filter((d) => OPEN_DEAL.includes(d.status))
  const capped = open.slice(0, MAX_NEXT_ACTIONS)
  return Promise.all(
    capped.map(async (deal) => {
      const docs = await listDocumentsForDeal(deal.id)
      return {
        deal,
        clientName: clientsById.get(deal.clientId)?.name ?? "Client",
        action: nextActionFor(
          docs.map((d) => ({ id: d.id, kind: d.kind, status: d.status })),
          parsePaymentSchedule(deal)
        ),
      }
    })
  )
}

function staleLeads(clients: Client[], now: number): Client[] {
  return clients
    .filter((c) => STALE_STATUSES.includes(c.status))
    .filter((c) => {
      const last = (c.lastTouchedAt ?? c.createdAt).getTime()
      return now - last > STALE_AFTER_MS
    })
    .sort(
      (a, b) =>
        (a.lastTouchedAt ?? a.createdAt).getTime() -
        (b.lastTouchedAt ?? b.createdAt).getTime()
    )
}

function daysAgo(date: Date, now: number): number {
  return Math.floor((now - date.getTime()) / (24 * 60 * 60 * 1000))
}

// Everything /today reads, gathered outside the component so the render stays
// pure. Each section degrades independently — a Stripe outage never hides the
// pipeline, and a DB error never hides the money.
async function loadToday() {
  const now = Date.now()

  let dealActions: DealAction[] = []
  let stale: Client[] = []
  let tasks: TaskItem[] = []
  let compliance: ComplianceItem[] = []
  let dbError: string | null = null

  try {
    const [clients, deals, openTasks, openCompliance] = await Promise.all([
      listClients(),
      listDeals(),
      listOpenTasks(),
      listOpenComplianceDates(),
    ])
    const clientsById = new Map(clients.map((c) => [c.id, c]))
    dealActions = await readDealActions(deals, clientsById)
    stale = staleLeads(clients, now)
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
    dbError = err instanceof Error ? err.message : "Could not reach the database."
  }

  // Overdue + open invoices, straight from Stripe (the money source of truth).
  let overdueInvoices: InvoiceRow[] = []
  let openInvoices: InvoiceRow[] = []
  const stripeConfigured = isStripeConfigured()
  if (stripeConfigured) {
    try {
      const invoices = (await listInvoices(50)) ?? []
      const nowSec = Math.floor(now / 1000)
      const open = invoices.filter((inv) => inv.status === "open")
      overdueInvoices = open.filter(
        (inv) => inv.dueDate !== null && inv.dueDate < nowSec
      )
      openInvoices = open.filter(
        (inv) => !(inv.dueDate !== null && inv.dueDate < nowSec)
      )
    } catch {
      // Leave both empty; the section shows its not-available state.
    }
  }

  return {
    now,
    dealActions,
    stale,
    tasks,
    compliance,
    dbError,
    stripeConfigured,
    overdueInvoices,
    openInvoices,
  }
}

export default async function TodayPage() {
  const {
    now,
    dealActions,
    stale,
    tasks,
    compliance,
    dbError,
    stripeConfigured,
    overdueInvoices,
    openInvoices,
  } = await loadToday()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Today</h1>

      {dbError && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base">Database unavailable</CardTitle>
            <CardDescription>{dbError}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Deal next-actions — the pipeline's "what now", one row per open deal. */}
      <Card>
        <CardHeader>
          <CardDescription>Pipeline</CardDescription>
          <CardTitle className="text-lg">Next actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {dealActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open deals — new intake lands under Clients.
            </p>
          ) : (
            dealActions.map(({ deal, clientName, action }) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {action.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {clientName} · {deal.title}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Stale leads — nobody waits more than a week without a touch. */}
      <Card>
        <CardHeader>
          <CardDescription>Leads</CardDescription>
          <CardTitle className="text-lg">Waiting on a touch</CardTitle>
          <CardDescription>
            Leads in new / contacted / qualified with no activity for 7+ days.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {stale.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody is waiting — every active lead was touched this week.
            </p>
          ) : (
            stale.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {client.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {daysAgo(client.lastTouchedAt ?? client.createdAt, now)} days
                    since last touch
                  </span>
                </span>
                <Badge variant="outline" className="capitalize">
                  {client.status}
                </Badge>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Money — overdue first, straight from Stripe. */}
      <Card>
        <CardHeader>
          <CardDescription>Money</CardDescription>
          <CardTitle className="text-lg">Receivables</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {!stripeConfigured ? (
            <p className="text-sm text-muted-foreground">
              Needs Stripe — set <code>STRIPE_SECRET_KEY</code> (see{" "}
              <code>.env.example</code>).
            </p>
          ) : overdueInvoices.length === 0 && openInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing outstanding.
            </p>
          ) : (
            <>
              {[...overdueInvoices, ...openInvoices].map((inv) => (
                <Link
                  key={inv.id}
                  href="/invoices"
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {inv.customerName ?? inv.customerEmail ?? inv.number ?? inv.id}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {inv.number ?? "no number"}
                    </span>
                  </span>
                  {overdueInvoices.includes(inv) && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                  <span className="text-sm font-medium">
                    {formatMoney(inv.amountDue, inv.currency)}
                  </span>
                </Link>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Compliance calendar — decision-support only. */}
      <Card>
        <CardHeader>
          <CardDescription>Compliance</CardDescription>
          <CardTitle className="text-lg">Deadlines</CardTitle>
          <CardDescription>
            Decision-support only — every date and amount needs confirmation by
            your contabilista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceList items={compliance} />
        </CardContent>
      </Card>

      {/* Manual todos. */}
      <Card>
        <CardHeader>
          <CardDescription>Todos</CardDescription>
          <CardTitle className="text-lg">On your list</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  )
}
