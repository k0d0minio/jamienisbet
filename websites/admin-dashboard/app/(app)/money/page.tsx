import type { Metadata } from "next"
import { Receipt, TriangleAlert } from "lucide-react"

import {
  GlanceFigure,
  GlanceRow,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
} from "@jamie-nisbet/ui"
import { listClients } from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { InvoiceActions } from "@/components/invoice-actions"
import {
  InvoiceCreateForm,
  type InvoiceClientOption,
} from "@/components/invoice-create-form"
import { PaymentLinkActions } from "@/components/payment-link-actions"
import { PaymentLinkCreateForm } from "@/components/payment-link-create-form"
import {
  getFinancialSummary,
  listInvoices,
  listPaymentLinks,
  listRecentPayments,
  type BalanceEntry,
  type FinancialSummary,
  type InvoiceRow,
  type PaymentLinkRow,
  type PaymentRow,
} from "@/lib/finance"
import { formatEpoch } from "@/lib/format"
import { invoiceState } from "@/lib/invoice-state"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Money" }
export const dynamic = "force-dynamic"

// One screen for everything money: what's in the account, what's owed, and the
// two ways to ask for it. Every figure is read live from Stripe, which stays
// the source of truth — nothing about an amount comes from the browser.
//
// The screen's name sets large and hands off to the compact bar on scroll;
// under it, what the account adds up to is a glance row of mono figures rather
// than a wall of stat cards. Then three inset grouped lists — invoices, links,
// what landed — each opening with the row that creates one.
//
// The desktop tables are gone. A table only ever worked on the wide end, and
// keeping one meant every row existed twice, in two layouts, with two sets of
// controls. Now a row is a row from phone to laptop, and the controls it used
// to carry live in the sheet behind it, where an action sheet belongs.

// ---------------------------------------------------------------------------
// Reads

/** Everything the screen shows, and whichever parts of it Stripe refused. */
type MoneyData = {
  now: number // epoch seconds, sampled once off the render path
  summary: FinancialSummary | null
  invoices: InvoiceRow[] | null
  links: PaymentLinkRow[] | null
  payments: PaymentRow[] | null
  /** The first message from whichever reads failed, for the stated failure. */
  error: string | null
  /** Stripe gave us nothing at all — the screen has no content to degrade to. */
  down: boolean
}

function reason(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === "fulfilled") return null
  const err = result.reason
  return err instanceof Error ? err.message : "Could not reach Stripe."
}

// Four independent round-trips, settled independently. They used to be one
// Promise.all, so a single slow or refused call — the links read makes a
// sub-request per link — took the balance and the invoices down with it. Now a
// section that can't be read says so and the rest of the screen stands.
async function loadMoney(): Promise<MoneyData> {
  const now = Math.floor(Date.now() / 1000)
  const [summary, invoices, links, payments] = await Promise.allSettled([
    getFinancialSummary(),
    listInvoices(30),
    listPaymentLinks(30),
    listRecentPayments(10),
  ])
  const results = [summary, invoices, links, payments]

  return {
    now,
    summary: summary.status === "fulfilled" ? summary.value : null,
    invoices: invoices.status === "fulfilled" ? invoices.value : null,
    links: links.status === "fulfilled" ? links.value : null,
    payments: payments.status === "fulfilled" ? payments.value : null,
    error: results.map(reason).find(Boolean) ?? null,
    down: results.every((r) => r.status === "rejected"),
  }
}

// ---------------------------------------------------------------------------
// The glance row

type Figure = { key: string; value: string; label: string }

