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
// Fetching runs on three clocks, because a board read is not one request and
// its parts go stale at very different speeds:
//
//   • DISCOVERY (hourly) — which repos exist, and which of them carry an
//     `.icm/intake/` at all. The token owns ~35 repos and most never will, but
//     each one used to cost a tree call on every render just to find that out
//     again. The owner listing plus a one-request probe per repo answer it on
//     an hourly clock instead. The whole estate is still on the board
//     (icm-board decision D13) — the sweep is simply no longer something every
//     render pays for, and a repo that gains an intake joins within the hour,
//     or the moment the refresh control is used.
//   • POSITION (a minute) — one recursive git-tree call per repo that actually
//     has an intake; epic folders and `runs/` come back in the same response.
//     This is the read that notices a ticket landing or a run opening.
//   • CONTENT (a month) — ticket bodies read by blob SHA, not by path. A path
//     read answers "what is in that file now" and has to be re-asked every
//     minute, so a warm board re-read every open ticket in the estate. A git
//     blob SHA *is* its content, so `git/blobs/<sha>` can never go stale: the
//     minute-clock tree read is what notices a file changed, by handing back a
//     different SHA, and only the files that actually changed are re-read.
//
// `_done/` is never fetched.
//
// Reuses the delivery-repo `GITHUB_TOKEN`; a fine-grained token needs Contents
// read on the connected repos, and can't reach a repo another account owns at
// all — client-hosted repos need the classic token. Every fetch carries a revalidate — one of the
// three above — because the board is a glanceable list where "up to a minute
// behind main" is the right trade against hammering the API on every phone
// refresh. Every fetch is also tagged with the same tag whatever its
// lifetime, so the board's explicit refresh control busts all three in one
// `revalidateTag` when "current right now" is the point.
//
// That cache is easier to lose than it looks, and losing it is how this board
// once 403'd every repo at once — a hundred-plus GitHub calls per view, on two
// screens, until the token's rate limit was spent. It takes two things to
// hold. Each read has to opt in explicitly with `cache: "force-cache"`, because
// a revalidate alone doesn't cache a request carrying an Authorization header
// and every one of these does. And no route reading the board may export
// `dynamic = "force-dynamic"`, which sets `fetchCache: "force-no-store"` across
// its whole segment and overrides the lot. Two pages read the board; neither
// exports it, and both say why. Requests are also capped at
// `MAX_CONCURRENT_REQUESTS` in flight, so one cold read can't trip GitHub's
// concurrency limit on its own.
//
// When a read does fail, it says so. Nothing here answers a refused request
// with an empty list: a rate-limited roster call that returns "no repos" is
// indistinguishable from an estate with no work in it, and reading the first
// as the second is exactly how the outage presented itself.
//
// The board reads batch-first: `listBoard()` folds the tickets into repo
// sections of batches (each epic folder, plus a Triage pseudo-batch for the
// one-offs and a Backlog pseudo-batch for unmigrated legacy tickets), and a
// "now" strip of today's picks, runs in flight, and blocked stubs.

import { cache } from "react"

import { listClientRepos } from "@jamie-nisbet/services"

import { launch } from "@/lib/launchers"

const API = "https://api.github.com"

/** The board's own clock: how long "what moved" — a repo's tree — is trusted.
 * A glanceable list is allowed to be up to a minute behind main. */
const REVALIDATE_SECONDS = 60

/**
 * How long the *shape* of the estate is trusted: the owner listing, and
 * whether a given repo carries an `.icm/intake/` at all. Repos are created,
 * and gain their first intake, on a scale of weeks — re-asking every minute
 * bought nothing and cost a request per owned repo per render, which was the
 * bulk of a cold read. Both reads are still tagged, so the refresh control
 * takes a repo that just grew an intake straight onto the board.
 */
const DISCOVERY_REVALIDATE_SECONDS = 60 * 60

