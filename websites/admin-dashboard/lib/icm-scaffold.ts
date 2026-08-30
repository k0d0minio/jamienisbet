import "server-only"

// Seeding a freshly created client delivery repo with the estate's baseline —
// the `.icm/` folder the tickets board reads (`.icm/intake/`) and the
// questionnaire picker looks in (`.icm/onboarding/`, when the repo grows one),
// plus the canonical root rails that sit beside it.
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
//
// ---------------------------------------------------------------------------
// What is deliberately *not* seeded, and why. Both were open questions on the
// stub that added `root/` here (`.icm/intake/triage/scaffold-root-rails.md`);
// they are settled against `icm-check.sh`, which is the estate's own definition
// of a conformant repo.
//
//   - **`AGENTS.md`, and therefore the `CLAUDE.md` importer that points at it.**
//     Layer 0 is never templated — each repo writes its own identity, and an
//     empty one reads as established intent (the same reason `.icm/project.md`
//     is never templated either). A repo created seconds ago has no product to
//     describe, so the dashboard would be inventing one. Seeding the importer
//     *without* its target is worse still: `icm-check.sh` calls that out as
//     "Layer 0 resolves to nothing" — a gap where there was none. So both stay
//     with `/project` adoption, which writes Layer 0 from a real interrogation.
//
//     This costs the new repo nothing mechanically: `icm-check.sh` requires the
//     root bundle only once a repo carries `AGENTS.md`, so a scaffolded repo
//     lands with **no gaps** — just the two warnings every repo carries until a
//     human has adopted it ("no Layer-0 identity file", "no `.icm/project.md`").
//     `opencode.json` is seeded regardless, because that gate exists to spare
//     *un-migrated* repos a shape they haven't been moved to yet, and a repo
//     born today has no legacy Layer 0 to move: it is new-shape by
//     construction, and the rails are worth having from minute one.
//
//   - **`.claude/`** — canonical for every live repo, and it belongs in a
//     scaffold in principle. It cannot be seeded *from here*: the two hooks
//     `settings.json` wires up are invoked by path, so they must be committed
//     executable, and the contents API only ever writes mode 100644. Seeding
//     them would leave a repo whose hooks look present and never run, and which
//     `icm-check.sh --fix` would then decline to repair because the files
//     already exist. A visible, repairable gap beats a file that looks right
//     and isn't, so `.claude/` stays with `--fix`, which has a filesystem and
//     can `chmod`. Doing it here needs the git *tree* API (mode 100755) —
//     parked as its own triage stub.

import { commitRepoFile } from "@/lib/github"

const API = "https://api.github.com"

/** The repo holding the canonical scaffold. Overridable so a fork of the estate
 * can point elsewhere without a code change. */
const TEMPLATE_REPO = process.env.ICM_TEMPLATE_REPO || "k0d0minio/icm-board"
const TEMPLATE_ROOT = "_system/template"

/** One folder of the template and where its files land in the new repo.
 *
 * Keeping this a table rather than a hardcoded file list is the same bet the
 * walk below makes: adding a file to a template folder in `icm-board` should
 * reach the next repo created without an edit here. Adding a *folder* is one
 * row. */
type TemplateSource = {
  /** Folder under `_system/template/` in the template repo. */
  from: string
  /** Prefix for every file's path in the new repo; `""` is the repo root. */
  to: string
  /** Paths relative to `from` that this scaffold never seeds — see the header
   * for why each one is excluded. */
  skip?: readonly string[]
}

const SOURCES: readonly TemplateSource[] = [
  { from: "icm", to: ".icm/" },
  // `root/CLAUDE.md` is the one-line `@AGENTS.md` importer, and there is no
  // `AGENTS.md` in a repo this new for it to import.
  { from: "root", to: "", skip: ["CLAUDE.md"] },
]

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

/** One template file, already addressed as the path it will take in the new
 * repo — so `intake/README.md` under the `icm` source is `.icm/intake/README.md`
 * here, and `opencode.json` under `root` is just `opencode.json`. */
type TemplateFile = { path: string; content: string }

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
 * Walk one template folder. Deliberately generic rather than a hardcoded file
 * list: adding a file to `_system/template/<source>/` in `icm-board` should
 * reach the next repo created without an edit here. Throws with a sentence the
 * dashboard can show — the caller turns it into the scaffold error.
 */
async function readTemplate(
  source: TemplateSource,
  path: string = `${TEMPLATE_ROOT}/${source.from}`,
  depth = 0
): Promise<TemplateFile[]> {
  if (depth > MAX_DEPTH) return []

  const root = `${TEMPLATE_ROOT}/${source.from}`
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
    const relativePath = entry.path.slice(root.length + 1)
    if (source.skip?.includes(relativePath)) continue
    if (entry.type === "dir") {
      files.push(...(await readTemplate(source, entry.path, depth + 1)))
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
      path: `${source.to}${relativePath}`,
      content: await raw.text(),
    })
  }
  return files
}

/** `{{PREFIX}}` substituted, plus the suggested-prefix caveat on the one file
 * that names the prefix. */
function render(file: TemplateFile, prefix: string): string {
  const body = file.content.replaceAll("{{PREFIX}}", prefix)
  if (file.path !== ".icm/intake/README.md") return body
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
 * Copy every folder in `SOURCES` into the new repo, one commit per file via the
 * contents API. Existing paths are never touched, so this is safe to run
 * against a repo that already has part of the baseline.
 *
 * A source that can't be read is reported but doesn't stop the others: a repo
 * with its `.icm/` and no `opencode.json` is worth strictly more than a repo
 * with neither, and the error sentence names what's missing either way.
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

  const template: TemplateFile[] = []
  const problems: string[] = []
  for (const source of SOURCES) {
    const root = `${TEMPLATE_ROOT}/${source.from}`
    try {
      const files = await readTemplate(source)
      if (files.length === 0) {
        problems.push(`${root}/ in ${TEMPLATE_REPO} is empty`)
        continue
      }
      template.push(...files)
    } catch (err) {
      problems.push(
        err instanceof Error
          ? err.message
          : `couldn't read ${root}/ in ${TEMPLATE_REPO}`
      )
    }
  }

  if (template.length === 0) {
    return { prefix, created: [], error: problems.join("; ") }
  }

  const created: string[] = []
  const failures: string[] = []
  for (const file of template) {
    const result = await commitRepoFile(
      fullName,
      file.path,
      render(file, prefix),
      `Seed the ICM baseline: ${file.path}`
    )
    if (result.outcome === "created") created.push(file.path)
    // "exists" is a skip, not a failure — the template never overwrites.
    if (result.outcome === "failed") {
      failures.push(`${file.path} (${result.error})`)
    }
  }
  if (failures.length > 0) {
    problems.push(`couldn't commit ${failures.join(", ")}`)
  }

  return {
    prefix,
    created,
    error: problems.length === 0 ? null : problems.join("; "),
  }
}
