"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Home,
  Link2,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Button, LogoMark, cn } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

type NavLink = {
  href: string
  /** Full label — top bar on desktop. */
  label: string
  /** Short label — the mobile bottom tab bar (five columns, tiny text). */
  short: string
  icon: LucideIcon
}

const links: NavLink[] = [
  { href: "/today", label: "Today", short: "Today", icon: Sun },
  { href: "/", label: "Dashboard", short: "Home", icon: Home },
  { href: "/clients", label: "Clients", short: "Clients", icon: Users },
  { href: "/finances", label: "Finances", short: "Finances", icon: Wallet },
  { href: "/invoices", label: "Invoices", short: "Invoices", icon: FileText },
  { href: "/payment-links", label: "Payment links", short: "Links", icon: Link2 },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
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
        <div className="mx-auto grid max-w-5xl grid-cols-6">
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
                <span className="leading-none">{link.short}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