/**
 * How long a blob read is trusted. Reads are by SHA and a git blob SHA is its
 * content, so this is a cache-size budget rather than a freshness one: the
 * answer cannot go stale, and a ticket file that changes simply gets a new SHA
 * and so a different entry.
 */
const BLOB_REVALIDATE_SECONDS = 60 * 60 * 24 * 30

/**
 * How many GitHub requests this module will ever have in flight at once.
 *
 * One board read is not one request: it is a tree call per repo with an intake
 * and then a blob read per ticket file the trees say has changed — which on the
 * first read of a deploy is every open ticket in the estate, comfortably past a
 * hundred. Fired as one `Promise.all` that is exactly GitHub's documented
 * secondary rate limit ("no more than 100 concurrent requests"), and the whole
 * board comes back `403` — every repo at once, which is what a permissions
 * problem looks like and isn't one. Eight at a time costs a few hundred
 * milliseconds on a cold read and nothing on a warm one.
 */
const MAX_CONCURRENT_REQUESTS = 8

/** Cache tag on every GitHub read, so the refresh action can bust them all. */
export const BOARD_CACHE_TAG = "tickets"

// The pinned tier of the roster: read every render, never gated behind
// discovery. The house repos are here so the board stands even when the owner
// sweep fails, and every repo a client row points at is here because a
// connected repo is onboard the moment its first ticket lands — it must not
// have to wait out an hourly clock to appear. Sustentus lives under its own
// org — outside `affiliation=owner,collaborator`, so the sweep would never find
// it — and is added explicitly: its `.icm/` is exempt from the estate *tooling*, but its
// stubs are the very shape this parser speaks, and seeing the whole estate on
// one board is the point (icm-board decision D13).
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
  /** Carries the `/pipeline` router (`.claude/skills/pipeline/SKILL.md`), so
   * the board sends the pick-up verb rather than the prompt body (icm-board
   * decision D26). Probed once per repo on the discovery clock. */
  pipeline: boolean
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
  /**
   * What the board actually sends — the copy button, the session link, the
   * terminal link (icm-board decision D26). Where the repo carries the
   * `/pipeline` router it is the verb: `/pipeline new <epic>/<slug>` for an
   * epic stub, `/pipeline <lane> .icm/intake/triage/<slug>.md` for a triage
   * stub, `/pipeline build|release <slug>` for a run in flight by its stage.
   * Where it does not, it is the `## Prompt` body as before. Null when there
   * is nothing to send (a legacy ticket with no prompt, a lane run in flight).
   */
  pickup: string | null
  pickupKind: "verb" | "prompt" | null
  /** The ticket markdown minus its header block, rendered on the board. */
  body: string
}

export type TicketFetchError = { repo: TicketRepo; message: string }

// ---------------------------------------------------------------------------
// Session links. Every launcher on this board is built by the launcher
// registry (`lib/launchers/`) — one file per tool, each naming the doc its URL
// shape comes from. These wrappers keep the board's call sites unchanged;
// every one of them launches in `plan` mode: a stub or a maintenance pass is
// picked up by planning first, not by editing.

/** A ticket's session link on one target — null when the ticket has no
 * prompt, or the target cannot carry it (past its cap). A verb is a few dozen
 * characters and never hits the cap; a prompt body still can. */
function ticketLaunchUrl(targetId: string, ticket: Ticket): string | null {
  if (!ticket.pickup) return null
  return launch(targetId, {
    repoFullName: ticket.repo.fullName,
    prompt: ticket.pickup,
    mode: "plan",
  })
}

/**
 * One tap on a ticket goes from "this is the pick" to a session already
 * holding its prompt. Null when the ticket has no prompt, or the prompt is
 * past the target's cap.
 */
export function claudeSessionUrl(ticket: Ticket): string | null {
  return ticketLaunchUrl("claude-web", ticket)
}

/** The terminal twin of `claudeSessionUrl`, null on the same terms. */
export function claudeTerminalUrl(ticket: Ticket): string | null {
  return ticketLaunchUrl("claude-terminal", ticket)
}

