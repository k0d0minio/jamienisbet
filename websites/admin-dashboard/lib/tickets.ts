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
// right trade against hammering the API on every phone refresh. Every fetch is
// also tagged, so the board's explicit refresh control can bust the whole
// minute in one `revalidateTag` when "current right now" is the point.
//
// The board reads batch-first: `listBoard()` folds the tickets into repo
// sections of batches (each epic folder, plus a Triage pseudo-batch for the
// one-offs and a Backlog pseudo-batch for unmigrated legacy tickets), and a
// "now" strip of today's picks, runs in flight, and blocked stubs.

import { listClientRepos } from "@jamie-nisbet/services"

import { listAccessibleRepos } from "@/lib/github"

const API = "https://api.github.com"
const REVALIDATE_SECONDS = 60

/** Cache tag on every GitHub read, so the refresh action can bust them all. */
export const BOARD_CACHE_TAG = "tickets"

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
  /** Which batch line the ticket files under: the epic folder's name,
   * "triage" for one-offs, "backlog" for legacy flat tickets. Null for runs —
   * they surface on the now-strip, not inside a batch. */
  batch: string | null
  /** Position in the batch, from the stub's `sequence: N of M` line. */
  sequence: number | null
  /** The M of `N of M` — what the breakdown planned, driving batch progress. */
  sequenceTotal: number | null
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

/** Deep link into a fresh Claude Code session on the web: prompt pre-filled,
 * repo pre-selected. Nothing runs until the human sends it — every launcher on
 * the board goes through here, which is what keeps the board read-only. */
function claudePromptUrl(repoFullName: string, prompt: string): string {
  const params = new URLSearchParams({
    prompt,
    repositories: repoFullName,
  })
  return `https://claude.ai/code?${params.toString()}`
}

/**
 * One tap on a ticket goes from "this is the pick" to a session already
 * holding its prompt.
 */
