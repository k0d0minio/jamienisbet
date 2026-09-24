import type { TicketGroup } from "@/lib/tickets"

// The board's shared visual vocabulary, in a module both server pages and
// client rows can import (lib/tickets is server-only; these are just looks).
//
// `today` is the pick-up list; it reads as the accent, not an alarm. Blocked
// is amber, not red — stuck wants attention, it isn't a failure. Queued fades:
// it's the part of an epic that isn't up yet.

export const GROUP_LABELS: Record<TicketGroup, string> = {
  today: "Today",
  "in-flight": "In flight",
  blocked: "Blocked",
  next: "Next",
  queued: "Queued",
}

export const GROUP_DOT: Record<TicketGroup, string> = {
  today: "bg-primary",
  "in-flight": "bg-success",
  blocked: "bg-warning",
  next: "bg-app-label-3/40",
  queued: "bg-app-label-3/20",
}

export function priorityClass(priority: string | null): string {
  return priority === "P0" ? "text-destructive font-medium" : "text-app-label-3"
}

/** A selected row's fill on the board's list. Layered as an image over the
 *  row's own opaque background rather than replacing it: the tint is
 *  translucent, and the row's fill is what hides the swipe tray behind it. */
export const ACTIVE_ROW =
  "bg-[image:linear-gradient(var(--app-fill),var(--app-fill))]"

/** The same fill for the keyboard's level-0 cursor, which only exists from
 *  `lg` — so a phone never keeps a highlight on the row it came back from. */
export const ACTIVE_ROW_DESKTOP =
  "lg:bg-[image:linear-gradient(var(--app-fill),var(--app-fill))]"

/** A row the keyboard's cursor scrolls to stops clear of the sticky title
 *  bar rather than tucking under it. */
export const CURSOR_SCROLL_MARGIN =
  "scroll-mt-[calc(var(--app-bar-height)_+_env(safe-area-inset-top)_+_0.5rem)] scroll-mb-4"
