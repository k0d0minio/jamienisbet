"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Ticket, Users, Wallet, type LucideIcon } from "lucide-react"

import { Button, LogoMark, cn } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

// Three screens. Leads is home — the dashboard opens on the work, not on a
// summary of it — Tickets is the estate's engineering backlog read from each
// repo's .icm/intake/, and Money is everything Stripe.
const links: NavLink[] = [
  { href: "/", label: "Leads", icon: Users },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/money", label: "Money", icon: Wallet },
]

function isActive(pathname: string, href: string): boolean {
  // "/" also covers a lead's own page, which is a detail view of that list.
  if (href === "/") return pathname === "/" || pathname.startsWith("/leads")
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Mobile-first chrome: a sticky top bar (brand + sign out) on every size, inline
// text links added on desktop, and a fixed icon tab bar pinned to the bottom on
// phones — the primary way to move around when installed as a PWA.
export function Nav() {
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2 sm:px-6 sm:py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LogoMark className="size-5" />
            <span>Consultancy JN</span>
          </Link>

          {/* Desktop-only inline links; the phone uses the bottom tab bar. */}
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "transition-colors hover:text-foreground",
                  isActive(pathname, link.href)
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Fixed bottom tab bar — phones only. Padded for the home-indicator area.
          Each tab is a full-height 3.5rem target so it can be hit one-handed;
          `bottom-above-tabs` in globals.css is keyed to that height. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-safe sm:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-3">
          {links.map((link) => {
            const active = isActive(pathname, link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:bg-muted",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="leading-none">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
