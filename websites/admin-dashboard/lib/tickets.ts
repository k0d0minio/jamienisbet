import "server-only"

// The tickets board's read-only line to GitHub. Every active repo keeps its
// work backlog as markdown in `.icm/intake/` — the estate-wide standard
// (canonical spec: `_system/contracts/TICKETS.md` in the icm-board repo, re-founded
// 2026-08-28 on the sustentus intake model) — and this module pulls it into one
// list. The dashboard only *reads*: tickets are created, edited, and finished
// (moved to `_done/`) inside each repo by the session doing the work, never
// from here. Repos stay the source of truth and nothing is mirrored into the
// database.
//
// Two shapes parse side by side, because migration is per-repo and gradual:
//
//   • NEW (the standard): stubs grouped in epics — `intake/<epic>/<slug>.md`
//     beside a `breakdown.md`, sequenced and dependency-ordered — plus one-off
//     `intake/triage/<slug>.md` stubs. Status is positional: a `- blocked:`
//     line, the epic's lowest open sequence ("next"), a run folder in
//     `.icm/runs/` ("in flight"), an entry in icm-board's `.icm/today.md`
//     ("today"). Metadata is `- key: value` dash-lines, not a table.
//   • LEGACY: flat `PREFIX-NNN-slug.md` files with an H1 `# <ID> · <title>`,
//     a two-column metadata table and a Status row.
//
// Fetching is one git-tree call per repo (recursive, so epic folders and
// `runs/` come back in the same response), then one raw read per open ticket
// file. `_done/` is never fetched.
//
// Reuses the delivery-repo `GITHUB_TOKEN`; a fine-grained token needs Contents
// read on the connected repos. Every fetch carries a 60-second revalidate —
// the board is a glanceable list where "up to a minute behind main" is the
// right trade against hammering the API on every phone refresh.

import { listClientRepos } from "@jamie-nisbet/services"

import { listAccessibleRepos } from "@/lib/github"

const API = "https://api.github.com"
const REVALIDATE_SECONDS = 60

// The board shows every repo the token can see (the estate lives under one
// owner), with client attribution joined in from the database rows that
// connect a repo to a lead. The house repos are pinned so they exist even if
// the accessible-repos call fails. Sustentus lives under its own org — outside
// `affiliation=owner` — and is added explicitly: its `.icm/` is exempt from the
// estate *tooling*, but its stubs are the very shape this parser speaks, and
// seeing the whole estate on one board is the point (icm-board decision D13).
const HOUSE_REPOS = ["k0d0minio/jamienisbet", "k0d0minio/icm-board"] as const
const EXTRA_REPOS = ["sustentus/sustentus"] as const

// icm-board is where `/day` writes the one home of the today flag.
const TODAY_REPO = "k0d0minio/icm-board"
const TODAY_PATH = ".icm/today.md"

export type TicketRepo = {
  /** "owner/name". */
  fullName: string
  /** The repo's own name — the filter-chip label and URL param. */
  slug: string
  /** The client the repo is connected to, for linking board → lead.
   * Null for house/unattributed repos. */
  clientId: string | null
  clientName: string | null
}

// Board order is workflow order: the day's picks, then what's moving, then
// what's stuck, then each epic's next stub (and the triage pool), then the
// rest of every epic's queue.
export const TICKET_GROUPS = [
  "today",
  "in-flight",
  "blocked",
  "next",
  "queued",
] as const

export type TicketGroup = (typeof TICKET_GROUPS)[number]

export type Ticket = {
  repo: TicketRepo
  /** Path within the repo, e.g. ".icm/intake/business-state/neon-at-the-gate.md" */
  path: string
  /** GitHub blob URL — "open the real file" escape hatch. */
  htmlUrl: string
  /** Path identity for stubs ("epic/slug", "triage/slug"), legacy ID otherwise. */
  id: string
  title: string
  group: TicketGroup
  /** "stub" (new shape) | "legacy" (flat PREFIX-NNN) | "run" (.icm/runs/ in flight) */
  kind: "stub" | "legacy" | "run"
  /** "P0" | "P1" | "P2"; null when absent (sustentus stubs carry none). */
  priority: string | null
  /** Remaining metadata (dash-lines or table rows), display order. */
  meta: [string, string][]
  /** The pasteable `## Prompt` body — synthesized from the path for stubs
   * that don't carry one, so the one-tap pick-up works estate-wide. */
  prompt: string | null
  /** The ticket markdown minus its header block, rendered on the board. */
  body: string
}

