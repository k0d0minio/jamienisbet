import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// DESK TIER — the list row.
//
// 32px at the desk, 44px under a thumb (the tokens decide). A leading mark —
// a StatusDot, an icon — the label, which truncates, and trailing mono meta:
// a sequence, a PR, a PriorityTag. A hairline under every row; no cards in
// cards, no coloured side borders.
//
//   <ListRow asChild selected leading={<StatusDot status="next" />}
//            label="Content model" meta={<>1/4 <PriorityTag priority="P1" /></>}>
//     <Link href="?t=…" />
//   </ListRow>
//
// States: hover (a wash), selected (sunken fill + weight), done (muted and
// struck through), focus-visible (the tier's inset outline). Selection is
// spoken as aria-selected where the caller has given the row a role that
// carries it (option, row, tab — a listbox or a grid), and as
// aria-current="true" otherwise, which is what a link in a list of links is.
//
// Requires "@jamie-nisbet/ui/desk.css".

const selectableRoles = new Set(["option", "row", "gridcell", "tab", "treeitem"])

type ListRowProps = Omit<React.ComponentPropsWithoutRef<"div">, "onClick"> & {
  /** The row's leading mark: a StatusDot, an icon. */
  leading?: React.ReactNode
  /** The row's name. Truncates before the row wraps. */
  label: React.ReactNode
  /** Trailing mono metadata. */
  meta?: React.ReactNode
  /** This row is the current selection. */
  selected?: boolean
  /** This row's work is finished: muted, the label struck through. */
  done?: boolean
  /** Renders an anchor. */
  href?: string
  /** Renders a button. */
  onClick?: React.MouseEventHandler<HTMLElement>
  /** Hand the row's element to a child — a Next `<Link>`, most often. */
  asChild?: boolean
}

function ListRow({
  leading,
  label,
  meta,
  selected = false,
  done = false,
  href,
  onClick,
  asChild = false,
  role,
  className,
  children,
  ...props
}: ListRowProps) {
  const element = href != null ? "a" : onClick != null ? "button" : "div"
  const Comp = (asChild ? Slot.Root : element) as React.ElementType
  const interactive = asChild || element !== "div"
  const selection =
    role != null && selectableRoles.has(role)
      ? { "aria-selected": selected }
      : selected
        ? { "aria-current": "true" as const }
        : {}

  return (
    <Comp
      data-slot="list-row"
      data-selected={selected || undefined}
      data-done={done || undefined}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href } : {})}
      onClick={onClick}
      role={role}
      {...selection}
      className={cn(
        "flex h-desk-row w-full min-w-0 items-center gap-2.5 border-b border-desk-line px-3 text-left text-desk-ui text-desk-fg transition-colors duration-100",
        interactive && "cursor-pointer hover:bg-desk-hover",
        selected && "bg-desk-sunken font-semibold hover:bg-desk-sunken",
        done && "text-desk-fg-3",
        className
      )}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {leading != null && (
        <span className="flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-desk-icon">
          {leading}
        </span>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          done && "line-through decoration-desk-line-strong"
        )}
      >
        {label}
      </span>
      {meta != null && (
        <span className="flex shrink-0 items-center gap-2.5 font-mono text-desk-micro text-desk-fg-3">
          {meta}
        </span>
      )}
    </Comp>
  )
}

export { ListRow, type ListRowProps }
