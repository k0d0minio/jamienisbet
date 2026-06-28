import Link from "next/link"
import { Eyebrow, LogoMarkSolid } from "@jamie-nisbet/ui"
import { ExternalLink, Mail, MapPin } from "lucide-react"

import { site, navItems } from "@/lib/site"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

export function SiteFooter({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear()
  const tagline = dict.footer.tagline.replace("{location}", site.location)

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — ${dict.role}`}
          >
            <LogoMarkSolid className="size-8" />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </Link>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>{dict.footer.getInTouch}</Eyebrow>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <Mail className="size-4 text-muted-foreground" />
            {site.email}
          </a>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {site.location}
          </span>
          <a
            href={site.mainSiteUrl}
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <ExternalLink className="size-4 text-muted-foreground" />
            jamienisbet.com
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            © {year} {site.name}
          </p>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {dict.nav[item.key]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
