import Script from "next/script"

import { site } from "@/lib/site"

// Google Analytics 4 (gtag.js).
//
// A measurement ID is a public identifier — it ships in the client bundle by
// construction — so it lives in lib/site.ts with the other invariant site facts
// rather than in an env var that would have to be set per Vercel project.
//
// `afterInteractive` is the gtag default: the tag loads once the page is
// interactive, so it never blocks first paint, and next/script keeps a single
// copy across client-side navigations (App Router re-renders the layout, but
// the script element is hoisted and deduped by `id`).

export function GoogleAnalytics() {
  // Nothing to load in dev — keeps local page views out of the property.
  if (process.env.NODE_ENV !== "production") return null

  // Preview deployments build with NODE_ENV=production too, so the check above
  // doesn't keep branch previews out of the property on its own. NEXT_PUBLIC_
  // VERCEL_ENV distinguishes them — but it only reaches the browser when the
  // project has "Automatically expose System Environment Variables" enabled, so
  // this excludes a known-non-production env rather than requiring a known
  // production one. Unset (not on Vercel, or not exposed) therefore still
  // loads the tag: analytics missing on the live site is the worse failure.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
  if (vercelEnv && vercelEnv !== "production") return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${site.analyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${site.analyticsId}');
        `}
      </Script>
    </>
  )
}
