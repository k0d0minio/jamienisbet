import { Badge, Card, CardContent, CardFooter, CardHeader, Eyebrow, LogoMarkSolid } from "@jamie-nisbet/ui"
import { getLocale, getTranslations } from "next-intl/server"

import type { InvoiceView } from "@/lib/invoice"
import { formatStripeAmount } from "@/lib/format"
import { localeHtmlLang, type Locale } from "@/i18n/routing"
import { site } from "@/lib/site"

function formatDate(epochSeconds: number | null, locale: Locale): string | null {
  if (!epochSeconds) return null
  return new Intl.DateTimeFormat(localeHtmlLang[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(epochSeconds * 1000))
}

// Maps an invoice status to a brand status badge (muted tints, never neon).
// Translatable labels only for the two customer-facing states; raw Stripe status
// strings (void/uncollectible/etc.) are technical terms shown verbatim.
function StatusBadge({
  invoice,
  labels,
}: {
  invoice: InvoiceView
  labels: { paid: string; awaiting: string }
}) {
  switch (invoice.status) {
    case "paid":
      return <Badge variant="success">{labels.paid}</Badge>
    case "open":
      return <Badge variant="secondary">{labels.awaiting}</Badge>
    case "void":
    case "uncollectible":
      return <Badge variant="destructive">{invoice.status}</Badge>
    default:
      return <Badge variant="outline">{invoice.status}</Badge>
  }
}

export async function InvoiceSummary({ invoice }: { invoice: InvoiceView }) {
  const t = await getTranslations("invoiceSummary")
  const locale = (await getLocale()) as Locale
  const due = formatDate(invoice.dueDate, locale)
  const issued = formatDate(invoice.createdDate, locale)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMarkSolid className="size-8" />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Eyebrow>{t("invoice")}</Eyebrow>
            <p className="text-xl font-semibold tracking-tight">{invoice.number}</p>
          </div>
        </div>
        <StatusBadge
          invoice={invoice}
          labels={{ paid: t("status.paid"), awaiting: t("status.awaiting") }}
        />
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Bill-to + dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          {invoice.customerName && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
                {t("billedTo")}
              </span>
              <span className="text-sm">{invoice.customerName}</span>
              {invoice.customerEmail && (
                <span className="text-sm text-muted-foreground">
                  {invoice.customerEmail}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-0.5 sm:text-right">
            {issued && (
              <span className="text-sm text-muted-foreground">
                {t("issued", { date: issued })}
              </span>
            )}
            {due && (
              <span className="text-sm text-muted-foreground">
                {t("due", { date: due })}
              </span>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2.5 font-mono text-2xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("description")}
                </th>
                <th className="px-4 py-2.5 text-right font-mono text-2xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("qty")}
                </th>
                <th className="px-4 py-2.5 text-right font-mono text-2xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{line.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatStripeAmount(line.amount, invoice.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="flex items-baseline justify-between border-t border-border pt-6">
        <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
          {t("totalDue")}
        </span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {formatStripeAmount(invoice.amountDue, invoice.currency, locale)}
        </span>
      </CardFooter>
    </Card>
  )
}
