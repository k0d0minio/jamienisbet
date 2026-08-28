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
  next: "bg-muted-foreground/40",
  queued: "bg-muted-foreground/20",
}

export function priorityClass(priority: string | null): string {
  return priority === "P0"
    ? "text-destructive font-medium"
    : "text-muted-foreground"
}
