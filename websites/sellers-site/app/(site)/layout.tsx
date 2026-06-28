import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getI18n } from "@/lib/i18n"

// The affiliate site chrome — seller-facing header (with "Refer a customer")
// and footer. Wraps the landing page; the customer pitch page opts out via its
// own route-group layout.
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, dict } = await getI18n()

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <SiteFooter dict={dict} />
    </div>
  )
}