/**
 * A session link for one of this file's own launcher prompts — triage, sweep,
 * recut, estate check. Those prompts are authored literals a few hundred
 * characters long, so unlike a ticket's they cannot outgrow a URL at runtime:
 * this returns a string, and its callers stay total. A null here means a
 * literal was edited past the cap, which is a bug to fix, not a state to render.
 */
function authoredPromptUrl(repoFullName: string, prompt: string): string {
  const url = launch("claude-web", { repoFullName, prompt, mode: "plan" })
  if (url === null) throw new Error("Authored launcher prompt is past the cap")
  return url
}

function isConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

// A queue of waiters, drained one permit at a time. Every request in this
// module goes through it, and nothing holds a permit while waiting for
// another — the tree call releases before its file reads start — so the fan-out
// can nest without deadlocking.
let inFlight = 0
const waiting: (() => void)[] = []

async function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT_REQUESTS) {
    inFlight += 1
    return
  }
  // The permit is handed over by `release`, which never lets `inFlight` drop
  // while anyone is queued — so a caller arriving in the gap can't take the
  // slot this waiter was just given.
  await new Promise<void>((resolve) => waiting.push(resolve))
}

function release(): void {
  const next = waiting.shift()
  if (next) next()
  else inFlight -= 1
}

async function gh(
  path: string,
  accept: string,
  revalidate: number = REVALIDATE_SECONDS
): Promise<Response> {
  await acquire()
  try {
    return await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // `force-cache` is load-bearing, not decoration. Caching is opt-in, and
      // a `revalidate` on its own does not opt a request in when it carries an
      // Authorization header — which every request here does: "Set
      // `cache: 'force-cache'` to cache any request, including POST and
      // requests that send `authorization` or `cookie` headers"
      // (nextjs.org/docs/app/api-reference/functions/fetch). Without it the
      // revalidate below is a lifetime on a cache entry that is never written,
      // and the board re-reads the whole estate on every render.
      //
      // Even with it, a route exporting `dynamic = "force-dynamic"` sets
      // `fetchCache: "force-no-store"` across its whole segment and overrides
      // this. The two pages that read the board say so where they used to
      // export it. Only 200s are stored, so a rate-limited read is never
      // cached and the board heals itself once the limit resets.
      cache: "force-cache",
      // Three clocks, one tag: whichever lifetime a read is on, the refresh
      // control still busts it.
      next: { revalidate, tags: [BOARD_CACHE_TAG] },
    })
  } finally {
    release()
  }
}

/**
 * What GitHub actually said, for a response the board couldn't use. A `403`
 * with the rate-limit headers set is not a permissions problem and shouldn't
 * read like one — it is the same token, a minute later, being told to wait.
 */
async function githubFailure(res: Response): Promise<string> {
  // Both limits come back as 403 or 429 (docs.github.com/rest/using-the-rest-api
  // /rate-limits-for-the-rest-api), so the status alone can't tell them from a
  // genuine forbidden. The headers and GitHub's own message can.
  if (res.status !== 403 && res.status !== 429) {
    return `GitHub returned HTTP ${res.status}`
  }

  const retryAfter = Number(res.headers.get("retry-after"))
  if (retryAfter > 0) {
    return `GitHub is rate-limiting these reads — it asked for ${retryAfter}s.`
  }

  const reset = Number(res.headers.get("x-ratelimit-reset"))
  if (res.headers.get("x-ratelimit-remaining") === "0" && reset > 0) {
    const mins = Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60_000))
    return `GitHub's rate limit is spent — it resets in about ${mins} min.`
  }

  const body = (await res.json().catch(() => null)) as {
    message?: string
  } | null
  if (body?.message && /rate limit/i.test(body.message)) {
    return `GitHub is rate-limiting these reads — ${body.message}`
  }
  return body?.message
    ? `GitHub returned HTTP ${res.status} — ${body.message}`
    : `GitHub returned HTTP ${res.status}`
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
  /** The `- lane:` line — a triage stub's consuming lane. */
  lane: string | null
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
    lane: fields.get("lane")?.toLowerCase() ?? null,
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

