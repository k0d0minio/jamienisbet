import "server-only"

import { readdir, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"

import type { FormField, FormSnapshot } from "@jamie-nisbet/services"
import { isFormFieldType } from "@jamie-nisbet/services"

// The questionnaire library: `.icm/onboarding/<slug>.md` in this repo, parsed
// into the snapshot shape the send action freezes onto a link row. The file
// format is documented for humans in that folder's README — this module is the
// implementation of it, and the two must not drift.
//
// Reading is deliberately dumb: the folder holds a handful of small files, so
// every call loads all of them and picks. There is no cache to invalidate, no
// build step, and no second lookup path for "read one" — editing a file in git
// changes what the next "Send form" click sends, and nothing else.
//
// Two sources, in order:
//   1. Disk. The whole monorepo ships with the deployment, and next.config.ts
//      traces `.icm/onboarding/` into the dashboard's serverless bundle.
//   2. GitHub, if the folder isn't on disk — the same read-only contents-API
//      pattern the tickets board uses, so a tracing miss on Vercel degrades to
//      a slower read rather than a dashboard that can't send anything.

const FOLDER = ".icm/onboarding"
const SOURCE_REPO = process.env.ONBOARDING_REPO || "k0d0minio/jamienisbet"
const REVALIDATE_SECONDS = 60

/** A slug is a filename, so it is checked before it is ever joined to a path. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/

// ---------------------------------------------------------------------------
// Parsing.

/**
 * Front matter — `title` and `intro`, nothing else is read.
 *
 * Hand-rolled rather than pulled from a YAML library: the convention permits a
 * plain scalar and the two block forms (`>` folded, `|` literal), which is a
 * dozen lines, and the dashboard has no other reason to carry a parser.
 */
function parseFrontMatter(markdown: string): {
  data: Record<string, string>
  body: string
} {
  const lines = markdown.replace(/^\uFEFF/, "").split("\n")
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
      .replace(/[\u0300-\u036f]/g, "")
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
 * A questionnaire file → the snapshot that gets frozen onto a link.
 *
 * Strict where being wrong would reach a customer (no title, no questions, a
 * `select` with no options, two questions sharing an answer key) and lenient
 * everywhere else — an unknown `type:` falls back to a text box rather than
 * refusing to send the form.
 */
export function parseOnboardingForm(
  slug: string,
  markdown: string
): FormSnapshot {
  const { data, body } = parseFrontMatter(markdown)

  const title = data.title?.trim()
  if (!title) {
    throw new Error(`${slug}.md has no \`title\` in its front matter.`)
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
      `${slug}.md has no questions — each question is a \`##\` heading.`
    )
  }

  const emptySelect = fields.find(
    (f) => f.type === "select" && (f.options?.length ?? 0) === 0
  )
  if (emptySelect) {
    throw new Error(
      `"${emptySelect.label}" in ${slug}.md is a select with no \`options:\` line.`
    )
  }

  // Duplicate keys would have the second answer overwrite the first, silently.
  const seen = new Set<string>()
  for (const field of fields) {
    if (seen.has(field.key)) {
      throw new Error(
        `${slug}.md uses the answer key "${field.key}" twice — set a distinct \`key:\` on one of them.`
      )
    }
    seen.add(field.key)
  }

  return { slug, title, intro: data.intro?.trim() ?? "", fields }
}

// ---------------------------------------------------------------------------
// Sources.

type RawForm = { slug: string; markdown: string }

const isFormFile = (name: string) =>
  name.endsWith(".md") && name.toLowerCase() !== "readme.md"

/**
 * Where `.icm/onboarding/` sits relative to the process. `next build` and the
 * server both run with cwd at the app directory, but a traced serverless bundle
 * can land a level or two elsewhere — so the candidates are tried in order
 * rather than assumed.
 */
const DISK_CANDIDATES = [
  resolve(process.cwd(), "../..", FOLDER),
  resolve(process.cwd(), FOLDER),
  resolve(process.cwd(), "..", FOLDER),
]

async function readFromDisk(): Promise<RawForm[] | null> {
  for (const dir of DISK_CANDIDATES) {
    let names: string[]
    try {
      names = (await readdir(dir)).filter(isFormFile)
    } catch {
      continue // not this one — try the next candidate
    }
    return Promise.all(
      names.sort().map(async (name) => ({
        slug: name.replace(/\.md$/, ""),
        markdown: await readFile(join(dir, name), "utf8"),
      }))
    )
  }
  return null
}

async function gh(path: string, accept: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  })
}

async function readFromGithub(): Promise<RawForm[] | null> {
  if (!process.env.GITHUB_TOKEN) return null
  try {
    const listing = await gh(
      `/repos/${SOURCE_REPO}/contents/${FOLDER}`,
      "application/vnd.github+json"
    )
    if (!listing.ok) return null
    const entries = (await listing.json()) as { type: string; name: string }[]
    const names = entries
      .filter((e) => e.type === "file" && isFormFile(e.name))
      .map((e) => e.name)
      .sort()

    const forms = await Promise.all(
      names.map(async (name) => {
        const res = await gh(
          `/repos/${SOURCE_REPO}/contents/${FOLDER}/${encodeURIComponent(name)}`,
          "application/vnd.github.raw+json"
        )
        if (!res.ok) return null
        return { slug: name.replace(/\.md$/, ""), markdown: await res.text() }
      })
    )
    return forms.filter((f) => f !== null)
  } catch {
    return null
  }
}

async function readAll(): Promise<RawForm[] | null> {
  return (await readFromDisk()) ?? (await readFromGithub())
}

// ---------------------------------------------------------------------------
// The two calls the dashboard makes.

/** What the "Send form" picker lists. A file that doesn't parse is reported
 * beside the ones that do, so a typo in one questionnaire doesn't take the
 * whole picker down — and says which file and what's wrong with it. */
export type FormChoice = {
  slug: string
  title: string
  questionCount: number
}

export async function listOnboardingForms(): Promise<{
  forms: FormChoice[]
  errors: string[]
}> {
  const raw = await readAll()
  if (raw === null) {
    return {
      forms: [],
      errors: [
        `Couldn't read ${FOLDER}/ — not found on disk, and GitHub is unavailable or unconfigured.`,
      ],
    }
  }

  const forms: FormChoice[] = []
  const errors: string[] = []
  for (const { slug, markdown } of raw) {
    try {
      const snapshot = parseOnboardingForm(slug, markdown)
      forms.push({
        slug,
        title: snapshot.title,
        questionCount: snapshot.fields.length,
      })
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${slug}.md is malformed.`)
    }
  }
  return { forms, errors }
}

/** Parse one questionnaire, ready to be frozen onto a link. Throws with a
 * message meant to be read in the dashboard — the send action surfaces it
 * rather than storing a half-parsed form. */
export async function loadOnboardingForm(slug: string): Promise<FormSnapshot> {
  if (!SLUG.test(slug)) throw new Error(`"${slug}" isn't a valid form name.`)

  const raw = await readAll()
  if (raw === null) throw new Error(`Couldn't read ${FOLDER}/.`)

  const found = raw.find((f) => f.slug === slug)
  if (!found) throw new Error(`There's no ${FOLDER}/${slug}.md in this repo.`)

  return parseOnboardingForm(slug, found.markdown)
}
