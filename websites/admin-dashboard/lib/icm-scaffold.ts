import "server-only"

// Seeding a freshly created client delivery repo with the estate's `.icm/`
// baseline — the folder the tickets board reads (`.icm/intake/`) and the
// questionnaire picker looks in (`.icm/onboarding/`, when the repo grows one).
//
// Without it a new client repo is *absent* from the board rather than empty,
// and `icm-check.sh` later reports it as a gap. Creating the repo from the
// dashboard is the one moment we know a repo has just come into existence with
// nothing in it, so it is the right moment to seed.
//
// The canonical scaffold is **not in this repo**: the estate control layer split
// out to `icm-board` on 2026-08-26, so `_system/template/` is no longer on this
// deployment's disk and there is nothing for `outputFileTracingIncludes` to
// trace. It is read over the contents API at call time instead — the same
// read-only `GITHUB_TOKEN` pattern `lib/tickets.ts` and `lib/onboarding.ts` use
// for repos that were never on disk. That keeps one source of truth: an edit to
// the template reaches the next repo created, with no redeploy here.
//
// Two rules come straight from the template's own README and are kept:
//
//   - **Never overwrite.** `commitRepoFile` refuses to touch an existing path,
//     and an "exists" outcome is a quiet skip, not a failure.
//   - **A derived prefix is *suggested*, not settled.** `icm-check.sh` says so
//     on stdout to whoever ran it; there is no stdout here, so the seeded
//     README carries the same caveat in writing.

import { commitRepoFile } from "@/lib/github"

const API = "https://api.github.com"

/** The repo holding the canonical scaffold, and the folder within it that is
 * copied to `<repo>/.icm/`. Overridable so a fork of the estate can point
 * elsewhere without a code change. */
const TEMPLATE_REPO = process.env.ICM_TEMPLATE_REPO || "k0d0minio/icm-board"
const TEMPLATE_PATH = "_system/template/icm"

/** The template is four files deep at most; the cap is only there so a
 * misconfigured path can't walk a whole repository. */
const MAX_DEPTH = 4

/**
 * The ticket prefix for a brand-new repo, mirroring `derive_prefix` in
 * `icm-check.sh`: the first hyphen-segment of the repo name, uppercased, A–Z
 * only, capped at five characters.
 *
 * The script's other two sources don't apply here — a repo created seconds ago
 * has no tickets to read a prefix off, and the script's known-prefix map covers
 * repos that already exist. So this is always the "suggested" case, and the
 * seeded README says so.
 *
 * Falls back to the letters of the whole name, then to a generic prefix: repo
 * names may legally be all digits, which would otherwise derive to nothing.
 * The script never has to handle that because a human reads its output.
 */
export function deriveTicketPrefix(repoName: string): string {
  const letters = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "")
  const derived = letters(repoName.split("-")[0]) || letters(repoName)
  return derived.slice(0, 5) || "TKT"
}

/** Appended to the seeded `.icm/intake/README.md` — the written form of the
 * warning `icm-check.sh --fix` prints when it derives a prefix. */
function suggestedPrefixNote(prefix: string): string {
  return [
    "",
    `> Ticket prefix \`${prefix}\` was derived from the repo name when this baseline was`,
    "> seeded from the admin dashboard — **suggested, not settled.** Confirm it before",
    "> cutting the first ticket (numbers are never reused), and register it in",
    "> `_system/contracts/TICKETS.md` in the `icm-board` repo.",
    "",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Reading the template.

/** One template file, addressed relative to `TEMPLATE_PATH` — so
 * `intake/README.md` here becomes `.icm/intake/README.md` in the new repo. */
type TemplateFile = { relativePath: string; content: string }

async function gh(path: string, accept: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    // Read as part of a write action — never serve a cached template.
    cache: "no-store",
  })
}

const encodePath = (path: string) =>
  path.split("/").map(encodeURIComponent).join("/")

/**
 * Walk the template folder. Deliberately generic rather than a hardcoded file
 * list: adding a file to `_system/template/icm/` in `icm-board` should reach
 * the next repo created without an edit here. Throws with a sentence the
 * dashboard can show — the caller turns it into the scaffold error.
 */