// The lane words a triage stub may carry — the template's own vocabulary
// (icm-board `lib/project.sh` → pipeline_lanes). A stub outside it gets the
// prompt body rather than a verb the router would refuse.
const LANES = new Set(["bug", "tweak", "chore", "hotfix", "handover"])

/**
 * What the board sends for one ticket (icm-board decision D26). The verb where
 * the repo carries the router; the `## Prompt` body where it does not, or
 * where a verb cannot be formed (a triage stub with no valid lane, a legacy
 * flat ticket). A lane run in flight is the operator's PR to merge and is
 * never resumed, so it sends nothing.
 */
function pickupFor(
  repo: TicketRepo,
  ticket: {
    kind: "stub" | "legacy" | "run"
    epic?: string | null
    slug: string
    lane?: string | null
    runStage?: "build" | "release" | "lane" | null
  },
  prompt: string | null
): { pickup: string | null; pickupKind: Ticket["pickupKind"] } {
  if (repo.pipeline) {
    if (ticket.kind === "stub" && ticket.epic === "triage") {
      if (ticket.lane && LANES.has(ticket.lane)) {
        return {
          pickup: `/pipeline ${ticket.lane} .icm/intake/triage/${ticket.slug}.md`,
          pickupKind: "verb",
        }
      }
    } else if (ticket.kind === "stub" && ticket.epic) {
      return { pickup: `/pipeline new ${ticket.epic}/${ticket.slug}`, pickupKind: "verb" }
    } else if (ticket.kind === "run") {
      if (ticket.runStage === "lane") return { pickup: null, pickupKind: null }
      return {
        pickup: `/pipeline ${ticket.runStage === "release" ? "release" : "build"} ${ticket.slug}`,
        pickupKind: "verb",
      }
    }
  }
  if (ticket.kind === "run") return { pickup: null, pickupKind: null }
  return prompt ? { pickup: prompt, pickupKind: "prompt" } : { pickup: null, pickupKind: null }
}

/** A pick-up prompt for stubs that don't carry one (sustentus's, mostly), so
 * the one-tap session link works estate-wide. */
function synthesizedPrompt(repo: TicketRepo, path: string): string {
  return [
    `Read ${path} in ${repo.fullName} for full context, then do the work it describes.`,
    "Follow that repo's own conventions and pipeline contracts (its AGENTS.md and .icm/ own the rules).",
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
    // Decided per repo once the roster is known — `fetchRepoTickets` fills
    // these in with `pickupFor` after the parse.
    pickup: null,
    pickupKind: null,
    body: readingBody(lines),
  }
}

// ---------------------------------------------------------------------------
// Fetching. One recursive git-tree call per repo that has an intake, then one
// blob read per open ticket file — content-addressed, so on a warm board that
// is only the files whose SHA moved. Best-effort per repo: one unreachable
// repo becomes a banner on the board, not an empty page.

type TreeEntry = { path: string; type: string; sha: string }

function blobUrl(repo: TicketRepo, path: string): string {
  return `https://github.com/${repo.fullName}/blob/HEAD/${path}`
}

/**
 * One ticket file, read by blob SHA rather than by path.
 *
 * `contents/<path>` and `git/blobs/<sha>` hand back the same markdown, but
 * they are not the same cache entry. A path read answers "what is in that file
 * *now*", so it expires with the board's minute and a warm read re-fetched
 * every open ticket in the estate — comfortably a hundred requests a minute
 * for a set of files that changes a handful of times a day. A SHA read is
 * content-addressed and therefore immutable: it is cached for a month, and the
 * minute-clock tree read above is what notices a file changed, by naming a
 * different SHA.
 */
