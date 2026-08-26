import "server-only"

import { readdir, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"

import type { FormField, FormSnapshot } from "@jamie-nisbet/services"
import { isFormFieldType } from "@jamie-nisbet/services"

// The questionnaire library: `.icm/onboarding/<slug>.md`, parsed into the
// snapshot shape the send action freezes onto a link row. The file format is
// documented for humans in that folder's README — this module is the
// implementation of it, and the two must not drift.
//
// Questionnaires come from **two repos**, the same way the tickets board reads
// `.icm/intake/` from every connected repo rather than from one:
//
//   - The *house* library, `.icm/onboarding/` at this repo's root — general
//     forms like `project-intake`, offered on every lead.
//   - The lead's own *delivery repo* (`biz.clients.github_repo`, the same field
//     the tickets board rosters from) — questionnaires written for that one
//     client, offered only on their profile. A form written for Casey has no
//     business appearing in the picker for anyone else, so the roster is scoped
//     per lead rather than pooled estate-wide.
//
// A repo with no `.icm/onboarding/` simply contributes nothing — connecting a
// delivery repo is the whole onboarding step, and there is no config here to
// change when a client repo grows its first questionnaire.
//
// Reading is deliberately dumb: each folder holds a handful of small files, so
// every call loads all of them and picks. There is no cache to invalidate, no
// build step, and no second lookup path for "read one" — editing a file in git
// changes what the next "Send form" click sends, and nothing else.
//
// The house library is read from disk first (the whole repo ships with the
// deployment, and next.config.ts sets `outputFileTracingRoot` to the repo root
// so `.icm/onboarding/` — which sits above the pnpm workspace — traces into the
// dashboard's serverless bundle), falling back to GitHub so a tracing miss
// degrades to a slower read rather than a dashboard that can't send anything.
// Client repos are never on disk, so they are GitHub-only — like tickets.

const FOLDER = ".icm/onboarding"
const HOUSE_REPO = process.env.ONBOARDING_REPO || "k0d0minio/jamienisbet"
const REVALIDATE_SECONDS = 60

/**
 * What the picker submits and the send action resolves: a bare slug for a house
 * form, or `<repo-name>/<slug>` for one out of the lead's delivery repo. Slugs
 * can't contain a slash, so the two spaces can never collide — a client repo is
 * free to carry its own `project-intake.md` without shadowing the house one.
 *
 * A slug is also a filename, so this is checked before either half is ever
 * joined to a path or a contents-API URL.
 */
const FORM_ID = /^(?:[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/

/** "owner/name" → "name", the half worth showing on screen. */
const repoName = (fullName: string) => fullName.split("/").pop() ?? fullName

function formId(slug: string, sourceRepo: string | null): string {
  return sourceRepo === null ? slug : `${repoName(sourceRepo)}/${slug}`
}

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
  markdown: string,
  sourceRepo: string | null = null
): FormSnapshot {
  const { data, body } = parseFrontMatter(markdown)

  // Errors are read in the dashboard by someone about to go and fix the file,
  // and two repos can both have a `project-intake.md` — so a complaint names
  // the repo whenever the file isn't the house one.
  const file =
    sourceRepo === null ? `${slug}.md` : `${slug}.md in ${sourceRepo}`

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
    title,
    intro: data.intro?.trim() ?? "",
    fields,
  }
}

// ---------------------------------------------------------------------------
// Sources.

type RawForm = { slug: string; markdown: string; sourceRepo: string | null }

/** One repo's contribution. `error` is a sentence for the dashboard's banner —
 * a repo that simply has no `.icm/onboarding/` yields neither forms nor an
 * error, the same way the tickets board treats a missing `.icm/intake/`. */
type SourceResult = { forms: RawForm[]; error: string | null }

const isFormFile = (name: string) =>
  name.endsWith(".md") && name.toLowerCase() !== "readme.md"

/**
 * Where `.icm/onboarding/` sits relative to the process. It lives at the *repo*
 * root — four levels above this app (`projects/jamienisbet/websites/
 * admin-dashboard`), since the web estate sits under `projects/` and `.icm/`
 * stays at the top with the ICM control layer. `next build` and the server both
 * run with cwd at the app directory, but a traced serverless bundle can land a
 * level or two elsewhere — so the candidates are tried in order rather than
 * assumed, longest hop first.
 */
const DISK_CANDIDATES = ["../../../..", "../..", "..", "."].map((up) =>
  resolve(process.cwd(), up, FOLDER)
)

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
        sourceRepo: null,
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

/**
 * One repo's `.icm/onboarding/` over the read-only contents API — the same
 * pattern the tickets board uses for `.icm/intake/`, and the only way to read a
 * client's delivery repo, which is never on this deployment's disk.
 *
 * `sourceRepo` is what the parsed forms get stamped with, so the house library
 * can be read this way too (as the disk fallback) and still come back marked as
 * the house rather than as `k0d0minio/jamienisbet`.
 */
async function readFromGithub(
  fullName: string,
  sourceRepo: string | null
): Promise<SourceResult> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      forms: [],
      error: `Couldn't read ${fullName} — GITHUB_TOKEN isn't set on this deployment.`,
    }
  }
  try {
    const listing = await gh(
      `/repos/${fullName}/contents/${FOLDER}`,
      "application/vnd.github+json"
    )
    // No `.icm/onboarding/` on main just means this repo carries no
    // questionnaires of its own — the common case for a delivery repo, and not
    // something to put a banner on the lead's profile about.
    if (listing.status === 404) return { forms: [], error: null }
    if (!listing.ok) {
      return {
        forms: [],
        error: `Couldn't read ${FOLDER}/ in ${fullName} — GitHub returned HTTP ${listing.status}.`,
      }
    }
    const entries = (await listing.json()) as { type: string; name: string }[]
    const names = entries
      .filter((e) => e.type === "file" && isFormFile(e.name))
      .map((e) => e.name)
      .sort()

    const forms = await Promise.all(
      names.map(async (name) => {
        const res = await gh(
          `/repos/${fullName}/contents/${FOLDER}/${encodeURIComponent(name)}`,
          "application/vnd.github.raw+json"
        )
        if (!res.ok) return null
        return {
          slug: name.replace(/\.md$/, ""),
          markdown: await res.text(),
          sourceRepo,
        }
      })
    )
    return { forms: forms.filter((f) => f !== null), error: null }
  } catch (err) {
    return {
      forms: [],
      error: `Couldn't read ${FOLDER}/ in ${fullName} — ${
        err instanceof Error ? err.message : "network error"
      }.`,
    }
  }
}

