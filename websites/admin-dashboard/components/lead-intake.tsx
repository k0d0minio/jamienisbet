import { Inbox } from "lucide-react"

import { GroupedDisclosure, GroupedSection } from "@jamie-nisbet/ui"
import type { Client } from "@jamie-nisbet/services"

import { formatDateTime, formatServiceId } from "@/lib/format"

// How a lead came in: read once, then never again. So it is one folded row at
// the foot of the Person segment — no header, no section of its own. The
// provenance is on the page, it just isn't between you and the rest of it.

export function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact form"
  if (source === "referral") return "Referral"
  return "Added by hand"
}

/** A figure or timestamp, in mono — unless it is the em dash the formatters
 *  return for "not set", which belongs to the empty styling below. */
function Mono({ value }: { value: string }) {
  if (value === "—") return <span className="text-app-label-3">{value}</span>
  return <span className="font-mono">{value}</span>
}

// A read-only line inside the fold; renders "—" for anything unset.
function Detail({ label, children }: { label: string; children?: React.ReactNode }) {
  const empty =
    children === null || children === undefined || children === "" || children === "—"
  return (
    <div className="grid gap-1">
      <dt className="text-app-footnote text-app-label-3">{label}</dt>
      <dd className="text-app-callout text-app-label">
        {empty ? <span className="text-app-label-3">—</span> : children}
      </dd>
    </div>
  )
}

export function LeadIntake({ client }: { client: Client }) {
  return (
    <GroupedSection>
      <GroupedDisclosure
        icon={<Inbox />}
        label="How they came in"
        description={sourceLabel(client.source)}
      >
        <dl className="grid gap-4 pt-2">
          <Detail label="Received">
            <Mono value={formatDateTime(client.createdAt)} />
          </Detail>
          {client.source === "portfolio" ? (
            <Detail label="Service">{formatServiceId(client.service)}</Detail>
          ) : null}
          {client.source === "referral" ? (
            <Detail label="Referral code">
              {client.referralCode ? (
                <span className="font-mono">{client.referralCode}</span>
              ) : (
                "—"
              )}
            </Detail>
          ) : null}
          <Detail label="Budget indicated">{client.budget}</Detail>
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
      </GroupedDisclosure>
    </GroupedSection>
  )
}
