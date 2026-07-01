import { Badge } from "@jamie-nisbet/ui"

// Map a Stripe invoice status to a brand Badge tone. Keeps the invoice table
// scannable at a glance: paid = success, open = warning (owing), void/uncollectible
// = destructive, draft = neutral.
const TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  open: "warning",
  draft: "secondary",
  void: "destructive",
  uncollectible: "destructive",
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={TONE[status] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  )
}
