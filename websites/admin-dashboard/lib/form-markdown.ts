import "server-only"

import { zipAnswers, type FormLink } from "@jamie-nisbet/services"

// Renders a completed questionnaire (frozen snapshot + the answers that came
// back) as the markdown file committed into the client's delivery repo — so a
// session working in that repo reads what the client actually said instead of
// writing tickets from memory. One store rule: Neon (`biz.form_links`) stays
// the record; this file is a rendered copy and says so at the top.

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function renderAnswer(value: string | boolean | null): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (value === null || value.trim() === "") return "_Not answered._"
  return value.trim()
}

export function renderFormAnswersMarkdown(link: FormLink): string {
  const snapshot = link.formSnapshot
  const front = [
    "---",
    `form: ${snapshot.slug}`,
    ...(snapshot.sourceRepo ? [`source_repo: ${snapshot.sourceRepo}`] : []),
    `sent: ${isoDate(link.sentAt)}`,
    ...(link.completedAt ? [`completed: ${isoDate(link.completedAt)}`] : []),
    "---",
  ]

  const sections = zipAnswers(snapshot, link.answers).map(
    (field) => `## ${field.label}\n\n${renderAnswer(field.answer)}`
  )

  return [
    front.join("\n"),
    `# ${snapshot.title} — answers`,
    "> Rendered copy of a completed questionnaire, committed by the admin " +
      "dashboard. The record lives in Neon (`biz.form_links`); edit nothing " +
      "here — it changes nothing there.",
    ...sections,
    "",
  ].join("\n\n")
}
