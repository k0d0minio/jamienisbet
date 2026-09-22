import { isFormFieldType, type FormField, type FormSnapshot } from "./forms"

// The questionnaire markdown → snapshot parser, shared by the two apps that
// read the same files: the admin dashboard (the Forms card sends a form) and
// the portfolio (the public `/start` page renders the intake form). It moved
// here from the dashboard's `lib/onboarding.ts` on 2026-09-22 so the two never
// drift — the grammar is documented for humans in icm-board's
// `workspaces/sell/references/forms/README.md`, and this module is the
// implementation of it. Pure: no filesystem, no network, no `server-only`.

/**
 * Front matter — `title` and `intro`, nothing else is read.
 *
 * Hand-rolled rather than pulled from a YAML library: the convention permits a
 * plain scalar and the two block forms (`>` folded, `|` literal), which is a
 * dozen lines, and neither app has another reason to carry a parser.
 */
function parseFrontMatter(markdown: string): {
  data: Record<string, string>
  body: string
} {
  const lines = markdown.replace(/^﻿/, "").split("\n")
  if (lines[0]?.trim() !== "---") return { data: {}, body: markdown }

  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---")
  if (end === -1) return { data: {}, body: markdown }

  const data: Record<string, string> = {}
  let i = 1
  while (i < end) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) {
      i += 1
      continue
    }
    const [, key, inline] = match
    const marker = inline.trim()

    if (marker === ">" || marker === "|") {
      // A block scalar: every following indented line belongs to it. Folded
      // (`>`) joins on spaces, literal (`|`) keeps the line breaks.
      const block: string[] = []
      i += 1
      while (i < end && (lines[i].trim() === "" || /^\s+/.test(lines[i]))) {
        block.push(lines[i].trim())
        i += 1
      }
      data[key] = (marker === ">" ? block.join(" ") : block.join("\n")).trim()
      continue
    }

    data[key] = marker.replace(/^["'](.*)["']$/, "$1")
    i += 1
  }

  return { data, body: lines.slice(end + 1).join("\n") }
}

/** The default answer key for a question with no explicit `key:` — its heading,
 * slugified. Set `key:` on anything you expect to reword, or the stored answers
 * stop lining up across sends. */
export function slugifyQuestion(heading: string): string {
  return (
    heading
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "question"
  )
}

/** One question's `- key: value` config list. Prose outside the list is ignored
 * (the README reserves it), and so is anything that isn't a recognised key. */
function parseConfig(lines: string[]): Map<string, string> {
  const config = new Map<string, string>()
  for (const line of lines) {
    const item = line.match(/^\s*[-*]\s+([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!item) continue
    config.set(item[1].trim().toLowerCase(), item[2].trim())
  }
  return config
}

function parseField(heading: string, lines: string[]): FormField {
  const config = parseConfig(lines)

  const rawType = config.get("type") ?? "text"
  const type = isFormFieldType(rawType) ? rawType : "text"

  // ` | ` per the convention, but a bare pipe is accepted too — a form that
  // renders one option called "A | B" is a worse failure than being lenient.
  const options =
    type === "select"
      ? (config.get("options") ?? "")
          .split("|")
          .map((o) => o.trim())
          .filter((o) => o.length > 0)
      : null

  const optional = /^(yes|true)$/i.test(config.get("optional") ?? "")
  const hint = config.get("hint")?.trim()
  const key = config.get("key")?.trim()

  return {
    key: key && key.length > 0 ? key : slugifyQuestion(heading),
    label: heading,
    type,
    required: !optional,
    hint: hint && hint.length > 0 ? hint : null,
    options: options && options.length > 0 ? options : null,
  }
}

/**
 * A questionnaire file → the snapshot that gets frozen onto a link (or, on the
 * portfolio, rendered as the public intake form).
 *
 * Strict where being wrong would reach a customer (no title, no questions, a
 * `select` with no options, two questions sharing an answer key) and lenient
 * everywhere else — an unknown `type:` falls back to a text box rather than
 * refusing to send the form.
 *
 * `sourceRepo` is the "owner/name" the markdown came from, `sourcePath` the
 * file's path inside it — both recorded on the snapshot as provenance
 * (`k0d0minio/icm-board` · `workspaces/sell/references/forms/<slug>.md` for
 * a house form; a client's own delivery repo · `.icm/onboarding/<slug>.md`
 * for one written for them).
 */
export function parseOnboardingForm(
  slug: string,
  markdown: string,
  sourceRepo: string | null = null,
  sourcePath: string | null = null
): FormSnapshot {
  const { data, body } = parseFrontMatter(markdown)

  // Errors are read by someone about to go and fix the file, and two repos can
  // both have a `project-intake.md` — so a complaint names the repo whenever
  // one is known.
  const file = sourceRepo === null ? `${slug}.md` : `${slug}.md in ${sourceRepo}`

  const title = data.title?.trim()
  if (!title) {
    throw new Error(`${file} has no \`title\` in its front matter.`)
  }

  const lines = body.split("\n")
  const fields: FormField[] = []
  let heading: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (heading !== null) fields.push(parseField(heading, buffer))
    buffer = []
  }

  for (const line of lines) {
    // `##` exactly — a `###` inside a question is prose, not a new question.
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h2) {
      flush()
      heading = h2[1].trim()
      continue
    }
    if (heading !== null) buffer.push(line)
  }
  flush()

  if (fields.length === 0) {
    throw new Error(
      `${file} has no questions — each question is a \`##\` heading.`
    )
  }

  const emptySelect = fields.find(
    (f) => f.type === "select" && (f.options?.length ?? 0) === 0
  )
  if (emptySelect) {
    throw new Error(
      `"${emptySelect.label}" in ${file} is a select with no \`options:\` line.`
    )
  }

  // Duplicate keys would have the second answer overwrite the first, silently.
  const seen = new Set<string>()
  for (const field of fields) {
    if (seen.has(field.key)) {
      throw new Error(
        `${file} uses the answer key "${field.key}" twice — set a distinct \`key:\` on one of them.`
      )
    }
    seen.add(field.key)
  }

  return {
    slug,
    sourceRepo,
    sourcePath,
    title,
    intro: data.intro?.trim() ?? "",
    fields,
  }
}
