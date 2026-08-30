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
// read on the connected repos. Every fetch carries a revalidate — one of the
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
// org — outside `affiliation=owner`, so the sweep would never find it — and is
// added explicitly: its `.icm/` is exempt from the estate *tooling*, but its
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

// ---------------------------------------------------------------------------
// Claude deep links. Every launcher on this board — a ticket row, a batch
// sheet, a maintenance button — is a pre-filled session link that a human
// sends, which is what keeps the board read-only. They come in two shapes,
// kept side by side on purpose: both are documented by Anthropic, and the
// comment on each names the doc it comes from, so the next reader can tell a
// documented URL from a guess.
//
// The board used to point at `claude.ai/code?prompt=…&repositories=…`, which
// is neither documented nor versioned — the request to document it was closed
// *not planned* — so it could change under us without notice.

/**
 * The web/mobile session link — Anthropic's documented universal link
 * (support.claude.com/en/articles/14898120). On a phone with the Claude app
 * installed the OS hands the tap straight to the app's new-session composer;
 * anywhere else the same URL opens that form in the browser. That fallback is
 * the whole reason to prefer it: the board is a phone-first screen.
 *
 * Params are `q` (prompt), `repo` (one `owner/name`), and optional `branch`
 * (requires `repo`) and `mode`. Every launcher here passes `mode=plan`: a stub
 * or a maintenance pass is picked up by planning first, not by editing. `repo`
 * is encoded to `owner%2Fname`, as the article's own example writes it.
 *
 * Takes the prompt already encoded, so the one caller with an unbounded prompt
 * can measure it against the cap before committing to a URL.
 */
function newSessionUrl(repoFullName: string, encodedPrompt: string): string {
  // `encodeURIComponent`, not `URLSearchParams`: the latter encodes spaces as
  // `+`, and both docs' examples use `%20`.
  const repo = encodeURIComponent(repoFullName)
  return `https://claude.ai/code/new?q=${encodedPrompt}&repo=${repo}&mode=plan`
}

/**
 * A session link for one of this file's own launcher prompts — triage, sweep,
 * recut, estate check. Those prompts are authored literals a few hundred
 * characters long, so unlike a ticket's they cannot outgrow a URL at runtime
 * and need no cap: this returns a string, and its callers stay total.
 */
function claudePromptUrl(repoFullName: string, prompt: string): string {
  return newSessionUrl(repoFullName, encodeURIComponent(prompt))
}

/**
 * The ceiling on an encoded ticket prompt. A ticket's `## Prompt` section is
 * unbounded, and the terminal scheme documents a 5,000-character maximum on
 * `q` (the web link documents none, so it inherits this one — one cap, one
 * fallback). Past it both ticket builders return null and the row falls back
 * to **Copy prompt**, which is right there and has no limit — better than
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

/** A ticket's prompt, URL-encoded — null when absent or past the ceiling. */
function encodedTicketPrompt(ticket: Ticket): string | null {
  if (!ticket.prompt) return null
  const encoded = encodeURIComponent(ticket.prompt)
  return encoded.length > PROMPT_MAX_ENCODED_CHARS ? null : encoded
}

/**
 * One tap on a ticket goes from "this is the pick" to a session already
 * holding its prompt. Null when the ticket has no prompt, or the prompt is
 * past `PROMPT_MAX_ENCODED_CHARS`.
 */
export function claudeSessionUrl(ticket: Ticket): string | null {
  const q = encodedTicketPrompt(ticket)
  if (q === null) return null
  return newSessionUrl(ticket.repo.fullName, q)
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
  const q = encodedTicketPrompt(ticket)
  if (q === null) return null
  return `claude-cli://open?repo=${ticket.repo.fullName}&q=${q}`
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
    // 404: no access or no commits — either way, nothing to show, not an error
    // (a repo is onboard the moment its first ticket lands). 409: empty repo.
    if (res.status === 404 || res.status === 409)
      return { tickets: [], error: null }
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

// --- the roster ------------------------------------------------------------
// Two tiers. The pinned repos above are read every render. Everything else the
// token owns goes through discovery on the hourly clock: one small request
// each, asking only whether the repo has an `.icm/intake/` to read. Most of
// the estate does not and never will, and the answer to that question does not
// change between two renders a minute apart.

/**
 * Every repo the token owns, most-recently-pushed first.
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
  try {
    const res = await gh(
      "/user/repos?per_page=100&sort=pushed&affiliation=owner",
      "application/vnd.github+json",
      DISCOVERY_REVALIDATE_SECONDS
    )
    if (!res.ok) return { fullNames: [], error: await githubFailure(res) }
    const rows = (await res.json()) as { full_name: string }[]
    return { fullNames: rows.map((r) => r.full_name), error: null }
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
  /** Everything the board will show: the pinned tier, plus the owned repos
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
