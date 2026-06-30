import type { MetadataRoute } from "next"

import { site } from "@/lib/site"
import { routing } from "@/i18n/routing"

// One entry per locale for the landing page, each with hreflang alternates so
// search engines surface the right language. The pitch page is noindex, so it's
// intentionally left out of the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${site.url}/${locale}`])
  )

  return routing.locales.map((locale) => ({
    url: `${site.url}/${locale}`,
    lastModified,
    alternates: { languages },
  }))
}
