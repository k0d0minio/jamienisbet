import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle, Eyebrow } from "@jamie-nisbet/ui"
import { CheckCircle2, Lock } from "lucide-react"

import { Container, Section } from "@/components/section"
import { InvoiceSummary } from "@/components/invoice-summary"
import { Checkout } from "@/components/embedded-checkout"
import { getInvoice } from "@/lib/invoice"
import type { Locale } from "@/i18n/routing"

// Payment pages are per-invoice and must never be statically cached.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; invoice: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "pay" })
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  }
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ locale: string; invoice: string }>
}) {
  const { locale, invoice: invoiceId } = await params
  setRequestLocale(locale)
  const t = await getTranslations("pay")
  const invoice = await getInvoice(invoiceId)
  if (!invoice) notFound()

  return (
    <Section>
      <Container size="lg" className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        {/* Left: the invoice the amount traces to. */}
        <div className="flex flex-col gap-4">
          <InvoiceSummary invoice={invoice} />
        </div>

        {/* Right: pay, or a status notice if there's nothing to pay. */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          {invoice.isPayable ? (
            <>
              <div className="flex flex-col gap-1">
                <Eyebrow rule>{t("paySecurely")}</Eyebrow>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-4" />
                  {t("cardsToStripe")}
                </p>
              </div>
              <Checkout invoiceId={invoice.id} locale={locale as Locale} />
            </>
          ) : invoice.status === "paid" ? (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>{t("paid.title")}</AlertTitle>
              <AlertDescription>{t("paid.description")}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="info">
              <Lock />
              <AlertTitle>{t("notOpen.title")}</AlertTitle>
              <AlertDescription>{t("notOpen.description")}</AlertDescription>
            </Alert>
          )}
        </div>
      </Container>
    </Section>
  )
}
