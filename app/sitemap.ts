import type { MetadataRoute } from "next"

import { getCaseStudySlugs } from "@/lib/work"
import { site } from "@/lib/site"
import { routing } from "@/i18n/routing"

// One entry per locale per route, each carrying the full set of hreflang
// alternates (Google reads alternates.languages, not separate URLs).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = ["", "/work", ...getCaseStudySlugs().map((slug) => `/work/${slug}`)]

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: now,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alt) => [alt, `${site.url}/${alt}${path}`])
        ),
      },
    }))
  )
}
