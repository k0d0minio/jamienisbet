import type { MetadataRoute } from "next"

import { site } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Customer questionnaires. Nothing links to them and each carries its own
      // noindex, but a forwarded link is out of our hands — so they are ruled
      // out here too.
      disallow: "/f/",
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
