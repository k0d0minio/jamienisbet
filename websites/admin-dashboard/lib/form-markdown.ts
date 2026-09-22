import "server-only"

import { zipAnswers, type FormLink } from "@jamie-nisbet/services"

// Renders a completed questionnaire (frozen snapshot + the answers that came
// back) as the markdown snapshot committed into the deal folder in icm-board
// (`workspaces/deals/<slug>/<engagement>/answers/<form>.md`) — so a `/client`
// session reads what the lead actually said instead of working from memory.
// One home per fact (icm-board D24): Neon (`biz.form_links`) stays the record;
// this file is an immutable, provenance-stamped copy and says so at the top.

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function renderAnswer(value: string | boolean | null): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (value === null || value.trim() === "") return "_Not answered._"
  return value.trim()
}

/** Where the copy is going, for its provenance header. */
export type SnapshotProvenance = {
  dealSlug: string
  /** The live engagement the file lands under, or null for the client folder. */
  engagement: string | null
  clientId: string
}

export function renderFormAnswersMarkdown(
  link: FormLink,
  provenance: SnapshotProvenance
): string {
  const snapshot = link.formSnapshot
  const front = [
    "---",
    `form: ${snapshot.slug}`,
    ...(snapshot.sourceRepo ? [`source_repo: ${snapshot.sourceRepo}`] : []),
    ...(snapshot.sourcePath ? [`source_path: ${snapshot.sourcePath}`] : []),
    `deal: ${provenance.dealSlug}`,
    `engagement: ${provenance.engagement ?? "none"}`,
    `form_link: ${link.id}`,
    `client: ${provenance.clientId}`,
    `sent: ${isoDate(link.sentAt)}`,
    ...(link.completedAt ? [`completed: ${isoDate(link.completedAt)}`] : []),
    `snapshot_taken: ${isoDate(new Date())}`,
    "---",
  ]

  const sections = zipAnswers(snapshot, link.answers).map(
    (field) => `## ${field.label}\n\n${renderAnswer(field.answer)}`
  )

  return [
    front.join("\n"),
    `# ${snapshot.title} — answers`,
    `> Snapshot of \`biz.form_links\` row \`${link.id}\`, committed by the admin ` +
      "dashboard. The record lives in Neon; this copy is immutable — edit " +
      "nothing here, it changes nothing there (icm-board D24).",
    ...sections,
    "",
  ].join("\n\n")
}
