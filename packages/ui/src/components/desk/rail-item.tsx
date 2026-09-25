import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// DESK TIER — an icon rail item.
//
// The 56px rail replaces the 240px sidebar (D-5): one icon per screen, a
// count badge where something waits, the current screen on the sunken fill.
// Icon-only, so the name is the accessible name and the tooltip, and the
// count is part of it — "Inbox, 9 waiting" — never a number only the eye
// gets.
//
//   <RailItem asChild label="Inbox" count={9} icon={<InboxIcon />}>
//     <Link href="/inbox" />
//   </RailItem>
//
// A count of 0 hides the badge; above 99 it reads "99+".
//
// Requires "@jamie-nisbet/ui/desk.css".

type RailItemProps = Omit<React.ComponentPropsWithoutRef<"button">, "type"> & {
  /** The screen's name — the accessible name and the tooltip. */
  label: string
  /** The icon, as an element: <InboxIcon />. Sized by the rail. */
  icon: React.ReactNode
  /** How many things wait behind this screen. */
  count?: number
  /** What the count counts, spoken after it. Defaults to "waiting". */
  countLabel?: string
  /** This is the current screen. */
  active?: boolean
  /** Renders an anchor. */
  href?: string
  /** Hand the item's element to a child — a Next `<Link>`, most often. */
  asChild?: boolean
}

function RailItem({
  label,
  icon,
  count,
  countLabel = "waiting",
  active = false,
  href,
  asChild = false,
  className,
  children,
  ...props
}: RailItemProps) {
  const element = href != null ? "a" : "button"
  const Comp = (asChild ? Slot.Root : element) as React.ElementType
  const badge = count != null && count > 0 ? (count > 99 ? "99+" : String(count)) : null
  const name = badge != null ? `${label}, ${count} ${countLabel}`.trim() : label

  return (
    <Comp
      data-slot="rail-item"
      data-active={active || undefined}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href } : {})}
      {...(active ? { "aria-current": "page" as const } : {})}
      aria-label={name}
      title={label}
      className={cn(
        "relative flex size-desk-rail-item shrink-0 items-center justify-center rounded-desk-control transition-colors duration-100 [&_svg]:size-desk-icon-rail",
        active
          ? "bg-desk-sunken text-desk-fg"
          : "text-desk-fg-3 hover:bg-desk-sunken hover:text-desk-fg",
        className
      )}
      {...props}
    >
      {/* Under asChild the icon and badge land *inside* the caller's element;
          Slottable marks this position as that element. */}
      <Slot.Slottable>{children}</Slot.Slottable>
      <span aria-hidden className="contents">
        {icon}
      </span>
      {badge != null && (
        <span
          aria-hidden
          data-slot="rail-item-badge"
          className="absolute top-0.5 right-0.5 flex h-desk-badge min-w-desk-badge items-center justify-center rounded-full bg-desk-ink px-1 font-mono text-desk-micro leading-none text-desk-ink-fg tabular-nums"
        >
          {badge}
        </span>
      )}
    </Comp>
  )
}

export { RailItem, type RailItemProps }