async function readTemplate(
  path: string = TEMPLATE_PATH,
  depth = 0
): Promise<TemplateFile[]> {
  if (depth > MAX_DEPTH) return []

  const listing = await gh(
    `/repos/${TEMPLATE_REPO}/contents/${encodePath(path)}`,
    "application/vnd.github+json"
  )
  if (!listing.ok) {
    throw new Error(
      `couldn't read ${path} in ${TEMPLATE_REPO} (GitHub returned HTTP ${listing.status})`
    )
  }
  const entries = (await listing.json()) as {
    type: string
    name: string
    path: string
  }[]

  const files: TemplateFile[] = []
  // Sorted so the seeded repo's commits land in a stable, readable order.
  for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.type === "dir") {
      files.push(...(await readTemplate(entry.path, depth + 1)))
      continue
    }
    if (entry.type !== "file") continue
    const raw = await gh(
      `/repos/${TEMPLATE_REPO}/contents/${encodePath(entry.path)}`,
      "application/vnd.github.raw+json"
    )
    if (!raw.ok) {
      throw new Error(
        `couldn't read ${entry.path} in ${TEMPLATE_REPO} (GitHub returned HTTP ${raw.status})`
      )
    }
    files.push({
      relativePath: entry.path.slice(TEMPLATE_PATH.length + 1),
      content: await raw.text(),
    })
  }
  return files
}

/** `{{PREFIX}}` substituted, plus the suggested-prefix caveat on the one file
 * that names the prefix. */
function render(file: TemplateFile, prefix: string): string {
  const body = file.content.replaceAll("{{PREFIX}}", prefix)
  if (file.relativePath !== "intake/README.md") return body
  return `${body.trimEnd()}\n${suggestedPrefixNote(prefix)}`
}

// ---------------------------------------------------------------------------
// Seeding.

export type ScaffoldResult = {
  /** The prefix written into `.icm/intake/README.md`. */
  prefix: string
  /** Paths committed into the repo, in template order. */
  created: string[]
  /**
   * A sentence for the dashboard when the baseline didn't fully land, else
   * null. Returned rather than thrown, like `sendFormToClient`: Next redacts
   * server-action exceptions in production, and "GitHub returned HTTP 403" is
   * exactly the sentence that has to survive the trip to the browser.
   */
  error: string | null
}

/**
 * Copy `_system/template/icm/` into `<repo>/.icm/`, one commit per file via the
 * contents API. Existing paths are never touched, so this is safe to run
 * against a repo that already has part of the baseline.
 *
 * Never throws: the caller has already created the repo on GitHub and stored
 * the pointer, and a scaffold that fails must not cost the lead its link.
 */
export async function scaffoldIcmBaseline(
  fullName: string
): Promise<ScaffoldResult> {
  const prefix = deriveTicketPrefix(fullName.split("/").pop() ?? fullName)

  if (!process.env.GITHUB_TOKEN) {
    return {
      prefix,
      created: [],
      error: "GITHUB_TOKEN isn't set on this deployment.",
    }
  }

  let template: TemplateFile[]
  try {
    template = await readTemplate()
  } catch (err) {
    return {
      prefix,
      created: [],
      error: err instanceof Error ? err.message : "couldn't read the template.",
    }
  }

  if (template.length === 0) {
    return {
      prefix,
      created: [],
      error: `${TEMPLATE_PATH}/ in ${TEMPLATE_REPO} is empty.`,
    }
  }

  const created: string[] = []
  const failures: string[] = []
  for (const file of template) {
    const path = `.icm/${file.relativePath}`
    const result = await commitRepoFile(
      fullName,
      path,
      render(file, prefix),
      `Seed the ICM baseline: ${path}`
    )
    if (result.outcome === "created") created.push(path)
    // "exists" is a skip, not a failure — the template never overwrites.
    if (result.outcome === "failed") failures.push(`${path} (${result.error})`)
  }

  return {
    prefix,
    created,
    error:
      failures.length === 0
        ? null
        : `couldn't commit ${failures.join(", ")}`,
  }
}
