import { Inbox } from "lucide-react"

import { RecordDisclosure } from "@jamie-nisbet/ui"
import type { Client } from "@jamie-nisbet/services"

import { formatDateTime, formatServiceId } from "@/lib/format"

// The referral form's budget bands moved with the floor (€200 → €500 on
// 2026-09-22). Rows stored before then keep the old string in Neon — provenance
// is read-only — and it is mapped here, on display, so the row still reads as
// the band it meant.
const LEGACY_BUDGET_LABELS: Record<string, string> = {
  "~€200 — landing page": "~€200 — landing page (pre-2026-09-22 band; now ~€500)",
}
function budgetLabel(value: string | null): string | null {
  return value === null ? null : (LEGACY_BUDGET_LABELS[value] ?? value)
}

// How a lead came in: read once, then never again. So it is one folded row at
// the foot of the Person segment — no header, no section of its own. The
// provenance is on the page, it just isn't between you and the rest of it.

export function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact form"
  if (source === "referral") return "Referral"
  // Not "added by hand": nobody typed this one in. Which batch it came from is
  // the row below, and it is the sentence a first message has to be able to
  // quote when it says where the data came from.
  if (source === "import") return "Imported"
  return "Added by hand"
}

/** A figure or timestamp, in mono — unless it is the em dash the formatters
 *  return for "not set", which belongs to the empty styling below. */
function Mono({ value }: { value: string }) {
  if (value === "—") return <span className="text-desk-fg-3">{value}</span>
  return <span className="font-mono text-desk-meta">{value}</span>
}

// A read-only line inside the fold; renders "—" for anything unset.
function Detail({ label, children }: { label: string; children?: React.ReactNode }) {
  const empty =
    children === null || children === undefined || children === "" || children === "—"
  return (
    <div className="grid gap-1">
      <dt className="text-desk-meta text-desk-fg-3">{label}</dt>
      <dd className="text-desk-ui text-desk-fg">
        {empty ? <span className="text-desk-fg-3">—</span> : children}
      </dd>
    </div>
  )
}

export function LeadIntake({ client }: { client: Client }) {
  return (
    <RecordDisclosure
      icon={<Inbox />}
      label="How they came in"
      description={sourceLabel(client.source)}
    >
      <dl className="grid gap-4 pt-2">
        <Detail label="Received">
          <Mono value={formatDateTime(client.createdAt)} />
        </Detail>
        {client.source === "import" ? (
          <Detail label="Batch">{client.sourceDetail}</Detail>
        ) : null}
        {client.source === "portfolio" ? (
          <Detail label="Service">{formatServiceId(client.service)}</Detail>
        ) : null}
        {client.source === "referral" ? (
          <Detail label="Referral code">
            {client.referralCode ? (
              <span className="font-mono text-desk-meta">{client.referralCode}</span>
            ) : (
              "—"
            )}
          </Detail>
        ) : null}
        <Detail label="Budget indicated">{budgetLabel(client.budget)}</Detail>
        <Detail label="Preferred call time">
          <Mono value={formatDateTime(client.preferredCallTime)} />
        </Detail>
        <Detail label="Intake message">
          {client.intakeMessage ? (
            <p className="whitespace-pre-wrap">{client.intakeMessage}</p>
          ) : (
            "—"
          )}
        </Detail>
      </dl>
    </RecordDisclosure>
  )
}
