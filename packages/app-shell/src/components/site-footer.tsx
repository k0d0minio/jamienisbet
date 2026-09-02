import type * as React from "react"
import { Eyebrow, LogoFull } from "@jamie-nisbet/ui"
import { Mail, MapPin } from "lucide-react"

import { Link } from "../i18n/navigation"

// Shared footer frame for the marketing sites: the full logo + tagline on the
// left, a contact column on the right, and a bottom bar. Presentational only —
// each site's own components/site-footer.tsx resolves translations (it may be
// an async server component) and fills the slots.
export function SiteFooter({
  siteName,
  homeAriaLabel,
  tagline,
  brandExtra,
  contactHeading,
  email,
  location,
  contactExtra,
  bottomLeft,
  bottomRight,
}: {
  siteName: string
  homeAriaLabel: string
  tagline: string
  /** Extra line(s) under the tagline in the brand block (e.g. "secured by Stripe"). */
  brandExtra?: React.ReactNode
  contactHeading: string
  email: string
  location: string
  /** Extra entries under email/location (e.g. main-site link, language switcher). */
  contactExtra?: React.ReactNode
  /** Bottom bar, left side — usually the copyright line(s). */
  bottomLeft: React.ReactNode
  /** Bottom bar, right side — usually the footer nav. */
  bottomRight?: React.ReactNode
}) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[var(--layout-xl)] flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-4">
          {/* The full lockup is the brand block's name — there is no typeset
              one beside it. 112px is where the wordmark reads at a glance
              from a phone held at arm's length. */}
          <Link
            href="/"
            className="inline-flex w-fit transition-opacity hover:opacity-80 active:opacity-65"
            aria-label={homeAriaLabel}
          >
            <LogoFull className="size-28" aria-label={siteName} />
          </Link>
          <p className="text-sm text-muted-foreground">{tagline}</p>
          {brandExtra}
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>{contactHeading}</Eyebrow>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <Mail className="size-4 text-muted-foreground" />
            {email}
          </a>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {location}
          </span>
          {contactExtra}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--layout-xl)] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex flex-col gap-2">{bottomLeft}</div>
          {bottomRight}
        </div>
      </div>
    </footer>
  )
}
