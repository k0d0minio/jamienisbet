import type { MetadataRoute } from "next"

// A payment surface should never be crawled or indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  }
}
