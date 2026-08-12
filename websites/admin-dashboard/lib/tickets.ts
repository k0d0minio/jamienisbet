import "server-only"

// The tickets board's read-only line to GitHub. Every active repo keeps its
// work backlog as markdown files in `.icm/intake/` — the estate-wide standard
// (canonical spec: `_system/TICKETS-SPEC.md` in the Apps estate) — and this
// module pulls them into one list. The dashboard only *reads*: tickets are
// created, edited, and finished (moved to `_done/`) inside each repo by the
// session doing the work, never from here. Repos stay the source of truth and
// nothing is mirrored into the database.
//
// Reuses the delivery-repo `GITHUB_TOKEN`; a fine-grained token needs Contents
// read on the connected repos. Every fetch carries a 60-second revalidate — unlike
// the live delivery-repo calls in `lib/github.ts`, the board is a glanceable
// list where "up to a minute behind main" is the right trade against hammering
// the API on every phone refresh.

import { listClientRepos } from "@jamie-nisbet/services"

const API = "https://api.github.com"
const REVALIDATE_SECONDS = 60

// The repos whose backlogs the board shows come from the database — every
// delivery repo connected to an active client (`biz.clients.github_repo`) —
// plus the house repo itself (its `JN-*` series: estate and process work).
// Connecting a repo on a lead's profile *is* the onboarding step — the board
// tolerates `.icm/intake/` not existing yet (the repo just reads as empty
// until its first ticket lands).
//
// Same house-repo constant as `lib/onboarding.ts`.
const HOUSE_REPO = "k0d0minio/jamienisbet"

// Sustentus stays off the board even if a client row ever points at it: its
// `pipeline/intake/` is its own authoritative system and stays untouched.
// Matched on the repo-name segment so the exclusion holds under any owner.
const EXCLUDED_REPO_NAMES = new Set(["sustentus", "sustentus-v2"])

function isExcluded(fullName: string): boolean {
  const name = fullName.split("/").pop() ?? fullName
  return EXCLUDED_REPO_NAMES.has(name.toLowerCase())
}

export type TicketRepo = {
  /** "owner/name" as stored on the client row. */
  fullName: string
  /** The repo's own name — the filter-chip label and URL param. */
  slug: string
  /** The client the repo is connected to, for linking board → lead.
   * Null for the house repo — estate work belongs to no client. */
  clientId: string | null
  clientName: string | null
}

const INTAKE_PATH = ".icm/intake"

// The status ladder from the spec. Board order is workflow order: what was
// picked for today first, then what's moving, then what's stuck, then the pool.
export const TICKET_STATUSES = [
  "today",
  "in-progress",
  "blocked",
  "ready",
] as const

export type TicketStatus = (typeof TICKET_STATUSES)[number]

export type Ticket = {
  repo: TicketRepo
  /** Path within the repo, e.g. ".icm/intake/REMI-001-admin-docs-exposure.md" */
  path: string
  /** GitHub blob URL — "open the real file" escape hatch. */
  htmlUrl: string
  /** Ticket id from the H1 (falls back to the filename). */
  id: string
  title: string
  status: TicketStatus
  /** "P0" | "P1" | "P2" per the spec; null when the row is missing. */
  priority: string | null
  /** Remaining metadata-table rows (Type, Size, Depends on, …), display order. */
  meta: [string, string][]
  /** The pasteable body of `## Prompt` (or the remi-ai alias `## Agent prompt`). */
  prompt: string | null
  /**
   * The ticket markdown to read on the spot, rendered as markdown on the
   * board. The H1 and the metadata table are stripped — the row's summary and
   * the meta list already show them, and repeating them pushes the actual
   * ticket below the fold. "Open on GitHub" is the unedited file.
   */
  body: string
}

export type TicketFetchError = { repo: TicketRepo; message: string }

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
// Parsing. The spec keeps the format deliberately trivial: an H1
// `# <ID> · <title>`, a two-column metadata table, and `##` sections. Parsing
// is lenient everywhere — a malformed ticket still shows up (as `ready`, with
// whatever could be read) rather than silently vanishing from the board.

const STATUS_ALIASES: Record<string, TicketStatus> = {
  today: "today",
  "in-progress": "in-progress",
  "in progress": "in-progress",
  blocked: "blocked",
  ready: "ready",
}