async function fetchBlob(repo: TicketRepo, sha: string): Promise<string | null> {
  const res = await gh(
    `/repos/${repo.fullName}/git/blobs/${sha}`,
    "application/vnd.github.raw+json",
    BLOB_REVALIDATE_SECONDS
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
    // 409: an empty repo — nothing to show yet, not an error (a repo is
    // onboard the moment its first ticket lands).
    if (res.status === 409) return { tickets: [], error: null }
    // 404: the token can't see the repo. Only a pinned repo gets here — the
    // swept ones were just listed by the same token — so it is a connected
    // client's repo, or a house one, the board would otherwise drop without a
    // word. That silence is how a client-hosted repo read as having no tickets.
    if (res.status === 404) {
      return {
        tickets: [],
        error: {
          repo,
          message:
            "The GitHub token can't see this repo. A fine-grained token only reaches repos under one account — a repo a client invited you to needs a classic token with repo scope, and an invitation has to be accepted first.",
        },
      }
    }
    if (!res.ok) {
      return {
        tickets: [],
        error: { repo, message: await githubFailure(res) },
      }
    }
    const { tree } = (await res.json()) as { tree: TreeEntry[] }

    const stubPaths: { path: string; epic: string; sha: string }[] = []
    const legacyPaths: { path: string; sha: string }[] = []
    const runSlugs = new Set<string>()
    // Which stage each run in flight is at, read from which outputs exist —
    // the same derivation `project-labels.sh --stage auto` makes: Build's
    // notes.md present → release is next; a `lane/` folder → a lane run, not
    // resumable; otherwise build is next.
    const runStages = new Map<string, "build" | "release" | "lane">()

    for (const entry of tree) {
      if (entry.type !== "blob") {
        // In-flight runs: any directory directly under .icm/runs/ except the
        // _done archive. Sustentus archives merged runs elsewhere (its own
        // CI), so its runs/ holds history, not flight — skip it; its intake
        // stubs still show.
        const run = entry.path.match(/^\.icm\/runs\/([^/]+)$/)
        if (run && run[1] !== "_done" && repo.slug !== "sustentus")
          runSlugs.add(run[1])
        const lane = entry.path.match(/^\.icm\/runs\/([^/]+)\/lane$/)
        if (lane) runStages.set(lane[1], "lane")
        continue
      }
      const notes = entry.path.match(/^\.icm\/runs\/([^/]+)\/03_build\/output\/notes\.md$/)
      if (notes && runStages.get(notes[1]) !== "lane") runStages.set(notes[1], "release")
      const m = entry.path.match(/^\.icm\/intake\/(.+)$/)
      if (!m) continue
      const rel = m[1]
      if (rel.includes("/_done/") || !rel.endsWith(".md")) continue
      const segments = rel.split("/")
      if (segments.length === 1) {
        const nameLower = segments[0].toLowerCase()
        if (nameLower === "readme.md" || nameLower === "context.md") continue
        legacyPaths.push({ path: entry.path, sha: entry.sha })
      } else if (segments.length === 2) {
        if (segments[1].toLowerCase() === "breakdown.md") continue
        stubPaths.push({ path: entry.path, epic: segments[0], sha: entry.sha })
      }
    }

    const [stubResults, legacyResults] = await Promise.all([
      Promise.all(
        stubPaths.map(async ({ path, epic, sha }) => {
          const raw = await fetchBlob(repo, sha)
          return raw === null ? null : parseStub(path, epic, raw)
        })
      ),
      Promise.all(
        legacyPaths.map(async ({ path, sha }) => {
          const raw = await fetchBlob(repo, sha)
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
      const prompt = s.prompt ?? synthesizedPrompt(repo, s.path)
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
        prompt,
        ...pickupFor(repo, { kind: "stub", epic: s.epic, slug: s.slug, lane: s.lane }, prompt),
        body: s.body,
      }
    })

    for (const slug of [...runSlugs].sort()) {
      const runStage = runStages.get(slug) ?? "build"
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
        meta: [
          ["Run", `.icm/runs/${slug}`],
          ["Stage", runStage === "lane" ? "lane (the operator merges)" : `${runStage} next`],
        ],
        prompt: null,
        ...pickupFor(repo, { kind: "run", slug, runStage }, null),
        body: "",
      })
    }

    tickets.push(
      ...legacyResults
        .filter((t): t is Ticket => t !== null)
        .map((t) => ({ ...t, ...pickupFor(repo, { kind: "legacy", slug: t.id }, t.prompt) }))
    )
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

// --- the roster ------------------------------------------------------------
// Two tiers. The pinned repos above are read every render. Everything else the
// token owns or collaborates on goes through discovery on the hourly clock: one
// small request each, asking only whether the repo has an `.icm/intake/` to
// read. Most of the estate does not and never will, and the answer to that
// question does not change between two renders a minute apart.

/** How many pages of 100 the sweep will follow — a runaway guard, not a
 * budget: the estate is a few dozen repos. */
const MAX_SWEEP_PAGES = 10

/**
 * Every repo the token owns or was invited to as a collaborator,
 * most-recently-pushed first.
 *
 * `collaborator` is what brings a client-hosted repo onto the board: one a
 * client created under their own account or org and invited Jamie to. Without
 * it such a repo only appeared once a client row pointed at it — and connecting
 * it is exactly what a collaborator repo used to fail at. `organization_member`
 * stays out, so this is still not every org repo he can merely read.
 *
 * Read here rather than through `lib/github.ts`'s picker listing for two
 * reasons. It is a board read, so it belongs on the board's cache, tag and
 * concurrency cap — the caching invariants at the top of this file only hold
 * while they live in one place. And it has to be able to fail out loud: the
 * picker's listing is a typing aid where an empty answer costs nothing, while
 * an empty roster here silently halves the board. That is the shape the 403
 * outage arrived in — the roster had already collapsed before a single tree
 * call ran, so a spent rate limit read as an estate whose repos were broken.
 */
async function fetchOwnedRepos(): Promise<{
  fullNames: string[]
  error: string | null
}> {
  const fullNames: string[] = []
  try {
    let path: string | null =
      "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator"
    for (let page = 0; path && page < MAX_SWEEP_PAGES; page++) {
      const res = await gh(
        path,
        "application/vnd.github+json",
        DISCOVERY_REVALIDATE_SECONDS
      )
      if (!res.ok) return { fullNames: [], error: await githubFailure(res) }
      const rows = (await res.json()) as { full_name: string }[]
      fullNames.push(...rows.map((r) => r.full_name))
      const next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)
      path = next ? next[1].replace(API, "") : null
    }
    return { fullNames, error: null }
  } catch (err) {
    return {
      fullNames: [],
      error: err instanceof Error ? err.message : "network error",
    }
  }
}

/** What discovery found. `unknown` is GitHub declining to answer — reported,
 * never guessed at in either direction. */
type IntakeProbe = "present" | "absent" | { unknown: string }

/**
 * Does this repo carry an `.icm/intake/` at all? One request, on the discovery
 * clock, standing in for the recursive tree call the board used to spend on
 * every owned repo whether or not it had ever held a ticket.
 */
/**
 * Does this repo carry the `/pipeline` router? One request on the discovery
 * clock, like the intake probe: it decides whether the board sends the
 * pick-up verb or the prompt body for every ticket in the repo (D26).
 */
async function probeRouter(fullName: string): Promise<boolean> {
  try {
    const res = await gh(
      `/repos/${fullName}/contents/.claude/skills/pipeline/SKILL.md`,
      "application/vnd.github+json",
      DISCOVERY_REVALIDATE_SECONDS
    )
    return res.ok
  } catch {
    return false
  }
}

async function probeIntake(fullName: string): Promise<IntakeProbe> {
  try {
    const res = await gh(
      `/repos/${fullName}/contents/.icm/intake`,
      "application/vnd.github+json",
      DISCOVERY_REVALIDATE_SECONDS
    )
    if (res.ok) return "present"
    // 404: no intake folder, no access, or no commits. 409: an empty repo.
    // Either way there is nothing to read and never was — not an error.
    if (res.status === 404 || res.status === 409) return "absent"
    return { unknown: await githubFailure(res) }
  } catch (err) {
    return { unknown: err instanceof Error ? err.message : "network error" }
  }
}

type Roster = {
  /** Everything the board will show: the pinned tier, plus the swept repos
   * discovery found an intake in. */
  repos: TicketRepo[]
  /** Repos discovery couldn't get an answer for. They stay in the roster and
   * are named on the board, but their tree call is skipped — firing a fan-out
   * into a limit that just refused a single one-request probe is how a bad
   * minute becomes a spent hour. */
  unreadable: TicketFetchError[]
  /** The owner sweep itself failed: the board is standing on its pinned tier
   * alone, and says so rather than quietly showing half an estate. */
  sweepError: string | null
}

/**
 * The board's repo roster, with client attribution joined in from the database
 * rows that connect a repo to a lead. Deduped by full name — the pinned tier
 * wins; client attribution applies wherever a client row points at a repo.
 */
async function loadRoster(): Promise<Roster> {
  const rows = await listClientRepos()
  const attribution = new Map<string, { clientId: string; clientName: string }>()
  for (const row of rows) {
    if (!attribution.has(row.githubRepo))
      attribution.set(row.githubRepo, {
        clientId: row.clientId,
        clientName: row.clientName,
      })
  }

  const toRepo = (fullName: string): TicketRepo => {
    const client = attribution.get(fullName)
    return {
      fullName,
      slug: fullName.split("/").pop() ?? fullName,
      clientId: client?.clientId ?? null,
      clientName: client?.clientName ?? null,
      pipeline: false,
    }
  }

  const pinned = new Set<string>([
    ...HOUSE_REPOS,
    ...rows.map((r) => r.githubRepo),
    ...EXTRA_REPOS,
  ])

  const sweep = await fetchOwnedRepos()
  const probed = await Promise.all(
    sweep.fullNames
      .filter((fullName) => !pinned.has(fullName))
      .map(async (fullName) => ({
        fullName,
        probe: await probeIntake(fullName),
      }))
  )

  const repos = [...pinned].map(toRepo)
  const unreadable: TicketFetchError[] = []
  for (const { fullName, probe } of probed) {
    if (probe === "absent") continue
    const repo = toRepo(fullName)
    repos.push(repo)
    if (probe !== "present") unreadable.push({ repo, message: probe.unknown })
  }

  // The router probe, once per repo on the roster, on the same hourly clock as
  // discovery — so a repo that gains the pipeline sends verbs within the hour.
  await Promise.all(
    repos.map(async (repo) => {
      repo.pipeline = await probeRouter(repo.fullName)
    })
  )

  return { repos, unreadable, sweepError: sweep.error }
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

/** One estate read: every open ticket across the estate, before anything is
 * folded into the shape a screen wants. */
type EstateRead = {
  configured: boolean
  repos: TicketRepo[]
  /** Every open item (batch tickets and runs) — the chip counts' source. */
  tickets: Ticket[]
  errors: TicketFetchError[]
  /** The owner sweep failed, so the roster is the pinned tier alone. */
  rosterError: string | null
  dbError: string | null
}

/**
 * The estate, read once per request.
 *
 * The Data Cache already shares the *requests* between the two screens that
 * read the board — that is what the invariants at the top of this file are
 * for. `cache` shares the parse and the fold within a single render, so a
 * screen reaching for both the board and the strip pays for neither twice.
 *
 * Returns `configured: false` when GITHUB_TOKEN is unset; a database failure
 * is its own banner (`dbError`), not an empty board that lies about there
 * being no work.
 */
const readEstate = cache(async (): Promise<EstateRead> => {
  const empty = { repos: [], tickets: [], errors: [], rosterError: null }
  if (!isConfigured()) {
    return { configured: false, ...empty, dbError: null }
  }

  let roster: Roster
  try {
    roster = await loadRoster()
  } catch (err) {
    return {
      configured: true,
      ...empty,
      dbError:
        err instanceof Error ? err.message : "Could not reach the database.",
    }
  }

  const skip = new Set(roster.unreadable.map((e) => e.repo.fullName))
  const [results, todayKeys] = await Promise.all([
    Promise.all(
      roster.repos.map((repo) =>
        skip.has(repo.fullName)
          ? Promise.resolve({
              tickets: [] as Ticket[],
              error: null as TicketFetchError | null,
            })
          : fetchRepoTickets(repo)
      )
    ),
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

  return {
    configured: true,
    repos: roster.repos,
    tickets,
    errors: [
      ...roster.unreadable,
      ...results
        .map((r) => r.error)
        .filter((e): e is TicketFetchError => e !== null),
    ],
    rosterError: roster.sweepError,
    dbError: null,
  }
})

/**
 * The whole board: the estate read, folded into repo sections of batches plus
 * the now-strip. What /tickets renders.
 */
export async function listBoard(): Promise<
  EstateRead & { sections: RepoSection[]; strip: Ticket[] }
> {
  const read = await readEstate()
  const { repos, tickets } = read

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

  return { ...read, sections, strip: assembleStrip(tickets) }
}

/**
 * Just the now-strip — today's picks, runs in flight, what's stuck.
 *
 * Home renders at most five rows of it and nothing else, and used to call
 * `listBoard()` for them: the whole estate folded into repo sections and
 * batches, then thrown away. The GitHub reads underneath are the same reads
 * /tickets makes and are shared with it through the Data Cache, so this was
 * never a second trip to the API — but it is now the same trip without the
 * assembly, and home says what it actually depends on.
 */
export async function listStrip(): Promise<{
  configured: boolean
  strip: Ticket[]
  errors: TicketFetchError[]
  rosterError: string | null
  dbError: string | null
}> {
  const { configured, tickets, errors, rosterError, dbError } =
    await readEstate()
  return { configured, strip: assembleStrip(tickets), errors, rosterError, dbError }
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
      url: authoredPromptUrl(
        repo.fullName,
        "Read .icm/intake/README.md for this repo's ticket contract, then triage .icm/intake/triage/: where a real batch has formed, group the related one-off stubs into a sequenced epic folder (a breakdown.md beside sequenced stubs); tighten titles and priorities on what stays; move anything already done to the matching _done/ folder. Ticket-only changes commit straight to main."
      ),
    },
    {
      key: "sweep",
      title: "Sweep finished work",
      hint: "Move done stubs and merged runs to _done/",
      url: authoredPromptUrl(
        repo.fullName,
        "Read .icm/intake/README.md for this repo's ticket contract, then sweep for finished work: check the open stubs in .icm/intake/ and the run folders in .icm/runs/ against what has actually merged, and git mv anything finished into the matching _done/ folder. Verify against the code and PR history before moving anything — when unsure, leave it open. Ticket-only changes commit straight to main."
      ),
    },
  ]
}

/** Lives on an epic's sheet: re-ground the batch in the current state of the
 * code — refresh, resequence, split, or retire its remaining stubs. */
export function recutSessionUrl(repo: TicketRepo, batchSlug: string): string {
  return authoredPromptUrl(
    repo.fullName,
    `Read .icm/intake/${batchSlug}/breakdown.md and every stub beside it, compare them against the current state of the code, and recut the batch: refresh stale stubs, resequence what remains, split anything too big, and move anything already done to _done/. Keep the breakdown honest — it should describe the work as it stands today. Ticket-only changes commit straight to main.`
  )
}

/** One board-level button: the estate consistency pass, run where it lives. */
export function estateCheckSessionUrl(): string {
  return authoredPromptUrl(
    TODAY_REPO,
    "Run the /icm-check pass across the estate and report what has drifted — intake shape, runs hygiene, today.md pointing at real stubs. Propose fixes as tickets in the offending repos rather than fixing anything silently."
  )
}