export type TicketFetchError = { repo: TicketRepo; message: string }

// ---------------------------------------------------------------------------
// Claude deep links. Two shapes, kept side by side on purpose: both are
// documented by Anthropic, and the comment on each names the doc it comes
// from so the next reader can tell a documented URL from a guess. (The board
// used to point at `claude.ai/code?prompt=…&repositories=…`, which is neither
// documented nor versioned — the request to document it was closed *not
// planned* — so it could change under us without notice.)
//
// Both carry the same prompt and stop at the same ceiling.

/**
 * The ceiling on an encoded prompt. A ticket's `## Prompt` section is
 * unbounded, and the terminal scheme documents a 5,000-character maximum on
 * `q` (the web link documents none, so it inherits this one — one cap, one
 * fallback). Past it both builders return null and the row falls back to
 * **Copy prompt**, which is right there and has no limit — better than
 * emitting a URL that truncates without saying so.
 *
 * Measured on the *encoded* value, which is the conservative reading: the doc
 * more likely means the decoded text (its own "prompts over 1,000 characters"
 * warning counts what the user sees), so a budget spent here is never a
 * budget overspent there.
 *
 * 4,500 leaves ~10% margin under the documented limit. It is not arbitrary:
 * house prose is dense with em-dashes and backticks and encodes at roughly
 * 1.5x, so this is about 3,000 characters of an actual ticket — clear of the
 * longest prompt in this repo (3,826 encoded) with room to spare, where 4,000
 * would have cleared it by 4%. Raising it past 5,000 is the one thing that
 * needs Anthropic to say so first.
 */
const PROMPT_MAX_ENCODED_CHARS = 4500

/** The prompt, URL-encoded — null when absent or past the ceiling. */
function encodedPrompt(ticket: Ticket): string | null {
  if (!ticket.prompt) return null
  // `encodeURIComponent`, not `URLSearchParams`: the latter encodes spaces as
  // `+`, and both docs' examples use `%20`.
  const encoded = encodeURIComponent(ticket.prompt)
  return encoded.length > PROMPT_MAX_ENCODED_CHARS ? null : encoded
}

/**
 * The web/mobile session link — Anthropic's documented universal link
 * (support.claude.com/en/articles/14898120). On a phone with the Claude app
 * installed the OS hands the tap straight to the app's new-session composer;
 * anywhere else the same URL opens that form in the browser. That fallback is
 * the whole reason to prefer it: the board is a phone-first screen.
 *
 * Params are `q` (prompt), `repo` (one `owner/name`), and optional `branch`
 * (requires `repo`) and `mode`. `mode=plan` because a stub is picked up by
 * planning first, not by editing. `repo` is encoded to `owner%2Fname`, as the
 * article's own example writes it.
 *
 * Null when the ticket has no prompt, or the prompt is past
 * `PROMPT_MAX_ENCODED_CHARS`.
 */
export function claudeSessionUrl(ticket: Ticket): string | null {
  const q = encodedPrompt(ticket)
  if (q === null) return null
  const repo = encodeURIComponent(ticket.repo.fullName)
  return `https://claude.ai/code/new?q=${q}&repo=${repo}&mode=plan`
}

/**
 * The terminal twin — the documented `claude-cli://` scheme
 * (code.claude.com/docs/en/deep-links). Opens a local Claude Code session in
 * whichever clone of the repo that machine last ran `claude` in, with the same
 * prompt already in the input box. The click never sends anything: the prompt
 * sits there, flagged as coming from an external link, until Enter is pressed
 * — which is why a plain `<a href>` is safe here.
 *
 * `repo` keeps its literal slash, as the doc's example writes it; only `q` is
 * documented as needing encoding.
 *
 * Null on the same terms as `claudeSessionUrl`.
 */
