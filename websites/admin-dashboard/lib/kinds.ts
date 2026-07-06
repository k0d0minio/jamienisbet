// Client-safe pipeline vocabulary. The authoritative registry lives in
// @jamie-nisbet/icm (server-only — it reads repo files), so the label maps the
// browser bundle needs are mirrored here as plain constants.

export const KIND_LABELS: Record<string, string> = {
  triage: "Fit assessment",
  pitch: "Pitch",
  negotiation: "Negotiation strategy",
  proposal: "Proposal",
  contract: "Contract",
}

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind
}

// Kinds whose output encodes pricing/tax/legal structure — always rendered
// with the contabilista/lawyer decision-support notice.
export const DISCLAIMER_KINDS = ["proposal", "contract"]

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export function documentStatusVariant(status: string): BadgeVariant {
  if (status === "approved") return "default"
  if (status === "rejected") return "destructive"
  if (status === "in_review") return "outline"
  return "secondary"
}

export function dealStatusVariant(status: string): BadgeVariant {
  if (status === "won") return "default"
  if (status === "lost") return "destructive"
  return "secondary"
}
