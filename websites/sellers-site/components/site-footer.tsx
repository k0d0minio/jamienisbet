import Link from "next/link"
import { Eyebrow, LogoMarkSolid } from "@jamie-nisbet/ui"
import { ExternalLink, Mail, MapPin } from "lucide-react"

import { site } from "@/lib/site"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — ${site.role}`}
          >
            <LogoMarkSolid className="size-8" />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Refer web and software work, earn 10% on what gets built — paid when
            the client pays. Run from {site.location}.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>Get in touch</Eyebrow>
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
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
