"use client"

import * as React from "react"
import { Button, IconButton, LogoMark } from "@jamie-nisbet/ui"
import { useTranslations } from "next-intl"
import { ArrowRight, Menu, X } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSwitcher } from "./language-switcher"
import { site, navItems } from "@/lib/site"

export function SiteHeader() {
  const t = useTranslations()
  const [open, setOpen] = React.useState(false)
  const nav = navItems.map((item) => ({
    href: item.href,
    label: t(`nav.${item.key}`),
  }))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--container-xl)] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          aria-label={`${site.name} — ${t("role")}`}
        >
          <LogoMark className="size-6 text-primary" />
          <span>{site.name}</span>
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
            <Link href="/#refer">
              {t("header.refer")}
              <ArrowRight />
            </Link>
          </Button>
          <IconButton
            aria-label={open ? t("header.closeMenu") : t("header.openMenu")}
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
          <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-1 px-5 py-3 sm:px-8">
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
              <Link href="/#refer">
                {t("header.refer")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
