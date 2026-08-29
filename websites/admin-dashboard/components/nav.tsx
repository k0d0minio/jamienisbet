"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Ticket, Users, Wallet, type LucideIcon } from "lucide-react"

import { LogoMark, Material, cn } from "@jamie-nisbet/ui"

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

// The chrome swaps at `md` rather than `sm`: below it the app is a phone with a
// floating tab bar, above it an iPad-style scale-up with a leading sidebar. 640
// is too narrow to give a sidebar 15rem and still leave the grouped column
// something to sit in; 768 — an iPad in portrait — is where that stops being
// true. The screens keep their own `sm:` reading of their content, which is a
// separate question from where the chrome lives.

// ------------------------------------------------------------------
// Phones: the floating tab bar.
// ------------------------------------------------------------------

/** The bottom tab bar — a translucent pill hovering over the content, phones
 *  only. Its geometry (height, the gap under it, what has to clear it) is the
 *  `--admin-tab-*` set in globals.css. */
export function TabBar() {
  const pathname = usePathname()

  return (
    // `vt-app-tabs` names the bar out of the page snapshot so it holds still
    // while the content under it cross-fades — see globals.css § View
    // transitions. The strip itself is inert: only the pill takes taps, so a
    // thumb landing beside it still reaches the content underneath.
    <nav
      className="vt-app-tabs pointer-events-none fixed inset-x-0 bottom-tabs z-30 px-app-gutter md:hidden"
      aria-label="Primary"
    >
      <Material
        level="thick"
        elevation="chrome"
        className="pointer-events-auto mx-auto flex max-w-sm overflow-hidden rounded-app-chrome border border-material-hairline"
      >
        {links.map((link) => {
          const active = isActive(pathname, link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              // A full-height 3.5rem target, one third of the pill, so it can
              // be hit one-handed without aiming.
              className={cn(
                "flex h-[var(--admin-tab-height)] flex-1 flex-col items-center justify-center gap-1",
                "text-app-caption-2 font-medium transition-colors spring-press",
                "active:bg-app-press",
                active ? "text-app-tint" : "text-material-label-3"
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="leading-none">{link.label}</span>
            </Link>
          )
        })}
      </Material>
    </nav>
  )
}

// ------------------------------------------------------------------
// Wide viewports: the sidebar.
// ------------------------------------------------------------------

/** The leading sidebar — the tab bar's desktop form. Same three destinations,
 *  the monogram at the head and sign out at the foot; from here up the compact
 *  title bar carries no app-level controls of its own. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    // Named out of the page snapshot for the same reason as the tab bar: it is
    // the same sidebar on both pages and should not slide with the content.
    <aside className="vt-app-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-app-separator bg-app-group md:flex">
      <Link
        href="/"
        className="flex min-h-app-touch items-center gap-2 px-4 py-4 text-app-headline font-semibold text-app-label"
      >
        <LogoMark className="size-5 shrink-0" aria-hidden />
        <span className="truncate">Consultancy JN</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Primary">
        {links.map((link) => {
          const active = isActive(pathname, link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-app-touch items-center gap-3 rounded-app-control px-3",
                "text-app-callout font-medium transition-colors spring-press",
                active
                  ? "bg-app-press text-app-tint"
                  : "text-app-label-2 hover:bg-app-press active:bg-app-press"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <form action={logout} className="border-t border-app-separator p-3">
        <button
          type="submit"
          className={cn(
            "flex w-full min-h-app-touch items-center gap-3 rounded-app-control px-3",
            "text-app-callout font-medium text-app-label-2 transition-colors spring-press",
            "hover:bg-app-press active:bg-app-press"
          )}
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          Sign out
        </button>
      </form>
    </aside>
  )
}