export function claudeSessionUrl(ticket: Ticket): string | null {
  if (!ticket.prompt) return null
  return claudePromptUrl(ticket.repo.fullName, ticket.prompt)
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
    next: { revalidate: REVALIDATE_SECONDS, tags: [BOARD_CACHE_TAG] },
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
  sequenceTotal: number | null
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
    sequenceTotal: seqMatch ? Number(seqMatch[2]) : null,
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
    batch: "backlog",
    sequence: null,
    sequenceTotal: null,
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
        batch: s.epic,
        sequence: s.sequence,
        sequenceTotal: s.sequenceTotal,
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
        batch: null,
        sequence: null,
        sequenceTotal: null,
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

// ---------------------------------------------------------------------------
// Batch assembly — the board's shape. A batch is one line item: an epic folder
// with its stubs in sequence, or one of the two pseudo-batches every repo can
// carry ("triage" one-offs, "backlog" legacy tickets).

export type BatchKind = "epic" | "triage" | "backlog"

export type Batch = {
  /** The epic folder's name, or the pseudo-batch's ("triage"/"backlog"). */
  slug: string
  kind: BatchKind
  /** Humanized slug — the line item's label. */
  title: string
  /** The folder on GitHub — the batch's "open the real thing" escape hatch. */
  htmlUrl: string
  /** What the breakdown planned (max `N of M`); null when unsequenced —
   * always covers the open count, so `planned - tickets.length` is done. */
  planned: number | null
  /** Stubs already through: planned minus still open. 0 when unsequenced. */
  done: number
  /** Open tickets, batch order: sequence for epics, priority for the rest. */
  tickets: Ticket[]
  /** The stub a swipe-right starts: the epic's "next", else the top of the
   * pile. Null only for an empty batch, which the board never renders. */
  next: Ticket | null
  todayCount: number
  blockedCount: number
  p0Count: number
}

export type RepoSection = {
  repo: TicketRepo
  /** Epics by name, then triage, then backlog — stable positions. */
  batches: Batch[]
  /** Open tickets across the section's batches (runs live on the strip). */
  open: number
}

function humanize(slug: string): string {
  const words = slug.replace(/[-_]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function batchKind(slug: string): BatchKind {
  if (slug === "triage") return "triage"
  if (slug === "backlog") return "backlog"
  return "epic"
}

function batchTitle(kind: BatchKind, slug: string): string {
  if (kind === "triage") return "Triage"
  if (kind === "backlog") return "Backlog"
  return humanize(slug)
}

function batchFolderUrl(repo: TicketRepo, kind: BatchKind, slug: string): string {
  // The legacy backlog has no folder of its own — its flat files sit directly
  // in intake/, so the batch points there.
  const folder = kind === "backlog" ? ".icm/intake" : `.icm/intake/${slug}`
  return `https://github.com/${repo.fullName}/tree/HEAD/${folder}`
}

/** Batch-internal order: epics read in sequence (unsequenced stubs sink),
 * triage and backlog read by priority — they're piles, not pipelines. */
function batchOrder(kind: BatchKind) {
  return (a: Ticket, b: Ticket): number =>
    kind === "epic"
      ? (a.sequence ?? Number.MAX_SAFE_INTEGER) -
          (b.sequence ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id)
      : rank(a) - rank(b) || a.id.localeCompare(b.id)
}

function assembleBatches(repo: TicketRepo, tickets: Ticket[]): Batch[] {
  const byBatch = new Map<string, Ticket[]>()
  for (const t of tickets) {
    if (t.batch === null) continue
    const list = byBatch.get(t.batch) ?? []
    list.push(t)
    byBatch.set(t.batch, list)
  }

  const batches: Batch[] = []
  for (const [slug, members] of byBatch) {
    const kind = batchKind(slug)
    const ordered = [...members].sort(batchOrder(kind))
    // What the breakdown planned, if the stubs are sequenced. A batch that
    // grew past its own plan (recut mid-flight) still reads sanely: planned
    // never shows less than what's open.
    const totals = ordered
      .map((t) => t.sequenceTotal)
      .filter((n): n is number => n !== null)
    const planned =
      kind === "epic" && totals.length > 0
        ? Math.max(...totals, ordered.length)
        : null
    batches.push({
      slug,
      kind,
      title: batchTitle(kind, slug),
      htmlUrl: batchFolderUrl(repo, kind, slug),
      planned,
      done: planned === null ? 0 : planned - ordered.length,
      tickets: ordered,
      next: ordered.find((t) => t.group === "next") ?? ordered[0] ?? null,
      todayCount: ordered.filter((t) => t.group === "today").length,
      blockedCount: ordered.filter((t) => t.group === "blocked").length,
      p0Count: ordered.filter((t) => t.priority === "P0").length,
    })
  }

  const kindOrder: Record<BatchKind, number> = { epic: 0, triage: 1, backlog: 2 }
  return batches.sort(
    (a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.slug.localeCompare(b.slug)
  )
}

/** The pinned strip: what's happening across the estate right now — today's
 * picks first, then runs in flight, then what's stuck. */
function assembleStrip(tickets: Ticket[]): Ticket[] {
  const of = (group: TicketGroup) => tickets.filter((t) => t.group === group)
  return [...of("today"), ...of("in-flight"), ...of("blocked")]
}

/**
 * Section order is urgency: repos holding a today-pick first, then repos with
 * something blocked, then repos with a run in flight, then the rest by name —
 * the daily glance starts where the action is.
 */
function sectionUrgency(section: RepoSection, hasRun: boolean): number {
  if (section.batches.some((b) => b.todayCount > 0)) return 0
  if (section.batches.some((b) => b.blockedCount > 0)) return 1
  if (hasRun) return 2
  return 3
}

/**
 * The whole board in one read: every open ticket across the estate, folded
 * into repo sections of batches plus the now-strip. Returns
 * `configured: false` when GITHUB_TOKEN is unset; a database failure is its
 * own banner (`dbError`), not an empty board that lies about there being no
 * work.
 */
export async function listBoard(): Promise<{
  configured: boolean
  repos: TicketRepo[]
  /** Every open item (batch tickets and runs) — the chip counts' source. */
  tickets: Ticket[]
  sections: RepoSection[]
  strip: Ticket[]
  errors: TicketFetchError[]
  dbError: string | null
}> {
  const empty = { repos: [], tickets: [], sections: [], strip: [], errors: [] }
  if (!isConfigured()) {
    return { configured: false, ...empty, dbError: null }
  }

  let repos: TicketRepo[] = []
  try {
    repos = await loadRepos()
  } catch (err) {
    return {
      configured: true,
      ...empty,
      dbError:
        err instanceof Error ? err.message : "Could not reach the database.",
    }
  }

  const [results, todayKeys] = await Promise.all([
    Promise.all(repos.map(fetchRepoTickets)),
    fetchTodayKeys(),
  ])

  // Stable base order (priority, repo, id) so nothing reshuffles between
  // refreshes; the batches re-sort their own members afterwards.
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

  const sections = repos
    .map((repo) => {
      const own = tickets.filter((t) => t.repo.fullName === repo.fullName)
      const batches = assembleBatches(repo, own)
      return {
        section: {
          repo,
          batches,
          open: batches.reduce((n, b) => n + b.tickets.length, 0),
        },
        hasRun: own.some((t) => t.kind === "run"),
      }
    })
    .filter(({ section }) => section.batches.length > 0)
    .sort(
      (a, b) =>
        sectionUrgency(a.section, a.hasRun) - sectionUrgency(b.section, b.hasRun) ||
        a.section.repo.slug.localeCompare(b.section.repo.slug)
    )
    .map(({ section }) => section)

  const errors = results
    .map((r) => r.error)
    .filter((e): e is TicketFetchError => e !== null)
  return {
    configured: true,
    repos,
    tickets,
    sections,
    strip: assembleStrip(tickets),
    errors,
    dbError: null,
  }
}

// ---------------------------------------------------------------------------
// Maintenance launchers — the board's "button tied to a script" surface, kept
// inside the read-only contract: each one is a Claude Code session link with
// the maintenance prompt pre-filled, and a human sends it. Prompts follow the
// intake README's rules and stand alone in a fresh session at the repo root.

export type MaintenanceLauncher = {
  key: string
  title: string
  /** One line under the title saying what the session will actually do. */
  hint: string
  url: string
}

export function repoMaintenanceLaunchers(repo: TicketRepo): MaintenanceLauncher[] {
  return [
    {
      key: "triage",
      title: "Triage the backlog",
      hint: "Batch related one-offs into epics, tighten what stays",
      url: claudePromptUrl(
        repo.fullName,
        "Read .icm/intake/README.md for this repo's ticket contract, then triage .icm/intake/triage/: where a real batch has formed, group the related one-off stubs into a sequenced epic folder (a breakdown.md beside sequenced stubs); tighten titles and priorities on what stays; move anything already done to the matching _done/ folder. Ticket-only changes commit straight to main."
      ),
    },
    {
      key: "sweep",
      title: "Sweep finished work",
      hint: "Move done stubs and merged runs to _done/",
      url: claudePromptUrl(
        repo.fullName,
        "Read .icm/intake/README.md for this repo's ticket contract, then sweep for finished work: check the open stubs in .icm/intake/ and the run folders in .icm/runs/ against what has actually merged, and git mv anything finished into the matching _done/ folder. Verify against the code and PR history before moving anything — when unsure, leave it open. Ticket-only changes commit straight to main."
      ),
    },
  ]
}

/** Lives on an epic's sheet: re-ground the batch in the current state of the
 * code — refresh, resequence, split, or retire its remaining stubs. */
export function recutSessionUrl(repo: TicketRepo, batchSlug: string): string {
  return claudePromptUrl(
    repo.fullName,
    `Read .icm/intake/${batchSlug}/breakdown.md and every stub beside it, compare them against the current state of the code, and recut the batch: refresh stale stubs, resequence what remains, split anything too big, and move anything already done to _done/. Keep the breakdown honest — it should describe the work as it stands today. Ticket-only changes commit straight to main.`
  )
}

/** One board-level button: the estate consistency pass, run where it lives. */
export function estateCheckSessionUrl(): string {
  return claudePromptUrl(
    TODAY_REPO,
    "Run the /icm-check pass across the estate and report what has drifted — intake shape, runs hygiene, today.md pointing at real stubs. Propose fixes as tickets in the offending repos rather than fixing anything silently."
  )
}
