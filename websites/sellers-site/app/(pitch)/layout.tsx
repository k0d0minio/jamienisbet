import { LogoMark } from "@jamie-nisbet/ui"
import { ExternalLink } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { site } from "@/lib/site"

// Minimal, customer-facing chrome for the pitch page — just the brand mark and a
// theme toggle, no affiliate nav or "Refer a customer" call. Header and footer are
// `print:hidden` so saving the page as a PDF yields a clean one-pager.
export default function PitchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border print:hidden">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--container-xl)] items-center justify-between gap-4 px-5 sm:px-8">
          <span className="flex items-center gap-2.5 font-semibold tracking-tight">
            <LogoMark className="size-6 text-primary" />
            {site.name}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border print:hidden">
        <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {site.name} — {site.location}
          </p>
          <a
            href={site.mainSiteUrl}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            jamienisbet.com
          </a>
        </div>
      </footer>
    </div>
  )
}
