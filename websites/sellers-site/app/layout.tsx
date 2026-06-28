import type { Metadata } from "next"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { site } from "@/lib/site"
import { localeHtmlLang } from "@/lib/i18n/config"
import { getI18n } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  const title = `${site.name} — ${dict.role}`

  return {
    metadataBase: new URL(site.url),
    title: {
      default: title,
      template: `%s — ${site.name}`,
    },
    description: dict.meta.description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description: dict.meta.description,
      url: site.url,
      siteName: site.name,
      locale: dict.ogLocale,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getI18n()

  return (
    <html lang={localeHtmlLang[locale]} suppressHydrationWarning>
      <body>
        {/* Theming is driven by the [data-theme] attribute (not .dark) — that's
            what @jamie-nisbet/ui's dark variant keys off. */}
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Per-route-group layouts supply the chrome: the affiliate site
              ((site)) wears the seller header/footer; the customer pitch
              ((pitch)) wears its own minimal brand bar. */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
