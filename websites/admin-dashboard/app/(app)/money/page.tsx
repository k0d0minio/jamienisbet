import type { Metadata } from "next"
import { Receipt, TriangleAlert } from "lucide-react"

import {
  RecordBlock,
  RecordRow,
  RecordSection,
} from "@jamie-nisbet/ui"
import { listClients } from "@jamie-nisbet/services"

import { DeskScreen } from "@/components/desk-screen"
import { MoneyFigure, MoneyFigures } from "@/components/money-figures"
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
import { formatEpochDay } from "@/lib/format"
import { invoiceState } from "@/lib/invoice-state"
import { isProspect } from "@/lib/leads"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Money" }
export const dynamic = "force-dynamic"

// One screen for everything money: what's in the account, what's owed, and the
// two ways to ask for it. Every figure is read live from Stripe, which stays
// the source of truth — nothing about an amount comes from the browser.
//
// The screen's name sits in a flat title bar; under it, what the account adds
// up to is a row of mono figures rather than a wall of stat cards. Then three
// records — invoices, links, what landed — each opening with the row that
// creates one.
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
// The figures

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
      <DeskScreen title="Money">
        <div className="flex flex-col gap-6 pt-1 pb-2">
          <RecordSection footer="Everything else in the app works without it.">
            <RecordRow
              icon={<Receipt />}
              label="Stripe isn't configured here"
              chevron={false}
            />
            <RecordBlock>
              Set <span className="font-mono">STRIPE_SECRET_KEY</span> in this
              environment to see the balance and raise invoices and payment
              links. The variable is listed in{" "}
              <span className="font-mono">.env.example</span>.
            </RecordBlock>
          </RecordSection>
        </div>
      </DeskScreen>
    )
  }

  const { now, summary, invoices, links, payments, error, down } =
    await loadMoney()

  // Leads populate the invoice picker. A DB hiccup here shouldn't take down the
  // whole screen — fall back to an empty list, and the sheet says why.
  //
  // The cold pool is not in it. A prospect is an imported business that has
  // never replied: there is nothing to invoice, no agreed figure, and no Stripe
  // customer — and eighty-odd of them would bury the handful of people you can
  // actually bill. One that gets as far as owing money has been moved up the
  // ladder by then, which is exactly when it appears here.
  let clientOptions: InvoiceClientOption[] = []
  try {
    const clients = await listClients()
    clientOptions = clients
      .filter((c) => !isProspect(c))
      .map((c) => ({
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
    <DeskScreen
      title="Money"
      masthead={
        figures.length > 0 ? (
          <MoneyFigures>
            {figures.map((figure) => (
              <MoneyFigure
                key={figure.key}
                value={figure.value}
                label={figure.label}
              />
            ))}
          </MoneyFigures>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6 pt-1 pb-2">
        {/* Stripe is the whole screen, so a failure to reach it is stated in
            plain words rather than left as three empty lists. */}
        {error ? (
          <RecordSection>
            <RecordRow
              icon={<TriangleAlert />}
              label={down ? "Stripe unavailable" : "Some of this didn't load"}
              variant="destructive"
              chevron={false}
            />
            <RecordBlock>{error}</RecordBlock>
          </RecordSection>
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
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
              <PaymentLinks rows={links} />
              <RecentPayments rows={payments} />
            </div>
          </>
        )}
      </div>
    </DeskScreen>
  )
}

// ---------------------------------------------------------------------------
// Invoices — raise a draft, then finalize & send as a deliberate step.
//
// `id` is the Needs you feed's landing point: its Money rows find the invoice
// that needs deciding on and send you here, where deciding actually happens.
// `scroll-mt-20` keeps the section's header clear of the sticky title bar the
// deep link scrolls it under.

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
    <RecordSection
      id="invoices"
      className="scroll-mt-20"
      header="Invoices"
      footer={
        // The standing rule, said where it is obeyed. The count of what is
        // still owed rides in front of it, since it is the same list.
        `${open > 0 ? `${open} still open. ` : ""}A new invoice is created as a draft — finalizing it and emailing it is a separate, deliberate step.`
      }
    >
      <InvoiceCreateForm clients={clients} />

      {rows === null ? (
        <RecordBlock>Couldn&rsquo;t read the invoices from Stripe.</RecordBlock>
      ) : rows.length === 0 ? (
        <RecordBlock>
          Nothing raised yet. A new one stays a draft until you send it, so
          there is no harm in starting it early.
        </RecordBlock>
      ) : (
        rows.map((row) => (
          <InvoiceActions
            key={row.id}
            invoice={{
              id: row.id,
              isDraft: row.isDraft,
              state: invoiceState(row.status, row.dueDate, now),
              who: row.customerName ?? row.number ?? "Invoice",
              // What is still owed while anything is owed; what the invoice
              // was for once it is settled. A paid invoice has an amount due
              // of nothing, and a row reading €0.00 says nothing about what
              // landed.
              amount: formatMoney(
                row.amountDue > 0 ? row.amountDue : row.total,
                row.currency
              ),
              total:
                row.amountDue > 0 && row.amountDue !== row.total
                  ? formatMoney(row.total, row.currency)
                  : null,
              number: row.number,
              created: formatEpochDay(row.createdDate),
              due: row.dueDate ? formatEpochDay(row.dueDate) : null,
              email: row.customerEmail,
              hostedInvoiceUrl: row.hostedInvoiceUrl,
            }}
          />
        ))
      )}
    </RecordSection>
  )
}

// ---------------------------------------------------------------------------
// Payment links — a shareable, fixed-amount URL.

function PaymentLinks({ rows }: { rows: PaymentLinkRow[] | null }) {
  return (
    <RecordSection
      header="Payment links"
      footer="A link is only outbound once you copy it and share it."
    >
      <PaymentLinkCreateForm />

      {rows === null ? (
        <RecordBlock>
          Couldn&rsquo;t read the payment links from Stripe.
        </RecordBlock>
      ) : rows.length === 0 ? (
        <RecordBlock>
          None yet. A link is the quickest way to be paid for something with a
          fixed price — a discovery call, a fixed-scope audit.
        </RecordBlock>
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
    </RecordSection>
  )
}

// ---------------------------------------------------------------------------
// What actually landed. Read-only: a row with a receipt opens it, one without
// is a ledger line and says nothing when you press it.

function RecentPayments({ rows }: { rows: PaymentRow[] | null }) {
  return (
    <RecordSection header="Recent payments">
      {rows === null ? (
        <RecordBlock>Couldn&rsquo;t read the payments from Stripe.</RecordBlock>
      ) : rows.length === 0 ? (
        <RecordBlock>
          Nothing has landed yet. Paid invoices and links both show up here.
        </RecordBlock>
      ) : (
        rows.map((payment) => (
          <RecordRow
            key={payment.id}
            label={payment.description ?? "Payment"}
            description={
              <span>
                <span className="font-mono">
                  {formatEpochDay(payment.createdDate)}
                </span>{" "}
                · <span className="capitalize">{payment.status}</span>
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
    </RecordSection>
  )
}
