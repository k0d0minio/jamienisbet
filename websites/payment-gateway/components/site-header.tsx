import Link from "next/link"
import { Button, LogoMark } from "@jamie-nisbet/ui"
import { ArrowUpRight } from "lucide-react"

import { ThemeToggle } from "./theme-toggle"
import { site } from "@/lib/site"

// Payments is a utility surface — clients land here from an invoice link, so the
// header stays minimal: identity, a way back to the main site, theme. No nav menu.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--container-xl)] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          aria-label={`${site.name} — ${site.role}`}
        >
          <LogoMark className="size-6 text-primary" />
          <span>{site.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <a href={site.mainSiteUrl}>
              jamienisbet.com
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
