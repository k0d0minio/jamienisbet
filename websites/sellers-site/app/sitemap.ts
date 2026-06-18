import type { MetadataRoute } from "next"

import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  // Single-page site — one route.
  return [{ url: site.url, lastModified: new Date() }]
}
