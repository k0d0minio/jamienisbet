import "server-only"

// Seeding a freshly created client delivery repo with the estate's baseline —
// the `.icm/` folder the tickets board reads (`.icm/intake/`) and the
// questionnaire picker looks in (`.icm/onboarding/`, when the repo grows one —
// the house forms themselves live in icm-board's deal workspace),
// the `.claude/` assets a cloud session in that repo has no history to learn
// the estate's conventions from, and the canonical root rails beside them.
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
//   - **Never overwrite.** `commitRepoFiles` reads the repo's current tree first
//     and writes only the paths that are free; a taken one is a quiet skip, not
//     a failure.
//   - **No substitutions.** Nothing in the template is templated per repo, so a
//     file is committed exactly as it reads in `icm-board` — no rendering step,
//     no appended notes. That is what makes a seeded copy drift-checkable
//     against the canonical one at all: anything written *around* the template
//     here would read as divergence from the day the repo was born. It is also
//     what keeps this file honest about a contract it does not own — the estate
//     retired ticket prefixes and numbers on 2026-08-28 (identity is the
//     `<epic>/<slug>` path), and a scaffold that paraphrases the contract is a
//     scaffold that goes stale silently the next time it moves.
//
// Writes go through the git **tree** API (`commitRepoFiles`), and that is what
// lets `.claude/` be seeded at all. The two hooks `settings.json` wires up are
// invoked by path —
//
//     "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh"
//
// — so they have to be committed executable, and the contents API, which the
// rest of the dashboard writes through, only ever writes mode 100644. A hook
// seeded 100644 looks present and never runs, and `icm-check.sh --fix` then
// declines to repair it because the file already exists: a silent broken state
// where there had been a visible, repairable gap. The tree API is the only way
// to say 100755, and it pays for itself twice over — the whole baseline lands
// as one commit rather than a dozen in the first minute of a repo's life.
//
// ---------------------------------------------------------------------------
// What is deliberately *not* seeded, and why. This was an open question on the
// stub that added `root/` here (`.icm/intake/triage/scaffold-root-rails.md`);
// it is settled against `icm-check.sh`, which is the estate's own definition
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
//     `opencode.jsonc` is seeded regardless, because that gate exists to spare
//     *un-migrated* repos a shape they haven't been moved to yet, and a repo
//     born today has no legacy Layer 0 to move: it is new-shape by
//     construction, and the rails are worth having from minute one.

import { commitRepoFiles, type NewRepoFile } from "@/lib/github"

const API = "https://api.github.com"

/** The repo holding the canonical scaffold. */
const TEMPLATE_REPO = "k0d0minio/icm-board"
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
  /** Path prefixes, relative to `from`, whose files are committed executable
   * (mode 100755) instead of 100644. Mirrors `icm-check.sh --fix`, which
   * `chmod +x`es exactly `hooks/*` after copying them: a hook is invoked by
   * path from `settings.json`, so a 100644 copy is present and inert. */
  executablePrefixes?: readonly string[]
}

const SOURCES: readonly TemplateSource[] = [
  { from: "icm", to: ".icm/" },
  { from: "claude", to: ".claude/", executablePrefixes: ["hooks/"] },
  // `root/CLAUDE.md` is the one-line `@AGENTS.md` importer, and there is no
  // `AGENTS.md` in a repo this new for it to import.
  { from: "root", to: "", skip: ["CLAUDE.md"] },
]

/** The template is four files deep at most; the cap is only there so a
 * misconfigured path can't walk a whole repository. */
const MAX_DEPTH = 4

// ---------------------------------------------------------------------------
// Reading the template.

/** One template file, already addressed as the path it will take in the new
 * repo — so `intake/README.md` under the `icm` source is `.icm/intake/README.md`
 * here, and `opencode.jsonc` under `root` is just `opencode.jsonc`. */
type TemplateFile = {
  path: string
  content: string
  /** From the source's `executablePrefixes` — the file's mode in the commit. */
  executable: boolean
}

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
      executable: (source.executablePrefixes ?? []).some((prefix) =>
        relativePath.startsWith(prefix)
      ),
    })
  }
  return files
}

// ---------------------------------------------------------------------------
// Seeding.

export type ScaffoldResult = {
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
 * Copy every folder in `SOURCES` into the new repo as a single commit via the
 * git tree API. Existing paths are never touched, so this is safe to run
 * against a repo that already has part of the baseline.
 *
 * A source that can't be *read* is reported but doesn't stop the others: a repo
 * with its `.icm/` and no `opencode.jsonc` is worth strictly more than a repo
 * with neither, and the error sentence names what's missing either way. The
 * *write* is all-or-nothing by construction — one commit, one ref move — so a
 * failed seed leaves the repo exactly as GitHub created it, which is the state
 * `icm-check.sh --fix` knows how to close.
 *
 * Never throws: the caller has already created the repo on GitHub and stored
 * the pointer, and a scaffold that fails must not cost the lead its link.
 */
export async function scaffoldIcmBaseline(
  fullName: string
): Promise<ScaffoldResult> {
  if (!process.env.GITHUB_TOKEN) {
    return {
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
    return { created: [], error: problems.join("; ") }
  }

  const payload: NewRepoFile[] = template.map((file) => ({
    path: file.path,
    content: file.content,
    executable: file.executable,
  }))
  const result = await commitRepoFiles(
    fullName,
    payload,
    "Seed the estate baseline"
  )
  if (result.outcome === "failed") {
    problems.push(result.error)
    return { created: [], error: problems.join("; ") }
  }

  return {
    created: result.created,
    error: problems.length === 0 ? null : problems.join("; "),
  }
}