function parseHeading(line: string): { id: string; title: string } | null {
  const h1 = line.match(/^#\s+(.+)$/)
  if (!h1) return null
  // "REMI-001 · Title" — the separator is the estate's middle dot.
  const parts = h1[1].split("·")
  if (parts.length >= 2) {
    return { id: parts[0].trim(), title: parts.slice(1).join("·").trim() }
  }
  return { id: h1[1].trim(), title: h1[1].trim() }
}

/** The `## Prompt` (or `## Agent prompt`) section body, up to the next `##`. */
function extractPrompt(lines: string[]): string | null {
  const start = lines.findIndex((l) => /^##\s+(agent\s+)?prompt\s*$/i.test(l))
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => /^##\s/.test(l))
  const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim()
  return section.length > 0 ? section : null
}

/**
 * The reading body: the ticket minus its H1 and its metadata table — both
 * already on screen as the row's title strip and meta list. Only the *header*
 * block is stripped (everything up to the first `##`), so a table inside a
 * section of the ticket itself survives and renders as a table.
 */
function readingBody(lines: string[]): string {
  const firstSection = lines.findIndex((l) => /^##\s/.test(l))
  const header = firstSection === -1 ? lines : lines.slice(0, firstSection)
  const rest = firstSection === -1 ? [] : lines.slice(firstSection)
  const keptHeader = header.filter(
    (l) => !/^#\s/.test(l) && !/^\s*\|.*\|\s*$/.test(l)
  )
  return [...keptHeader, ...rest].join("\n").trim()
}

export function parseTicket(
  repo: TicketRepo,
  path: string,
  htmlUrl: string,
  markdown: string
): Ticket {
  const lines = markdown.split("\n")

  const filename = path.split("/").pop() ?? path
  const fallbackId = filename.replace(/\.md$/, "")
  const heading =
    lines.map(parseHeading).find((h) => h !== null) ?? null

  // Two-column metadata table rows: `| Key | Value |`. Separator rows and the
  // headerless `| | |` opener parse to empty/dash cells and are skipped.
  let status: TicketStatus = "ready"
  let priority: string | null = null
  const meta: [string, string][] = []
  for (const line of lines) {
    const row = line.match(/^\|([^|]*)\|([^|]*)\|\s*$/)
    if (!row) continue
    // Bold metadata is valid markdown (`| **Status** |`, remi-ai style) —
    // strip emphasis before comparing keys or reading the value.
    const key = row[1].replace(/\*/g, "").trim()
    const value = row[2].trim()
    if (!key || !value || /^[-:\s]+$/.test(key)) continue
    const keyLower = key.toLowerCase()
    const plainValue = value.replace(/\*/g, "").trim()
    if (keyLower === "status") {
      status = STATUS_ALIASES[plainValue.toLowerCase()] ?? "ready"
    } else if (keyLower === "priority") {
      // Verbose priorities (`P0 — live exposure, close today`) still rank:
      // a leading P0–P2 token wins; anything else passes through verbatim.
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
    id: heading?.id ?? fallbackId,
    title: heading?.title ?? fallbackId,
    status,
    priority,
    meta,
    prompt: extractPrompt(lines),
    body: readingBody(lines),
  }
}

// ---------------------------------------------------------------------------
// Fetching. One directory listing per repo, then the raw content of each
// ticket file. Best-effort per repo: one unreachable repo becomes a banner on
// the board, not an empty page.

type ContentsEntry = {
  type: string
  name: string
  path: string
  html_url: string
}

async function fetchRepoTickets(
  repo: TicketRepo
): Promise<{ tickets: Ticket[]; error: TicketFetchError | null }> {
  try {
    const listing = await gh(
      `/repos/${repo.fullName}/contents/${INTAKE_PATH}`,
      "application/vnd.github+json"
    )
    // No `.icm/intake/` on main yet just means no tickets — a repo is onboard
    // the moment its first ticket lands, with no config change here.
    if (listing.status === 404) return { tickets: [], error: null }
    if (!listing.ok) {
      return {
        tickets: [],
        error: { repo, message: `GitHub returned HTTP ${listing.status}` },
      }
    }
    const entries = (await listing.json()) as ContentsEntry[]
    const files = entries.filter(
      (e) =>
        e.type === "file" &&
        e.name.endsWith(".md") &&
        e.name.toLowerCase() !== "readme.md"
    )
    const tickets = await Promise.all(
      files.map(async (file) => {
        const res = await gh(
          `/repos/${repo.fullName}/contents/${file.path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          "application/vnd.github.raw+json"
        )
        if (!res.ok) return null
        return parseTicket(repo, file.path, file.html_url, await res.text())
      })
    )
    return { tickets: tickets.filter((t) => t !== null), error: null }
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

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

function rank(t: Ticket): number {
  return t.priority !== null && t.priority in PRIORITY_RANK
    ? PRIORITY_RANK[t.priority]
    : 3
}

/**
 * The board's repo roster: the client rows plus the house repo. Deduped by
 * repo (two clients pointing at one repo would double every ticket) — first
 * client row wins the attribution. The house repo is always present and never
 * attributed to a client, even if a client row points at it.
 */
async function loadRepos(): Promise<TicketRepo[]> {
  const rows = await listClientRepos()
  const seen = new Set<string>()
  const repos: TicketRepo[] = []
  for (const row of rows) {
    if (
      isExcluded(row.githubRepo) ||
      row.githubRepo === HOUSE_REPO ||
      seen.has(row.githubRepo)
    )
      continue
    seen.add(row.githubRepo)
    repos.push({
      fullName: row.githubRepo,
      slug: row.githubRepo.split("/").pop() ?? row.githubRepo,
      clientId: row.clientId,
      clientName: row.clientName,
    })
  }
  repos.push({
    fullName: HOUSE_REPO,
    slug: HOUSE_REPO.split("/").pop() ?? HOUSE_REPO,
    clientId: null,
    clientName: null,
  })
  return repos
}

/**
 * Every open ticket across the estate, sorted board-ready: status is grouped
 * by the caller, so the sort here is priority first, then repo, then id —
 * stable enough that the list doesn't reshuffle between refreshes. Returns
 * `configured: false` (and nothing else) when GITHUB_TOKEN is unset, so the
 * page can show the same "not configured" notice the delivery-repo UI uses.
 * A database failure is its own banner (`dbError`), not an empty board that
 * lies about there being no work.
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

  const results = await Promise.all(repos.map(fetchRepoTickets))
  const tickets = results
    .flatMap((r) => r.tickets)
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
