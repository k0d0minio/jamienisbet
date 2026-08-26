import type { Metadata } from "next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import "../globals.css"

import { ThemeProvider } from "@jamie-nisbet/app-shell"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { site } from "@/lib/site"
import { routing, localeHtmlLang, localeOg, type Locale } from "@jamie-nisbet/app-shell/i18n"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const title = `${site.name} — ${t("role")}`

  return {
    metadataBase: new URL(site.url),
    title: {
      default: title,
      template: `%s — ${site.name}`,
    },
    description: t("meta.description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        pt: "/pt",
        fr: "/fr",
        "x-default": "/en",
      },
    },
    // A payment surface should stay out of search results — keep it noindex even
    // though we still expose hreflang alternates for correctness.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: t("meta.description"),
      url: `${site.url}/${locale}`,
      siteName: site.name,
      locale: localeOg[locale as Locale],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={localeHtmlLang[locale as Locale]} suppressHydrationWarning>
      <body>
        {/* Theming is driven by the [data-theme] attribute (not .dark) — that's
            what @jamie-nisbet/ui's dark variant keys off. */}
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
