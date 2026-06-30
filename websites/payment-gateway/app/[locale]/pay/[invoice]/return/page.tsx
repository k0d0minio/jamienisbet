import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle, Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react"

import { Container, Section } from "@/components/section"
import { Link } from "@/i18n/navigation"
import { getStripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; invoice: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "return" })
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  }
}

export default async function ReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; invoice: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { locale, invoice: invoiceId } = await params
  setRequestLocale(locale)
  const t = await getTranslations("return")
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
        <Eyebrow rule>{t("eyebrow")}</Eyebrow>

        {status === "complete" ? (
          <>
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>{t("complete.title")}</AlertTitle>
              <AlertDescription>
                {email
                  ? t("complete.descriptionWithEmail", { email })
                  : t("complete.description")}
              </AlertDescription>
            </Alert>
            <Button asChild variant="ghost">
              <a href="https://jamienisbet.com">
                <ArrowLeft />
                {t("complete.back")}
              </a>
            </Button>
          </>
        ) : status === "open" ? (
          <>
            <Alert variant="warning">
              <CircleAlert />
              <AlertTitle>{t("open.title")}</AlertTitle>
              <AlertDescription>{t("open.description")}</AlertDescription>
            </Alert>
            <Button asChild>
              <Link href={`/pay/${invoiceId}`}>
                <ArrowLeft />
                {t("open.back")}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Alert variant="info">
              <CircleAlert />
              <AlertTitle>{t("unknown.title")}</AlertTitle>
              <AlertDescription>{t("unknown.description")}</AlertDescription>
            </Alert>
            <Button asChild variant="secondary">
              <Link href={`/pay/${invoiceId}`}>
                <ArrowLeft />
                {t("unknown.back")}
              </Link>
            </Button>
          </>
        )}
      </Container>
    </Section>
  )
}
