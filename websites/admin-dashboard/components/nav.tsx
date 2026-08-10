"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Wallet, type LucideIcon } from "lucide-react"

import { Button, LogoMark, cn } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

// Two screens. Leads is home — the dashboard opens on the work, not on a
// summary of it — and Money is everything Stripe.
const links: NavLink[] = [
  { href: "/", label: "Leads", icon: Users },
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
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 sm:px-6">
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

      {/* Fixed bottom tab bar — phones only. Padded for the home-indicator area. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2">
          {links.map((link) => {
            const active = isActive(pathname, link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
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