// What the account adds up to, as at most a few mono figures under the title.
//
// A figure of nothing is omitted rather than shown as a zero — a balance of
// €0.00 pending is noise, not news, and the row would rather hold two figures
// well than five badly. Jamie bills in one currency in practice, so the
// currency only earns a place in a label when there is more than one in play.
function glanceFigures(summary: FinancialSummary | null): Figure[] {
  if (!summary) return []

  const groups: { label: string; entries: BalanceEntry[] }[] = [
    { label: "Available", entries: summary.available },
    { label: "Pending", entries: summary.pending },
    { label: "Outstanding", entries: summary.outstanding },
  ]

  const currencies = new Set<string>()
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.amount !== 0) currencies.add(entry.currency)
    }
  }
  const multi = currencies.size > 1

  const figures: Figure[] = []
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.amount === 0) continue
      figures.push({
        key: `${group.label}-${entry.currency}`,
        value: formatMoney(entry.amount, entry.currency),
        label: multi
          ? `${group.label} · ${entry.currency.toUpperCase()}`
          : group.label,
      })
    }
  }
  return figures
}

// ---------------------------------------------------------------------------

export default async function MoneyPage() {
  // No key, no screen — but a stated absence rather than a broken one, the way
  // every missing-configuration case in this app degrades.
  if (!isStripeConfigured()) {
    return (
      <AppScreen title="Money">
        <div className="flex flex-col gap-app-section pt-1 pb-2">
          <GroupedSection footer="Everything else in the app works without it.">
            <GroupedRow
              icon={<Receipt />}
              label="Stripe isn't configured here"
              chevron={false}
            />
            <GroupedBlock>
              Set <span className="font-mono">STRIPE_SECRET_KEY</span> in this
              environment to see the balance and raise invoices and payment
              links. The variable is listed in{" "}
              <span className="font-mono">.env.example</span>.
            </GroupedBlock>
          </GroupedSection>
        </div>
      </AppScreen>
    )
  }

  const { now, summary, invoices, links, payments, error, down } =
    await loadMoney()

  // Leads populate the invoice picker. A DB hiccup here shouldn't take down the
  // whole screen — fall back to an empty list, and the sheet says why.
  let clientOptions: InvoiceClientOption[] = []
  try {
    const clients = await listClients()
    clientOptions = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
    }))
  } catch {
    clientOptions = []
  }

  const figures = glanceFigures(summary)

  return (
    <AppScreen
      title="Money"
      masthead={
        figures.length > 0 ? (
          <GlanceRow>
            {figures.map((figure) => (
              <GlanceFigure
                key={figure.key}
                value={figure.value}
                label={figure.label}
              />
            ))}
          </GlanceRow>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-app-section pt-1 pb-2">
        {/* Stripe is the whole screen, so a failure to reach it is stated in
            plain words rather than left as three empty lists. */}
        {error ? (
          <GroupedSection>
            <GroupedRow
              icon={<TriangleAlert />}
              label={down ? "Stripe unavailable" : "Some of this didn't load"}
              variant="destructive"
              chevron={false}
            />
            <GroupedBlock>{error}</GroupedBlock>
          </GroupedSection>
        ) : null}

        {down ? null : (
          <>
            <Invoices
              rows={invoices}
              clients={clientOptions}
              openCount={summary?.openInvoiceCount ?? null}
              now={now}
            />

            {/* Two short lists side by side once there is width for them — the
                iPad reading of the same groups, not a different layout. */}
            <div className="flex flex-col gap-app-section lg:grid lg:grid-cols-2 lg:items-start">
              <PaymentLinks rows={links} />
              <RecentPayments rows={payments} />
            </div>
          </>
        )}
      </div>
    </AppScreen>
  )
}

// ---------------------------------------------------------------------------
// Invoices — raise a draft, then finalize & send as a deliberate step.
//
// `id` is the Needs you feed's landing point: its Money rows find the invoice
// that needs deciding on and send you here, where deciding actually happens.
// `scroll-mt-app-bar` keeps the section's header clear of the compact title
// bar the deep link scrolls it under.

function Invoices({
  rows,
  clients,
  openCount,
  now,
}: {
  rows: InvoiceRow[] | null
  clients: InvoiceClientOption[]
  openCount: number | null
  now: number
}) {
  const open = openCount ?? 0

  return (
    <GroupedSection
      id="invoices"
      className="scroll-mt-app-bar"
      header="Invoices"
      footer={
        // The standing rule, said where it is obeyed. The count of what is
        // still owed rides in front of it, since it is the same list.
        `${open > 0 ? `${open} still open. ` : ""}A new invoice is created as a draft — finalizing it and emailing it is a separate, deliberate step.`
      }
    >
      <InvoiceCreateForm clients={clients} />

      {rows === null ? (
        <GroupedBlock>Couldn&rsquo;t read the invoices from Stripe.</GroupedBlock>
      ) : rows.length === 0 ? (
        <GroupedBlock>
          Nothing raised yet. A new one stays a draft until you send it, so
          there is no harm in starting it early.
        </GroupedBlock>
      ) : (
        rows.map((row) => (
          <InvoiceActions
            key={row.id}
            invoice={{
              id: row.id,
              isDraft: row.isDraft,
              state: invoiceState(row.status, row.dueDate, now),
              who: row.customerName ?? row.number ?? "Invoice",
              amount: formatMoney(row.amountDue, row.currency),
              number: row.number,
              created: formatEpoch(row.createdDate),
              due: row.dueDate ? formatEpoch(row.dueDate) : null,
              email: row.customerEmail,
              hostedInvoiceUrl: row.hostedInvoiceUrl,
            }}
          />
        ))
      )}
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// Payment links — a shareable, fixed-amount URL.

function PaymentLinks({ rows }: { rows: PaymentLinkRow[] | null }) {
  return (
    <GroupedSection
      header="Payment links"
      footer="A link is only outbound once you copy it and share it."
    >
      <PaymentLinkCreateForm />

      {rows === null ? (
        <GroupedBlock>
          Couldn&rsquo;t read the payment links from Stripe.
        </GroupedBlock>
      ) : rows.length === 0 ? (
        <GroupedBlock>
          None yet. A link is the quickest way to be paid for something with a
          fixed price — a discovery call, a fixed-scope audit.
        </GroupedBlock>
      ) : (
        rows.map((row) => (
          <PaymentLinkActions
            key={row.id}
            link={{
              id: row.id,
              url: row.url,
              active: row.active,
              product: row.productName ?? "Untitled link",
              amount:
                row.amount !== null && row.currency
                  ? formatMoney(row.amount, row.currency)
                  : null,
            }}
          />
        ))
      )}
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// What actually landed. Read-only: a row with a receipt opens it, one without
// is a ledger line and says nothing when you press it.

function RecentPayments({ rows }: { rows: PaymentRow[] | null }) {
  return (
    <GroupedSection header="Recent payments">
      {rows === null ? (
        <GroupedBlock>Couldn&rsquo;t read the payments from Stripe.</GroupedBlock>
      ) : rows.length === 0 ? (
        <GroupedBlock>
          Nothing has landed yet. Paid invoices and links both show up here.
        </GroupedBlock>
      ) : (
        rows.map((payment) => (
          <GroupedRow
            key={payment.id}
            label={payment.description ?? "Payment"}
            description={
              <span className="capitalize">
                {formatEpoch(payment.createdDate)} · {payment.status}
              </span>
            }
            value={
              <span className="font-mono tabular-nums">
                {formatMoney(payment.amount, payment.currency)}
              </span>
            }
            // A receipt makes the row a link out to Stripe's hosted copy;
            // without one there is nowhere to go, so it loses the chevron and
            // stays a ledger line.
            href={payment.receiptUrl ?? undefined}
            target={payment.receiptUrl ? "_blank" : undefined}
            rel={payment.receiptUrl ? "noreferrer" : undefined}
            chevron={payment.receiptUrl ? undefined : false}
          />
        ))
      )}
    </GroupedSection>
  )
}
