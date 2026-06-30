import type { Metadata } from "next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import "../globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { site } from "@/lib/site"
import { routing, localeHtmlLang, localeOg, type Locale } from "@/i18n/routing"

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
            {/* Per-route-group layouts supply the chrome: the affiliate site
                ((site)) wears the seller header/footer; the customer pitch
                ((pitch)) wears its own minimal brand bar. */}
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
