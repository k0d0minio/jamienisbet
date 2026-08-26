import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// The affiliate site chrome — seller-facing header (with "Refer a customer")
// and footer. Wraps the landing page; the customer pitch page opts out via its
// own route-group layout.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
