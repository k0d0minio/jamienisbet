import type { InvoiceView } from "@/lib/invoice"

// A realistic demo invoice so the UI renders fully without Stripe keys — the
// review path. Amounts are in minor units (cents). The figures mirror a typical
// quote (€120/hour standard rate, see _config/business/rates.md), purely for
// illustration. Clearly flagged as demo so it can never be mistaken for a bill.
export function demoInvoice(id: string): InvoiceView {
  return {
    id: id === "demo" ? "demo" : id,
    number: "INV-0001 (demo)",
    currency: "eur",
    amountDue: 150_000, // €1,500
    total: 150_000,
    status: "demo",
    // 30-day terms from a fixed reference date — kept static (no Date.now) so the
    // demo is deterministic.
    createdDate: Math.floor(new Date("2026-06-01T00:00:00Z").getTime() / 1000),
    dueDate: Math.floor(new Date("2026-07-01T00:00:00Z").getTime() / 1000),
    customerName: "Acme Studio (demo)",
    customerEmail: "billing@example.com",
    lines: [
      {
        description: "Landing page build — design, build, deploy",
        quantity: 1,
        unitAmount: 90_000,
        amount: 90_000,
      },
      {
        description: "AI contact-form triage — setup & wiring (5h @ €120)",
        quantity: 5,
        unitAmount: 12_000,
        amount: 60_000,
      },
    ],
    hostedInvoiceUrl: null,
    isDemo: true,
    // Demo is "payable" so the checkout area is exercised in review; with no
    // publishable key the embedded component shows the demo-mode notice instead
    // of a live form.
    isPayable: true,
  }
}
