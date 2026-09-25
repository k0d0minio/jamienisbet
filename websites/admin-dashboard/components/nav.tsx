"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, use } from "react"
import { Inbox, Layers, LogOut, Search, Users, type LucideIcon } from "lucide-react"

import { LogoMark, RailItem, cn } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"
import { usePaletteOpener, useShortcutLabel } from "@/components/command-palette"

// The shell's chrome, on the desk tier (D-5): a 56px icon rail from `md`, a
// flat tab bar below it. Three screens, in the order you meet them — Work is
// home (D-6), the Inbox is what is owed, Leads is everyone. Money left the
// navigation (D-17): its route still answers a bookmark, and nothing here or
// in the palette points at it.
//
// The chrome swaps at `md` (768px): an iPad in portrait is a desk and gets the
// rail, which costs it 56px (D-23). How many panes a screen shows at a given
// width is that screen's business, not the chrome's. Touch sizing is the desk
// tier's own coarse-pointer step, so a touch iPad's rail items grow to 44px
// from the same markup.

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  /** Carries the Inbox's badge. */
  counted?: boolean
}

const links: NavLink[] = [
  { href: "/", label: "Work", icon: Layers },
  { href: "/inbox", label: "Inbox", icon: Inbox, counted: true },
  { href: "/leads", label: "Leads", icon: Users },
]

function isActive(pathname: string, href: string): boolean {
  // Work is one route and every other screen hangs off its own prefix —
  // matching `/` by prefix would light it up everywhere.
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** The Inbox's follow-up count (lib/inbox.ts), streamed from the layout:
 *  null when it could not be read, which hides the badge like a zero. */
export type InboxCount = Promise<number | null>

/** Renders `children` with the count once it lands, and with no count until
 *  then — so the chrome paints at once and the badge arrives when it can. */
function WithCount({
  count,
  children,
}: {
  count: InboxCount
  children: (count: number | undefined) => React.ReactNode
}) {
  return (
    <Suspense fallback={children(undefined)}>
      <Resolved count={count}>{children}</Resolved>
    </Suspense>
  )
}

function Resolved({
  count,
  children,
}: {
  count: InboxCount
  children: (count: number | undefined) => React.ReactNode
}) {
  return children(use(count) ?? undefined)
}

// ------------------------------------------------------------------
// From `md`: the rail.
// ------------------------------------------------------------------

/** The leading icon rail — the mark, the three screens, and at its foot the
 *  palette and sign out. Named out of the page snapshot (`vt-app-rail`) so it
 *  holds still through a view transition. */
export function Rail({ inboxCount }: { inboxCount: InboxCount }) {
  const pathname = usePathname()
  const openPalette = usePaletteOpener()
  const shortcut = useShortcutLabel()

  return (
    <nav
      aria-label="Primary"
      className="vt-app-rail desk-tier fixed inset-y-0 left-0 z-30 hidden w-desk-rail md:block"
    >
      {/* The fill lives on this inner layer: `desk-tier` paints the canvas,
          and the rail sits a step off it. The insets are the device's — an
          installed tablet runs the window under the notch and the home
          indicator. */}
      <div
        className="flex h-full flex-col items-center gap-1.5 border-r border-desk-line bg-desk-hover py-3"
        style={{
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        {/* The mark, as the tile the canvas draws: identity, not a control —
            Work is one row below it. */}
        <span
          aria-hidden
          className="mb-2.5 flex size-desk-control items-center justify-center rounded-desk-control bg-desk-ink text-desk-ink-fg"
        >
          <LogoMark className="size-desk-icon" />
        </span>

        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(pathname, link.href)
          const item = (count: number | undefined) => (
            <RailItem
              key={link.href}
              asChild
              label={link.label}
              icon={<Icon />}
              active={active}
              count={count}
            >
              <Link href={link.href} />
            </RailItem>
          )
          return link.counted ? (
            <WithCount key={link.href} count={inboxCount}>
              {item}
            </WithCount>
          ) : (
            item(undefined)
          )
        })}

        <div className="flex-1" />

        {openPalette ? (
          <RailItem
            label={`Go anywhere (${shortcut})`}
            icon={<Search />}
            onClick={openPalette}
          />
        ) : null}
        <form action={logout}>
          <RailItem asChild label="Sign out" icon={<LogOut />}>
            <button type="submit" />
          </RailItem>
        </form>
      </div>
    </nav>
  )
}

// ------------------------------------------------------------------
// Below `md`: the tab bar.
// ------------------------------------------------------------------

/** The bottom tab bar — a flat strip on a hairline, welded to the bottom edge
 *  and extending under the home indicator (D-5: no floating glass). Its
 *  height is `--admin-tab-height` in globals.css, which everything that has
 *  to clear it reads. */
export function TabBar({ inboxCount }: { inboxCount: InboxCount }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="vt-app-tabs desk-tier fixed inset-x-0 bottom-0 z-30 md:hidden"
    >
      <div
        className="grid grid-cols-3 border-t border-desk-line bg-desk-hover"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(pathname, link.href)
          const tab = (count: number | undefined) => {
            const badge = count ? (count > 99 ? "99+" : String(count)) : null
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                aria-label={badge ? `${link.label}, ${count} waiting` : undefined}
                // A third of the bar, full height: hit one-handed without
                // aiming. Press is a colour change, never a shrink.
                className={cn(
                  "flex h-[var(--admin-tab-height)] min-w-0 flex-col items-center justify-center gap-1",
                  "font-desk text-desk-micro transition-colors duration-100 active:bg-desk-sunken",
                  active ? "font-semibold text-desk-fg" : "text-desk-fg-3"
                )}
              >
                <span className="relative flex">
                  <Icon className="size-desk-icon-rail" aria-hidden />
                  {badge ? (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 left-3 flex h-desk-badge min-w-desk-badge items-center justify-center rounded-full bg-desk-ink px-1 font-mono text-desk-micro leading-none text-desk-ink-fg tabular-nums"
                    >
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate leading-none">{link.label}</span>
              </Link>
            )
          }
          return link.counted ? (
            <WithCount key={link.href} count={inboxCount}>
              {tab}
            </WithCount>
          ) : (
            tab(undefined)
          )
        })}
      </div>
    </nav>
  )
}
