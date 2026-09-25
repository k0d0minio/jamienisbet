import { Badge } from "@jamie-nisbet/ui"

import { invoiceStateLabel, type InvoiceState } from "@/lib/invoice-state"

// Where an invoice stands, as one muted pill on its row.
//
// The badge is restyled rather than re-invented: same component, same mono
// label, full radius instead of the marketing tier's 5px box — the way the deal
// badges next door round.
//
// Colour is the whole point, and it is state-only and muted, never neon:
//
//   draft          grey    raised, not yet anybody's problem
//   open           ink     owed, and on time — the brand tint, softly
//   overdue        red     the one that needs you
//   paid           green   landed
//   void           grey    closed on purpose; nothing to do
//   uncollectible  red     written off; a real loss
//
// Two greys and two reds, on purpose: `void` and `draft` are both "no clock is
// running", and `uncollectible` is as much of a problem as `overdue`. Grouping
// them by what they *mean* is what lets the tint be read instead of the word.
const TONE: Record<
  InvoiceState,
  "secondary" | "tint" | "success" | "destructive"
> = {
  draft: "secondary",
  open: "tint",
  overdue: "destructive",
  paid: "success",
  void: "secondary",
  uncollectible: "destructive",
}

export function InvoiceStatusBadge({ state }: { state: InvoiceState }) {
  return (
    <Badge variant={TONE[state]} className="shrink-0 rounded-full px-2">
      {invoiceStateLabel(state)}
    </Badge>
  )
}
