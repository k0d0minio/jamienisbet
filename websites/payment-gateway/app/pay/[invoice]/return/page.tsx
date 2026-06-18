import type { Metadata } from "next"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle, Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react"

import { Container, Section } from "@/components/section"
import { getStripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
}

export default async function ReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoice: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { invoice: invoiceId } = await params
  const { session_id: sessionId } = await searchParams
  const stripe = getStripe()

  // Retrieve the session to learn the real outcome (never trust the client).
  let status: "complete" | "open" | "unknown" = "unknown"
  let email: string | null = null
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      status = session.status === "complete" ? "complete" : "open"
      email = session.customer_details?.email ?? null
    } catch {
      status = "unknown"
    }
  }

  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-6">
        <Eyebrow rule>Payment</Eyebrow>

        {status === "complete" ? (
          <>
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>Payment received — thank you</AlertTitle>
              <AlertDescription>
                Your payment cleared{email ? `, and a receipt is on its way to ${email}` : ""}.
                The invoice is now marked paid; there&apos;s nothing more to do.
              </AlertDescription>
            </Alert>
            <Button asChild variant="ghost">
              <a href="https://jamienisbet.com">
                <ArrowLeft />
                Back to jamienisbet.com
              </a>
            </Button>
          </>
        ) : status === "open" ? (
          <>
            <Alert variant="warning">
              <CircleAlert />
              <AlertTitle>Payment not completed</AlertTitle>
              <AlertDescription>
                The payment was cancelled or didn&apos;t go through. You can try
                again — nothing has been charged.
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href={`/pay/${invoiceId}`}>
                <ArrowLeft />
                Back to the invoice
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Alert variant="info">
              <CircleAlert />
              <AlertTitle>We couldn&apos;t confirm this payment</AlertTitle>
              <AlertDescription>
                If you completed a payment, you&apos;ll still get a receipt by
                email. Otherwise, head back to the invoice to try again.
              </AlertDescription>
            </Alert>
            <Button asChild variant="secondary">
              <Link href={`/pay/${invoiceId}`}>
                <ArrowLeft />
                Back to the invoice
              </Link>
            </Button>
          </>
        )}
      </Container>
    </Section>
  )
}
