import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Alert, AlertDescription, AlertTitle, Eyebrow } from "@jamie-nisbet/ui"
import { CheckCircle2, Lock } from "lucide-react"

import { Container, Section } from "@/components/section"
import { InvoiceSummary } from "@/components/invoice-summary"
import { Checkout } from "@/components/embedded-checkout"
import { getInvoice } from "@/lib/invoice"

// Payment pages are per-invoice and must never be statically cached.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pay invoice",
  robots: { index: false, follow: false },
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ invoice: string }>
}) {
  const { invoice: invoiceId } = await params
  const invoice = await getInvoice(invoiceId)
  if (!invoice) notFound()

  return (
    <Section>
      <Container size="lg" className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        {/* Left: the invoice the amount traces to. */}
        <div className="flex flex-col gap-4">
          <InvoiceSummary invoice={invoice} />
          {invoice.isDemo && (
            <p className="text-sm text-muted-foreground">
              This is a demo invoice shown for review. Real invoices are loaded
              from Stripe by their id, e.g.{" "}
              <code className="font-mono text-2xs">/pay/in_123abc</code>.
            </p>
          )}
        </div>

        {/* Right: pay, or a status notice if there's nothing to pay. */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          {invoice.isPayable ? (
            <>
              <div className="flex flex-col gap-1">
                <Eyebrow rule>Pay securely</Eyebrow>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-4" />
                  Card details go straight to Stripe.
                </p>
              </div>
              <Checkout invoiceId={invoice.id} />
            </>
          ) : invoice.status === "paid" ? (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>This invoice is paid</AlertTitle>
              <AlertDescription>
                Nothing more to do — thank you. A receipt was sent to you by
                email when it cleared.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="info">
              <Lock />
              <AlertTitle>This invoice isn&apos;t open for payment</AlertTitle>
              <AlertDescription>
                If you think this is a mistake, reply to my email and I&apos;ll
                sort it out.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Container>
    </Section>
  )
}
