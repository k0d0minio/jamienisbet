import type { MetadataRoute } from "next"

import { getCaseStudySlugs } from "@/lib/work"
import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = ["", "/work"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
  }))
  const studyRoutes = getCaseStudySlugs().map((slug) => ({
    url: `${site.url}/work/${slug}`,
    lastModified: now,
  }))
  return [...staticRoutes, ...studyRoutes]
}