/** The house library: disk if the folder shipped with the deployment, GitHub if
 * tracing missed it. Either way the forms come back unstamped (`sourceRepo:
 * null`) — they belong to this repo, not to a client. Both routes failing is
 * one condition, not two, so it gets one plain sentence. */
async function readHouseForms(): Promise<SourceResult> {
  const disk = await readFromDisk()
  if (disk !== null) return { forms: disk, error: null }

  const remote = await readFromGithub(HOUSE_REPO, null)
  if (remote.error === null) return remote
  return {
    forms: [],
    error: `Couldn't read the house ${FOLDER}/ — not found on disk, and GitHub is unavailable or unconfigured.`,
  }
}

/**
 * Every questionnaire on offer for one lead: the house library plus, when the
 * lead has a delivery repo connected, that repo's own. Their forms come first —
 * a questionnaire written for this client is the one you reached for the button
 * to send, and it is what the picker preselects.
 *
 * Best-effort per source, like the tickets board: an unreachable client repo
 * becomes a banner on the profile, not a picker with nothing in it.
 */
async function readAll(clientRepo: string | null): Promise<SourceResult> {
  // A lead connected to *this* repo (the house library is a repo like any
  // other) would otherwise have every house form listed twice — once unstamped,
  // once stamped. It is the house library either way.
  const secondSource = clientRepo === HOUSE_REPO ? null : clientRepo

  const [house, client] = await Promise.all([
    readHouseForms(),
    secondSource ? readFromGithub(secondSource, secondSource) : null,
  ])

  const errors = [house.error, client?.error ?? null].filter(
    (e): e is string => e !== null
  )

  return {
    forms: [...(client?.forms ?? []), ...house.forms],
    error: errors.length > 0 ? errors.join(" ") : null,
  }
}

// ---------------------------------------------------------------------------
// The two calls the dashboard makes.

/** What the "Send form" picker lists. A file that doesn't parse is reported
 * beside the ones that do, so a typo in one questionnaire doesn't take the
 * whole picker down — and says which file, in which repo, and what's wrong. */
export type FormChoice = {
  /** What the picker submits back: a slug, or `<repo-name>/<slug>`. */
  id: string
  slug: string
  title: string
  questionCount: number
  /** "owner/name" this came from, or null for the house library. */
  sourceRepo: string | null
}

export async function listOnboardingForms(clientRepo: string | null): Promise<{
  forms: FormChoice[]
  errors: string[]
}> {
  const { forms: raw, error } = await readAll(clientRepo)

  const forms: FormChoice[] = []
  const errors: string[] = error === null ? [] : [error]
  for (const { slug, markdown, sourceRepo } of raw) {
    try {
      const snapshot = parseOnboardingForm(slug, markdown, sourceRepo)
      forms.push({
        id: formId(slug, sourceRepo),
        slug,
        title: snapshot.title,
        questionCount: snapshot.fields.length,
        sourceRepo,
      })
    } catch (err) {
      errors.push(
        err instanceof Error ? err.message : `${slug}.md is malformed.`
      )
    }
  }
  return { forms, errors }
}

/**
 * Parse one questionnaire, ready to be frozen onto a link. Throws with a
 * message meant to be read in the dashboard — the send action surfaces it
 * rather than storing a half-parsed form.
 *
 * Resolution is scoped to the same lead the picker was drawn for, so an id can
 * only ever name a form that lead was actually offered — a client-repo slug
 * can't be sent to someone else by hand-editing the request.
 */
export async function loadOnboardingForm(
  clientRepo: string | null,
  id: string
): Promise<FormSnapshot> {
  if (!FORM_ID.test(id)) throw new Error(`"${id}" isn't a valid form name.`)

  const { forms } = await readAll(clientRepo)
  const found = forms.find((f) => formId(f.slug, f.sourceRepo) === id)
  if (!found) {
    throw new Error(
      id.includes("/")
        ? `There's no ${FOLDER}/${id.split("/").pop()}.md in this lead's repo.`
        : `There's no ${FOLDER}/${id}.md in this repo.`
    )
  }

  return parseOnboardingForm(found.slug, found.markdown, found.sourceRepo)
}
