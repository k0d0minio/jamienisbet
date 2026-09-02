"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, LogOut, Ticket, Users, Wallet, type LucideIcon } from "lucide-react"

import { LogoFull, LogoLockup, Material, cn } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

// Four screens, in the order you meet them. Needs you is home and is first:
// the dashboard opens on what is owed today rather than on a roster. Leads is
// everyone; Tickets is the estate's engineering backlog read from each repo's
// .icm/intake/; Money is everything Stripe.
const links: NavLink[] = [
  { href: "/", label: "Needs you", icon: Inbox },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/money", label: "Money", icon: Wallet },
]

function isActive(pathname: string, href: string): boolean {
  // The feed is one route and nothing hangs off it — matching by prefix would
  // light it up on every screen in the app.
  if (href === "/") return pathname === "/"
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
              // A full-height 3.5rem target, one quarter of the pill, so it
              // can be hit one-handed without aiming. Four labels across a
              // phone is why they set at caption-2 and never wrap: "Needs you"
              // is the widest, and it fits at 11px semibold in a quarter of
              // the pill's 24rem ceiling.
              className={cn(
                "flex h-[var(--admin-tab-height)] min-w-0 flex-1 flex-col items-center justify-center gap-1",
                "text-app-caption-2 font-medium transition-colors spring-press",
                "active:bg-app-press",
                active ? "text-app-tint" : "text-material-label-3"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate leading-none">
                {link.label}
              </span>
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

/** The leading sidebar — the tab bar's desktop form. Same four destinations in
 *  the same order, the brand mark at the head and sign out at the foot; from
 *  here up the compact title bar carries no app-level controls of its own. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    // Named out of the page snapshot for the same reason as the tab bar: it is
    // the same sidebar on both pages and should not slide with the content.
    <aside
      className="vt-app-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-app-separator bg-app-group md:flex"
      // The bar runs the full height of a window that, on an installed tablet,
      // reaches the notch at one end and the home indicator at the other.
      // Insets rather than tokens: this is the device's geometry, not the
      // app's — the same reading the compact title bar takes.
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Link
        href="/"
        className="flex min-h-app-touch items-center px-4 py-4 text-app-label"
        aria-label="Consultancy JN — home"
      >
        {/* The full lockup, in currentColor, so it takes the row's own
            --app-label and flips with the appearance; the tile form belongs
            on surfaces that stand apart from their background, and a sidebar
            head is part of the surface. It is the name here — "Consultancy
            JN" is what the app is filed under, and the phone bar and the app
            menu still say so where there is no room for the lockup. */}
        <LogoLockup>
          <LogoFull className="size-20" aria-hidden />
        </LogoLockup>
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
