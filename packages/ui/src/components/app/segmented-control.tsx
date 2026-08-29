import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — the segmented control.
//
// A small, closed set of mutually exclusive choices, shown all at once: the
// native way to filter a list without spending a screen on it. A sunken track
// with equal-width segments; the chosen one is a raised slab that has visibly
// lifted out of it — the same "selected reads as a card against the page"
// recipe the rest of the system uses, because weight alone does not carry a
// selection in the light theme.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <SegmentedControl aria-label="Filter leads">
//     <SegmentedItem asChild active label="All" count={24}>
//       <Link href="/" />
//     </SegmentedItem>
//     <SegmentedItem asChild label="Open" count={8}>
//       <Link href="/?filter=open" />
//     </SegmentedItem>
//   </SegmentedControl>
//
// Use it for a *closed* set — three to five segments that fit side by side. An
// open-ended or growing set (one chip per repo, one per tag) is a scrolling
// rail, not this: a segmented control that scrolls has stopped being one.
//
// Semantics come from the call site, because the same control serves two very
// different jobs. Segments that navigate are links, and the active one is
// marked `aria-current="page"`. Segments that choose a value in a form are
// buttons under `role="radiogroup"` / `role="radio"`, and the active one is
// marked `aria-checked` — pass the roles and this handles the state.
//
// A count is a figure, so it sets in mono like every other figure in the
// estate.

function SegmentedControl({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="segmented-control"
      className={cn(
        // The track is sunken rather than filled: --app-press is the same
        // wash a pressed row picks up, so it reads as page recessed by a
        // stop in both modes without inventing a colour for it.
        "flex items-stretch gap-1 rounded-app-control bg-app-press p-1",
        className
      )}
      {...props}
    />
  )
}

type SegmentedItemProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "type"
> & {
  /** The segment's name, sentence case. Truncates before the control wraps. */
  label: React.ReactNode
  /** How many things are behind this segment. Set in mono, beside the label. */
  count?: number
  /** This is the current segment. */
  active?: boolean
  /** Renders an anchor. */
  href?: string
  target?: string
  rel?: string
  /** Hand the segment's element to a child — a Next `<Link>`, most often. */
  asChild?: boolean
}

function SegmentedItem({
  label,
  count,
  active = false,
  href,
  target,
  rel,
  asChild = false,
  className,
  children,
  ...props
}: SegmentedItemProps) {
  const element = href != null ? "a" : "button"
  const Comp = (asChild ? Slot.Root : element) as React.ElementType

  // A link says which one you are on; a radio says which one is chosen. Both
  // are "active" to the eye and neither attribute fits the other's control,
  // so the state follows whichever the caller declared.
  const navigational = asChild || href != null
  const radio = props.role === "radio"

  return (
    <Comp
      data-slot="segmented-item"
      data-active={active || undefined}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href, target, rel } : {})}
      {...(navigational && active ? { "aria-current": "page" as const } : {})}
      {...(radio ? { "aria-checked": active } : {})}
      className={cn(
        // Equal widths, so the segments sit on a rhythm and a label growing
        // by a character can't shove its neighbours around.
        "flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 px-2",
        // The 44px floor lands on the segment itself, not on the track around
        // it — the segment is what a thumb has to hit. --app-radius-row is
        // the tier's inner radius (the press highlight inside a group), which
        // is what a segment nested in a track is.
        "min-h-app-touch rounded-app-row",
        "text-app-subhead transition-colors spring-press",
        active
          ? // Lifted out of the track. `raised` is the elevation step that
            // means exactly that, and the group fill is the page's card.
            "bg-app-group font-semibold text-app-label shadow-app-raised"
          : "font-medium text-app-label-2 active:bg-app-press",
        className
      )}
      {...props}
    >
      {/* Under `asChild` the label and count have to end up *inside* the
          caller's element rather than beside it; Slottable marks this
          position as that element so Slot re-parents the rest into it.
          Outside `asChild` it is a fragment and does nothing. */}
      <Slot.Slottable>{children}</Slot.Slottable>
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          data-slot="segmented-item-count"
          className={cn(
            "shrink-0 font-mono text-app-caption tabular-nums",
            active ? "text-app-label-2" : "text-app-label-3"
          )}
        >
          {count}
        </span>
      )}
    </Comp>
  )
}

export { SegmentedControl, SegmentedItem, type SegmentedItemProps }
