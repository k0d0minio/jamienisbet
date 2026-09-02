"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button, IconButton, LogoFull, LogoLockup } from "@jamie-nisbet/ui"
import { ArrowRight, Menu, X } from "lucide-react"

import { Link } from "../i18n/navigation"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSwitcher } from "./language-switcher"

export type SiteNavItem = { href: string; label: string }

// Shared sticky header for the marketing sites: the full logo, desktop nav,
// language + theme controls, a CTA, and a mobile burger menu. Each site's own
// components/site-header.tsx is a thin wrapper that resolves translations and
// passes plain strings in — this component stays catalog-agnostic.
//
// The logo is the full lockup — frame, "Jamie Nisbet.", the circle — and it is
// the name: no typeset site name beside it. That is what sets the bar's
// height (`--header-h`, 88px in each site's globals.css): the wordmark inside
// the tile needs the 64px it gets here to read, and a 64px bar would have set
// it at 40.
export function SiteHeader({
  siteName,
  homeAriaLabel,
  nav,
  cta,
  menuLabels,
}: {
  siteName: string
  homeAriaLabel: string
  nav: SiteNavItem[]
  cta: { href: string; label: string }
  menuLabels: { open: string; close: string }
}) {
  const [open, setOpen] = React.useState(false)
  const { resolvedTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--layout-xl)] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center" aria-label={homeAriaLabel}>
          {/* In currentColor on a transparent tile: on the page's paper (or
              ink) canvas that is exactly the artwork's own reading, and it
              flips with the theme because the text colour does. The lockup
              wrapper gives it the hover/press response and the crossfade
              when the reading flips. */}
          <LogoLockup fadeKey={resolvedTheme ?? null}>
            <LogoFull className="size-16" aria-label={siteName} />
          </LogoLockup>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={cta.href}>
              {cta.label}
              <ArrowRight />
            </Link>
          </Button>
          <IconButton
            aria-label={open ? menuLabels.close : menuLabels.open}
            aria-expanded={open}
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </IconButton>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-[var(--layout-xl)] flex-col gap-1 px-5 py-3 sm:px-8">
            {nav.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="justify-start"
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button
              asChild
              className="mt-1 justify-start"
              onClick={() => setOpen(false)}
            >
              <Link href={cta.href}>
                {cta.label}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