export function claudeTerminalUrl(ticket: Ticket): string | null {
  const q = encodedPrompt(ticket)
  if (q === null) return null
  return `claude-cli://open?repo=${ticket.repo.fullName}&q=${q}`
}

function isConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

async function gh(path: string, accept: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  })
}

// ---------------------------------------------------------------------------
// Parsing — shared pieces. Lenient everywhere: a malformed ticket still shows
// up (with whatever could be read) rather than silently vanishing.

/** The `## Prompt` (or the remi-ai alias `## Agent prompt`) body, up to the next `##`. */
function extractPrompt(lines: string[]): string | null {
  const start = lines.findIndex((l) => /^##\s+(agent\s+)?prompt\s*$/i.test(l))
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => /^##\s/.test(l))
  const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim()
  return section.length > 0 ? section : null
}

/**
 * The reading body: the ticket minus its H1 and its metadata header (table
 * rows or dash-lines) — both already on screen as the row's title strip and
 * meta list. Only the header block (up to the first `##`) is stripped, so
 * tables and lists inside the ticket's own sections survive.
 */
function readingBody(lines: string[]): string {
  const firstSection = lines.findIndex((l) => /^##\s/.test(l))
  const header = firstSection === -1 ? lines : lines.slice(0, firstSection)
  const rest = firstSection === -1 ? [] : lines.slice(firstSection)
  const keptHeader = header.filter(
    (l) =>
      !/^#\s/.test(l) &&
      !/^\s*\|.*\|\s*$/.test(l) &&
      !/^-\s+[a-z-]+:/i.test(l) &&
      !/^>\s*Recut/i.test(l)
  )
  return [...keptHeader, ...rest].join("\n").trim()
}

// --- NEW shape: a stub with dash-line metadata ------------------------------

type Stub = {
  path: string
  epic: string
  slug: string
  title: string
  priority: string | null
  sequence: number | null
  blocked: string | null
  dependsOn: string[]
  meta: [string, string][]
  prompt: string | null
  body: string
}

function dashFields(lines: string[]): Map<string, string> {
  const fields = new Map<string, string>()
  for (const line of lines) {
    if (/^##\s/.test(line)) break
    const m = line.match(/^-\s+([a-z][a-z-]*):\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    if (!fields.has(key)) fields.set(key, m[2].trim())
  }
  return fields
}

function parseStub(path: string, epic: string, markdown: string): Stub {
  const lines = markdown.split("\n")
  const slug = (path.split("/").pop() ?? path).replace(/\.md$/, "")
  const h1 = lines.find((l) => /^#\s/.test(l))
  const title =
    h1?.replace(/^#\s+/, "").replace(/^Stub:\s*/i, "").trim() || slug

  const fields = dashFields(lines)
  const priorityRaw = fields.get("priority") ?? null
  const priorityToken = priorityRaw?.match(/^p([0-2])\b/i)
  const seqMatch = fields.get("sequence")?.match(/^(\d+)\s+of\s+(\d+)/i)
  const dependsRaw = fields.get("depends-on") ?? ""
  const dependsOn = dependsRaw
    .replace(/`/g, "")
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d && d.toLowerCase() !== "none")

  // Everything informative that isn't identity goes to the meta list, in a
  // stable order — the row's detail view shows it as key/value pairs.
  const meta: [string, string][] = []
  const push = (label: string, key: string) => {
    const v = fields.get(key)
    if (v) meta.push([label, v])
  }
  push("Lane", "lane")
  push("Size", "size")
  if (seqMatch) meta.push(["Sequence", `${seqMatch[1]} of ${seqMatch[2]}`])
  if (dependsOn.length > 0) meta.push(["Depends on", dependsOn.join(", ")])
  push("Blocked", "blocked")
  push("Found by", "found-by")
  push("Sources", "sources")

  return {
    path,
    epic,
    slug,
    title,
    priority: priorityToken ? `P${priorityToken[1]}` : null,
    sequence: seqMatch ? Number(seqMatch[1]) : null,
    blocked: fields.get("blocked") ?? null,
    dependsOn,
    meta,
    prompt: extractPrompt(lines),
    body: readingBody(lines),
  }
}

/** A pick-up prompt for stubs that don't carry one (sustentus's, mostly), so
 * the one-tap session link works estate-wide. */
function synthesizedPrompt(repo: TicketRepo, path: string): string {
  return [
    `Read ${path} in ${repo.fullName} for full context, then do the work it describes.`,
    "Follow that repo's own conventions and pipeline contracts (its CLAUDE.md and .icm/ own the rules).",
  ].join(" ")
}

// --- LEGACY shape: flat PREFIX-NNN ticket with a metadata table -------------

const LEGACY_STATUS_TO_GROUP: Record<string, TicketGroup> = {
  today: "today",
  "in-progress": "in-flight",
  "in progress": "in-flight",
  blocked: "blocked",
  ready: "next",
}

function parseLegacy(
  repo: TicketRepo,
  path: string,
  htmlUrl: string,
  markdown: string
): Ticket {
  const lines = markdown.split("\n")
  const filename = path.split("/").pop() ?? path
  const fallbackId = filename.replace(/\.md$/, "")

  let id = fallbackId
  let title = fallbackId
  const h1 = lines.find((l) => /^#\s/.test(l))
  if (h1) {
    const parts = h1.replace(/^#\s+/, "").split("·")
    if (parts.length >= 2) {
      id = parts[0].trim()
      title = parts.slice(1).join("·").trim()
    } else {
      id = title = h1.replace(/^#\s+/, "").trim()
    }
  }

  let group: TicketGroup = "next"
  let priority: string | null = null
  const meta: [string, string][] = []
  for (const line of lines) {
    const row = line.match(/^\|([^|]*)\|([^|]*)\|\s*$/)
    if (!row) continue
    // Bold metadata is valid markdown (`| **Status** |`, remi-ai style).
    const key = row[1].replace(/\*/g, "").trim()
    const value = row[2].trim()
    if (!key || !value || /^[-:\s]+$/.test(key)) continue
    const keyLower = key.toLowerCase()
    const plainValue = value.replace(/\*/g, "").trim()
    if (keyLower === "status") {
      group = LEGACY_STATUS_TO_GROUP[plainValue.toLowerCase()] ?? "next"
    } else if (keyLower === "priority") {
      // Verbose priorities (`P0 — live exposure, close today`) still rank.
      const token = plainValue.match(/^p([0-2])\b/i)
      priority = token ? `P${token[1]}` : plainValue.toUpperCase()
    } else {
      meta.push([key, value])
    }
  }

  return {
    repo,
    path,
    htmlUrl,
    id,
    title,
    group,
    kind: "legacy",
    priority,
    meta,
    prompt: extractPrompt(lines),
    body: readingBody(lines),
  }
}

// ---------------------------------------------------------------------------
// Fetching. One recursive git-tree call per repo, then one raw read per open
// ticket file. Best-effort per repo: one unreachable repo becomes a banner on
// the board, not an empty page.

type TreeEntry = { path: string; type: string }

function blobUrl(repo: TicketRepo, path: string): string {
  return `https://github.com/${repo.fullName}/blob/HEAD/${path}`
}

async function fetchRaw(repo: TicketRepo, path: string): Promise<string | null> {
  const res = await gh(
    `/repos/${repo.fullName}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    "application/vnd.github.raw+json"
  )
  if (!res.ok) return null
  return res.text()
}

async function fetchRepoTickets(
  repo: TicketRepo
): Promise<{ tickets: Ticket[]; error: TicketFetchError | null }> {
  try {
    const res = await gh(
      `/repos/${repo.fullName}/git/trees/HEAD?recursive=1`,
      "application/vnd.github+json"
    )
    // 404: no access or no commits — either way, nothing to show, not an error
    // (a repo is onboard the moment its first ticket lands). 409: empty repo.
    if (res.status === 404 || res.status === 409)
      return { tickets: [], error: null }
    if (!res.ok) {
      return {
        tickets: [],
        error: { repo, message: `GitHub returned HTTP ${res.status}` },
      }
    }
    const { tree } = (await res.json()) as { tree: TreeEntry[] }

    const stubPaths: { path: string; epic: string }[] = []
    const legacyPaths: string[] = []
    const runSlugs = new Set<string>()

    for (const entry of tree) {
      if (entry.type !== "blob") {
        // In-flight runs: any directory directly under .icm/runs/ except the
        // _done archive. Sustentus archives merged runs elsewhere (its own
        // CI), so its runs/ holds history, not flight — skip it; its intake
        // stubs still show.
        const run = entry.path.match(/^\.icm\/runs\/([^/]+)$/)
        if (run && run[1] !== "_done" && repo.slug !== "sustentus")
          runSlugs.add(run[1])
        continue
      }
      const m = entry.path.match(/^\.icm\/intake\/(.+)$/)
      if (!m) continue
      const rel = m[1]
      if (rel.includes("/_done/") || !rel.endsWith(".md")) continue
      const segments = rel.split("/")
      if (segments.length === 1) {
        const nameLower = segments[0].toLowerCase()
        if (nameLower === "readme.md" || nameLower === "context.md") continue
        legacyPaths.push(entry.path)
      } else if (segments.length === 2) {
        if (segments[1].toLowerCase() === "breakdown.md") continue
        stubPaths.push({ path: entry.path, epic: segments[0] })
      }
    }

    const [stubResults, legacyResults] = await Promise.all([
      Promise.all(
        stubPaths.map(async ({ path, epic }) => {
          const raw = await fetchRaw(repo, path)
          return raw === null ? null : parseStub(path, epic, raw)
        })
      ),
      Promise.all(
        legacyPaths.map(async (path) => {
          const raw = await fetchRaw(repo, path)
          return raw === null
            ? null
            : parseLegacy(repo, path, blobUrl(repo, path), raw)
        })
      ),
    ])

    const stubs = stubResults.filter((s): s is Stub => s !== null)

    // Positional grouping, per epic: the lowest-sequence unblocked stub is
    // "next"; a stub whose in-epic dependency is still open is waiting (shown
    // in Blocked); everything else queues. Triage stubs are all "next" — a
    // backlog, not a batch.
    const openByEpic = new Map<string, Set<string>>()
    for (const s of stubs) {
      if (!openByEpic.has(s.epic)) openByEpic.set(s.epic, new Set())
      openByEpic.get(s.epic)!.add(s.slug)
    }
    const nextOf = new Map<string, string>()
    for (const s of stubs) {
      if (s.epic === "triage" || s.blocked !== null) continue
      const current = nextOf.get(s.epic)
      const currentSeq = current
        ? (stubs.find((x) => x.epic === s.epic && x.slug === current)
            ?.sequence ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER
      if ((s.sequence ?? Number.MAX_SAFE_INTEGER - 1) < currentSeq)
        nextOf.set(s.epic, s.slug)
    }

    const tickets: Ticket[] = stubs.map((s) => {
      const openDep = s.dependsOn.find((d) => openByEpic.get(s.epic)?.has(d))
      let group: TicketGroup
      if (s.blocked !== null) group = "blocked"
      else if (s.epic === "triage") group = "next"
      else if (nextOf.get(s.epic) === s.slug) group = "next"
      else if (openDep) group = "blocked"
      else group = "queued"
      const meta: [string, string][] =
        openDep && s.blocked === null
          ? [...s.meta, ["Waiting on", openDep]]
          : s.meta
      return {
        repo,
        path: s.path,
        htmlUrl: blobUrl(repo, s.path),
        id: `${s.epic}/${s.slug}`,
        title: s.title,
        group,
        kind: "stub",
        priority: s.priority,
        meta,
        prompt: s.prompt ?? synthesizedPrompt(repo, s.path),
        body: s.body,
      }
    })

    for (const slug of [...runSlugs].sort()) {
      tickets.push({
        repo,
        path: `.icm/runs/${slug}`,
        htmlUrl: `https://github.com/${repo.fullName}/tree/HEAD/.icm/runs/${slug}`,
        id: `runs/${slug}`,
        title: slug,
        group: "in-flight",
        kind: "run",
        priority: null,
        meta: [["Run", `.icm/runs/${slug}`]],
        prompt: null,
        body: "",
      })
    }

    tickets.push(...legacyResults.filter((t): t is Ticket => t !== null))
    return { tickets, error: null }
  } catch (err) {
    return {
      tickets: [],
      error: {
        repo,
        message: err instanceof Error ? err.message : "network error",
      },
    }
  }
}

// --- today.md — the one home of the today flag ------------------------------

/** "<repo-slug> <path-id>" keys from icm-board's .icm/today.md, e.g.
 * "jamienisbet estate-board/tree-fetch" or legacy "icm-board ICM-001". */
async function fetchTodayKeys(): Promise<Set<string>> {
  const keys = new Set<string>()
  try {
    const res = await gh(
      `/repos/${TODAY_REPO}/contents/${TODAY_PATH}`,
      "application/vnd.github.raw+json"
    )
    if (!res.ok) return keys
    for (const line of (await res.text()).split("\n")) {
      const m = line.match(/^-\s+([^·]+)·\s*(\S+)/)
      if (!m) continue
      keys.add(`${m[1].trim()} ${m[2].trim()}`)
    }
  } catch {
    // No today.md (or unreachable) just means no picks — never an error.
  }
  return keys
}

// ---------------------------------------------------------------------------

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

function rank(t: Ticket): number {
  return t.priority !== null && t.priority in PRIORITY_RANK
    ? PRIORITY_RANK[t.priority]
    : 3
}

/**
 * The board's repo roster: every repo the token owns (most-recently-pushed
 * first from GitHub, re-sorted by name), joined with the client rows for
 * attribution, plus the pinned house repos and sustentus. Deduped by full
 * name — first source wins; client attribution is applied wherever a client
 * row points at a repo.
 */
async function loadRepos(): Promise<TicketRepo[]> {
  const rows = await listClientRepos()
  const attribution = new Map<string, { clientId: string; clientName: string }>()
  for (const row of rows) {
    if (!attribution.has(row.githubRepo))
      attribution.set(row.githubRepo, {
        clientId: row.clientId,
        clientName: row.clientName,
      })
  }

  const accessible = await listAccessibleRepos()
  const ordered: string[] = [
    ...HOUSE_REPOS,
    ...rows.map((r) => r.githubRepo),
    ...accessible.map((r) => r.fullName),
    ...EXTRA_REPOS,
  ]

  const seen = new Set<string>()
  const repos: TicketRepo[] = []
  for (const fullName of ordered) {
    if (seen.has(fullName)) continue
    seen.add(fullName)
    const client = attribution.get(fullName)
    repos.push({
      fullName,
      slug: fullName.split("/").pop() ?? fullName,
      clientId: client?.clientId ?? null,
      clientName: client?.clientName ?? null,
    })
  }
  return repos
}

/**
 * Every open ticket across the estate, sorted board-ready: the page groups by
 * `group`, so the sort here is priority first, then repo, then path — stable
 * enough that the list doesn't reshuffle between refreshes. Returns
 * `configured: false` when GITHUB_TOKEN is unset; a database failure is its
 * own banner (`dbError`), not an empty board that lies about there being no
 * work.
 */
export async function listTickets(): Promise<{
  configured: boolean
  repos: TicketRepo[]
  tickets: Ticket[]
  errors: TicketFetchError[]
  dbError: string | null
}> {
  if (!isConfigured()) {
    return { configured: false, repos: [], tickets: [], errors: [], dbError: null }
  }

  let repos: TicketRepo[] = []
  try {
    repos = await loadRepos()
  } catch (err) {
    return {
      configured: true,
      repos: [],
      tickets: [],
      errors: [],
      dbError:
        err instanceof Error ? err.message : "Could not reach the database.",
    }
  }

  const [results, todayKeys] = await Promise.all([
    Promise.all(repos.map(fetchRepoTickets)),
    fetchTodayKeys(),
  ])

  const tickets = results
    .flatMap((r) => r.tickets)
    .map((t) =>
      todayKeys.has(`${t.repo.slug} ${t.id}`) ? { ...t, group: "today" as const } : t
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        a.repo.slug.localeCompare(b.repo.slug) ||
        a.id.localeCompare(b.id)
    )
  const errors = results
    .map((r) => r.error)
    .filter((e): e is TicketFetchError => e !== null)
  return { configured: true, repos, tickets, errors, dbError: null }
}
