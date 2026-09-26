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
//     This is the read that notices a ticket landing or a run opening. Beside
//     it, one open-pull-requests call per repo (spec work-reader §3): `main`
//     never holds a run's folder while its PR is open, so the PR is what says
//     a ticket is running (D-11). A lane PR carries its own slug, not the
//     triage stub's name, so each open lane PR costs one more request — its
//     file list, on the discovery clock, where the stub's move to
//     `triage/_done/` names it. Budget per repo with open stubs or runs: 1 +
//     one per open lane PR while it has open triage stubs; none otherwise.
//   • CONTENT (a month) — ticket bodies, and each epic's `breakdown.md`, read
//     by blob SHA, not by path. A path read answers "what is in that file
//     now" and has to be re-asked every minute, so a warm board re-read every
//     open ticket in the estate. A git blob SHA *is* its content, so
//     `git/blobs/<sha>` can never go stale: the minute-clock tree read is what
//     notices a file changed, by handing back a different SHA, and only the
//     files that actually changed are re-read.
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

import { RUNS_SLUG, rank } from "@/lib/board-constants"
import {
  DEFAULT_TARGET_ID,
  hintForMaintenance,
  hintForTicket,
  launchesFor,
  PROMPT_TOO_LONG,
  withHintLine,
  type Launch,
  type LaunchHint,
  type MaintenanceKind,
} from "@/lib/launchers"

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

/**
 * A second tag on the position clock's reads alone — each repo's tree and the
 * today list — so the board's silent re-read on return can bust "what moved"
 * without re-reading the estate's shape or a single blob. It has to bust
 * something: a time-revalidated read past its window is answered with the
 * stale entry while the refresh happens in the background, so an un-busted
 * re-read after five minutes away would hand back the board that was left.
 */
export const BOARD_POSITION_TAG = "tickets:position"

/**
 * A third tag on the Inbox's pull-request read (lib/gates.ts) alone, so the
 * Inbox's refresh control can expire it without re-reading the board. It rides
 * beside `BOARD_CACHE_TAG`, so the board's own refresh takes it too.
 */
export const GATES_CACHE_TAG = "tickets:gates"

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

/**
 * A ticket's state as Work's desk reads it (admin-cockpit-redesign, spec
 * work-panes §3) — the four a `StatusDot` draws for an open item:
 *
 *   next     runnable now: its epic's lowest open stub, not blocked, every
 *            `depends-on` merged; or an open triage stub
 *   open     queued behind something in its epic
 *   blocked  a `blocked:` line, or its epic's lowest open stub waiting on a
 *            dependency that isn't merged yet
 *   running  an open pull request matched to it (spec work-reader §3), or
 *            a run folder in `.icm/runs/` (D-11)
 *
 * A dependency is merged when its stub sits in the epic's `_done/` with no
 * active run folder; open in the epic, or in `_done/` with a run still going,
 * it is unmet. Today is a flag beside this, not a state (`today`).
 */
export type TicketStatus = "next" | "open" | "blocked" | "running"

/** The dependency a stub is waiting on, when one is unmet. `running` — it
 *  has an active run, so it is on its way, not untouched. */
export type WaitingOn = { slug: string; running: boolean }

/** The open pull request a ticket is running in (D-11): a spine PR matched
 *  by the slug its body carries (or its `claude/<slug>` head), or a lane PR by
 *  the triage stub it moves to `triage/_done/`. */
export type TicketPr = {
  number: number
  url: string
  draft: boolean
  /** The PR's `stage:*` label; "lane" for a lane PR; null when unlabelled. */
  stage: "define" | "build" | "release" | "lane" | null
  /** ISO — when the PR was opened. */
  openedAt: string
}

/** Where a run in flight came from: the stub it consumed, found by slug in
 *  the repo's `_done/` folders. */
export type RunOrigin = {
  /** The epic folder, or "triage". */
  epic: string
  sequence: number | null
  sequenceTotal: number | null
}

export type Ticket = {
  repo: TicketRepo
  /** Path within the repo, e.g. ".icm/intake/business-state/neon-at-the-gate.md" */
  path: string
  /** GitHub blob URL — "open the real file" escape hatch. */
  htmlUrl: string
  /** Path identity for stubs ("epic/slug", "triage/slug"), legacy ID otherwise. */
  id: string
  title: string
  /** The phone board's grouping: `status`, with a today-pick taking "today".
   *  Derived from `status` and `today`, so the two readings never disagree. */
  group: TicketGroup
  status: TicketStatus
  /** Named in icm-board's `.icm/today.md`. */
  today: boolean
  /** A triage stub's `- lane:` line. */
  lane: string | null
  /** The unmet dependency a stub waits on; null when every one is merged. */
  waitingOn: WaitingOn | null
  /** A run's stub, when one matches; null for every other kind. */
  origin: RunOrigin | null
  /** The open PR this ticket is running in; null when none matches. */
  pr: TicketPr | null
  /** "stub" (new shape) | "legacy" (flat PREFIX-NNN) | "run" (.icm/runs/ in flight) */
  kind: "stub" | "legacy" | "run"
  /** Which stage a run ticket is next for — null for every other kind. The
   * "Stage" meta line is this, formatted for the detail view; this is the
   * value a list row switches on. */
  runStage: "build" | "release" | "lane" | null
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
  /** `pickup` before the recommendation line was put on top — what each
   * launch target re-hints in its own vocabulary (`launchesForTicket`). */
  pickupBody: string | null
  pickupKind: "verb" | "prompt" | null
  /** The model/effort this pick-up is recommended to run on (lib/launchers/
   * hint.ts) — derived from the ticket, never written in it. Null when there
   * is nothing to pick up. Where a prompt body is sent and the link cannot
   * carry the recommendation, `pickup` already opens with a line naming it. */
  hint: LaunchHint | null
  /** The ticket markdown minus its header block, rendered on the board. */
  body: string
}

/** The phone board's group for a state — today's picks first, whatever
 *  their state. */
function groupOf(status: TicketStatus, today: boolean): TicketGroup {
  if (today) return "today"
  switch (status) {
    case "running":
      return "in-flight"
    case "blocked":
      return "blocked"
    case "next":
      return "next"
    default:
      return "queued"
  }
}

export type TicketFetchError = {
  repo: TicketRepo
  message: string
}

// ---------------------------------------------------------------------------
// Session links. Every launcher on this board is built by the launcher
// registry (`lib/launchers/`) — one file per tool, each naming the doc its URL
// shape comes from — and handed to the UI as a `Launch[]`, one entry per
// registered target in menu order, so no component ever names a tool. Every
// one of them launches in `code` mode, sent explicitly so a session never
// inherits a sticky plan pick from the composer.

/**
 * A ticket on every registered target: the default first, each with its URL
 * or why it can't carry this one (a prompt body past its cap). A verb is a few
 * dozen characters and never hits the cap. Empty when there is nothing to
 * pick up.
 */
export function launchesForTicket(ticket: Ticket): Launch[] {
  if (!ticket.pickupBody) return []
  return launchesFor({
    repoFullName: ticket.repo.fullName,
    prompt: ticket.pickupBody,
    mode: "code",
    hint: ticket.hint,
    hintLine: ticket.pickupKind === "prompt",
  })
}

/** What a maintenance control copies on tap, and the tools its menu offers. */
export type LaunchSet = {
  /** The prompt with the recommendation line on top, in the default target's
   * vocabulary — the same text a ticket's Copy gives. */
  prompt: string
  /** Every registered target; the default first. */
  launches: Launch[]
}

/**
 * One of this file's own launcher prompts — triage, sweep, recut, estate
 * check. Those prompts are authored literals a few hundred characters long,
 * so unlike a ticket's they cannot outgrow a URL at runtime: a target that
 * reports one past its cap means a literal was edited too long, which is a bug
 * to fix, not a state to render. The recommendation line rides on top where a
 * link cannot carry it, and counts toward that target's cap like the rest.
 */
function authoredLaunches(
  repoFullName: string,
  kind: MaintenanceKind,
  prompt: string
): LaunchSet {
  const hint = hintForMaintenance(kind)
  const launches = launchesFor({
    repoFullName,
    prompt,
    mode: "code",
    hint,
    hintLine: true,
  })
  if (launches.some((l) => l.unavailableReason === PROMPT_TOO_LONG)) {
    throw new Error("Authored launcher prompt is past the cap")
  }
  return { prompt: withHintLine(DEFAULT_TARGET_ID, prompt, hint), launches }
}

function isConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

/** The board's "can it read GitHub at all" — the Inbox's gates read asks the
 *  same question of the same token. */
export const isBoardConfigured = isConfigured

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
      // control still busts it. The position clock's reads carry a second
      // tag, for the re-read on return (BOARD_POSITION_TAG).
      next: {
        revalidate,
        tags:
          revalidate === REVALIDATE_SECONDS
            ? [BOARD_CACHE_TAG, BOARD_POSITION_TAG]
            : [BOARD_CACHE_TAG],
      },
    })
  } finally {
    release()
  }
}

/** One GraphQL answer: the data GitHub could resolve, the errors it named
 *  alongside it (a repo the token can't see comes back as one of these, with
 *  the rest of the answer intact), or — only when there is no data at all — the
 *  sentence saying why. */
export type GraphqlAnswer<T> =
  | {
      data: T
      errors: { message: string; path?: (string | number)[]; type?: string }[]
      failure: null
      /** When GitHub answered (its `date` header), ms — older than now when
       *  the cache served this answer. Null when the header is missing. */
      at: number | null
    }
  | { data: null; errors: []; failure: string }

/**
 * A GitHub GraphQL query on the board's terms: through the same queue, cached
 * the same way, failing out loud the same way. `force-cache` caches the POST
 * by its body, so one query text is one cache entry — the caller keeps the
 * text stable (the roster's order, no timestamps) or it re-reads every
 * render. GraphQL spends its own rate budget, not the REST one the trees and
 * blobs above draw on.
 */
export async function githubGraphql<T>(
  query: string,
  tags: string[]
): Promise<GraphqlAnswer<T>> {
  await acquire()
  let res: Response
  try {
    res = await fetch(`${API}/graphql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ query }),
      // The same two load-bearing halves as `gh()`: caching is opt-in for a
      // request with an Authorization header, and a POST, so `force-cache` is
      // what makes it happen at all.
      cache: "force-cache",
      next: { revalidate: REVALIDATE_SECONDS, tags },
    })
  } catch (err) {
    release()
    return {
      data: null,
      errors: [],
      failure: err instanceof Error ? err.message : "network error",
    }
  }
  release()
  if (!res.ok) {
    return { data: null, errors: [], failure: await githubFailure(res) }
  }
  const body = (await res.json().catch(() => null)) as {
    data?: T | null
    errors?: { message: string; path?: (string | number)[]; type?: string }[]
  } | null
  const errors = body?.errors ?? []
  if (!body?.data) {
    const first = errors[0]
    return {
      data: null,
      errors: [],
      failure:
        first?.type === "RATE_LIMITED"
          ? `GitHub is rate-limiting these reads — ${first.message}`
          : first?.message
            ? `GitHub answered with an error — ${first.message}`
            : "GitHub answered with nothing to read",
    }
  }
  const date = Date.parse(res.headers.get("date") ?? "")
  return {
    data: body.data,
    errors,
    failure: null,
    at: Number.isNaN(date) ? null : date,
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

type PickupSubject = {
  kind: "stub" | "legacy" | "run"
  epic?: string | null
  slug: string
  lane?: string | null
  runStage?: "build" | "release" | "lane" | null
}

/**
 * What the board sends for one ticket (icm-board decision D26). The verb where
 * the repo carries the router; the `## Prompt` body where it does not, or
 * where a verb cannot be formed (a triage stub with no valid lane, a legacy
 * flat ticket). A lane run in flight is the operator's PR to merge and is
 * never resumed, so it sends nothing.
 */
function pickupFor(
  repo: TicketRepo,
  ticket: PickupSubject,
  prompt: string | null
): Pick<Ticket, "pickup" | "pickupBody" | "pickupKind"> {
  const { pickup, pickupKind } = pickupOnly(repo, ticket, prompt)
  return { pickup, pickupBody: pickup, pickupKind }
}

function pickupOnly(
  repo: TicketRepo,
  ticket: PickupSubject,
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

/**
 * The recommendation, and — for a prompt body only — the line that names it
 * on top of what is sent, so Copy prompt and the link carry the same text and
 * the cap is measured on what actually goes out. A verb is left untouched:
 * the router reads it whole.
 */
function withLaunchHint(ticket: Ticket): Ticket {
  const hint = hintForTicket(ticket)
  const pickup =
    ticket.pickupKind === "prompt" && ticket.pickup
      ? withHintLine(DEFAULT_TARGET_ID, ticket.pickup, hint)
      : ticket.pickup
  return { ...ticket, hint, pickup }
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

  const status: TicketStatus =
    group === "in-flight"
      ? "running"
      : group === "blocked"
        ? "blocked"
        : group === "queued"
          ? "open"
          : "next"
  return {
    repo,
    path,
    htmlUrl,
    id,
    title,
    group,
    status,
    today: group === "today",
    lane: null,
    waitingOn: null,
    origin: null,
    pr: null,
    kind: "legacy",
    runStage: null,
    batch: "backlog",
    sequence: null,
    sequenceTotal: null,
    priority,
    meta,
    prompt: extractPrompt(lines),
    // Decided per repo once the roster is known — `fetchRepoTickets` fills
    // these in with `pickupFor` after the parse.
    pickup: null,
    pickupBody: null,
    pickupKind: null,
    hint: null,
    body: readingBody(lines),
  }
}

// ---------------------------------------------------------------------------
// Fetching. One recursive git-tree call per repo that has an intake, then one
// blob read per open ticket file — content-addressed, so on a warm board that
// is only the files whose SHA moved. Best-effort per repo: one unreachable
// repo becomes a banner on the board, not an empty page.

export type TreeEntry = { path: string; type: string; sha: string }

function blobUrl(repo: TicketRepo, path: string): string {
  return `https://github.com/${repo.fullName}/blob/HEAD/${path}`
}

/** A repo's default-branch tree, from the board's own minute-clock read —
 *  the same request, so the same cache entry: on a warm board it costs
 *  nothing. Empty for an empty repo; a sentence when GitHub refused. */
export async function readRepoTree(
  repo: TicketRepo
): Promise<{ entries: TreeEntry[]; error: string | null }> {
  try {
    const res = await gh(
      `/repos/${repo.fullName}/git/trees/HEAD?recursive=1`,
      "application/vnd.github+json"
    )
    // 409: an empty repo — nothing to show yet, not an error (a repo is
    // onboard the moment its first ticket lands).
    if (res.status === 409) return { entries: [], error: null }
    // 404: the token can't see the repo. Only a pinned repo gets here — the
    // swept ones were just listed by the same token — so it is a connected
    // client's repo, or a house one, the board would otherwise drop without a
    // word. That silence is how a client-hosted repo read as having no tickets.
    if (res.status === 404) {
      return {
        entries: [],
        error:
          "The GitHub token can't see this repo. A fine-grained token only reaches repos under one account — a repo a client invited you to needs a classic token with repo scope, and an invitation has to be accepted first.",
      }
    }
    if (!res.ok) return { entries: [], error: await githubFailure(res) }
    const { tree } = (await res.json()) as { tree: TreeEntry[] }
    return { entries: tree, error: null }
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : "network error",
    }
  }
}

/** One file by blob SHA, on the board's month-long content clock. */
export function readBlob(repo: TicketRepo, sha: string): Promise<string | null> {
  return fetchBlob(repo, sha)
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

/** One repo's read: its open items, each epic's breakdown (raw markdown, by
 * epic folder name — an epic without one, or whose read failed, is absent),
 * and what went wrong, if anything did. */
type RepoRead = {
  tickets: Ticket[]
  breakdowns: Record<string, string>
  /** Each epic's full row set, open, running and done, by epic folder. */
  epicRows: Record<string, EpicRow[]>
  error: TicketFetchError | null
  /** The pull-request read failed (or a lane PR's file list did): running
   *  falls back to run folders for this repo, and the board says so. */
  prError: TicketFetchError | null
}

/** One stub of an epic as its list shows it — open, running or done. Only an
 *  open or running row has a ticket on the board to open (`ticketId`, the
 *  ticket's own id); a done row's file is never read. */
export type EpicRow = {
  slug: string
  title: string
  sequence: number | null
  state: "open" | "running" | "done"
  ticketId: string | null
}

/**
 * An epic's `## Build order`, by slug: each line's place and its one line —
 * the canonical shape is `N. <feature-slug> — <one line> — depends-on: …`
 * (intake/CONTEXT.md → Formats). What titles a finished stub without reading
 * its file. A breakdown that doesn't follow the shape yields fewer entries,
 * never an error.
 */
function buildOrder(markdown: string): Map<string, { sequence: number; title: string }> {
  // Each entry's text, with its hard-wrapped continuation lines (indented,
  // not a new item) joined on.
  const entries: { sequence: number; slug: string; text: string }[] = []
  let open: { sequence: number; slug: string; text: string } | null = null
  let inSection = false
  for (const line of markdown.split("\n")) {
    if (/^##\s/.test(line)) {
      inSection = /^##\s+build order\b/i.test(line)
      open = null
      continue
    }
    if (!inSection) continue
    const m = line.match(/^\s*(\d+)\.\s+`?([a-z0-9][a-z0-9-]*)`?\s+[—–]\s+(.+)$/i)
    if (m) {
      open = { sequence: Number(m[1]), slug: m[2], text: m[3] }
      entries.push(open)
      continue
    }
    if (open && /^\s+\S/.test(line) && !/^\s*(\d+\.|[-*])\s/.test(line)) {
      open.text = `${open.text} ${line.trim()}`
      continue
    }
    open = null
  }
  const order = new Map<string, { sequence: number; title: string }>()
  for (const { sequence, slug, text } of entries) {
    if (!slug || order.has(slug)) continue
    const title = text.replace(/\s+[—–]\s+depends-on:.*$/i, "").trim()
    order.set(slug, { sequence, title: title || slug })
  }
  return order
}

// --- open pull requests — what is running (spec work-reader §3) -------------

/** The open PRs, matched the ways a ticket can be found in one. */
type OpenPulls = {
  /** Spine PRs by the slug they carry — an epic stub's file name. */
  spine: Map<string, TicketPr>
  /** Lane PRs by the triage stub each moves to `triage/_done/`. */
  triage: Map<string, TicketPr>
  /** Every pipeline PR by its own slug — what a run folder on main matches. */
  bySlug: Map<string, TicketPr>
  error: string | null
}

type PullRow = {
  number: number
  html_url: string
  draft: boolean
  created_at: string
  body: string | null
  head: { ref: string }
  labels: { name: string }[]
}

/** The labels a lane PR carries (`new-run.sh --lane` → `type:<lane>`) — the
 *  vocabulary `_shared/github.md` → Labels names for lane PRs. Shared with
 *  gates.ts so the two screens' PR reads never drift apart. */
export const LANE_LABELS = new Set([
  "type:bug",
  "type:tweak",
  "type:chore",
  "type:hotfix",
  "type:handover",
])

/**
 * The run slug a pipeline PR's body names: the spine body's Spec-table
 * `**Slug**` row, or a lane body's `- slug:` line — both behind the
 * `PIPELINE RUN` marker the scripts write. Shared with gates.ts (same
 * reasoning as `LANE_LABELS`) — a PR with no marker names no run.
 */
export function runSlugOf(body: string | null): string | null {
  const text = body ?? ""
  if (!text.includes("PIPELINE RUN")) return null
  const spec = text.match(/^\|\s*\**slug\**\s*\|\s*`?([a-z0-9][a-z0-9-]*)`?\s*\|/im)
  if (spec) return spec[1]
  const lane = text.match(/^-\s+slug:\s*`?([a-z0-9][a-z0-9-]*)`?\s*$/im)
  return lane ? lane[1] : null
}

/**
 * The slug a PR carries: `runSlugOf`'s body read, else a `claude/<slug>`
 * head. A harness-named head yields a slug no stub has, which matches
 * nothing.
 */
function prSlug(row: PullRow): string | null {
  return (
    runSlugOf(row.body) ?? row.head.ref.match(/^claude\/([a-z0-9][a-z0-9-]*)$/i)?.[1] ?? null
  )
}

function prStage(labels: string[]): TicketPr["stage"] {
  if (labels.some((l) => LANE_LABELS.has(l))) return "lane"
  for (const stage of ["release", "build", "define"] as const) {
    if (labels.includes(`stage:${stage}`)) return stage
  }
  return null
}

/**
 * One repo's open PRs — one request on the position clock, one page of 100 —
 * plus one file-list request per open lane PR on the discovery clock: the
 * stub's move is in the lane's first commit and does not change. A failed
 * read is reported, never read as "nothing running".
 */
async function fetchOpenPulls(
  repo: TicketRepo,
  /** Read lane PRs' file lists — only worth it while triage stubs are open. */
  readLanes: boolean
): Promise<OpenPulls> {
  const out: OpenPulls = { spine: new Map(), triage: new Map(), bySlug: new Map(), error: null }
  try {
    const res = await gh(
      `/repos/${repo.fullName}/pulls?state=open&per_page=100`,
      "application/vnd.github+json"
    )
    if (!res.ok) return { ...out, error: await githubFailure(res) }
    const lanes: TicketPr[] = []
    for (const row of (await res.json()) as PullRow[]) {
      const pr: TicketPr = {
        number: row.number,
        url: row.html_url,
        draft: row.draft,
        stage: prStage(row.labels.map((l) => l.name)),
        openedAt: row.created_at,
      }
      const slug = prSlug(row)
      if (slug && !out.bySlug.has(slug)) out.bySlug.set(slug, pr)
      // A lane never consumes an epic stub, so its slug matches none.
      if (pr.stage === "lane") lanes.push(pr)
      else if (slug && !out.spine.has(slug)) out.spine.set(slug, pr)
    }
    const failed: string[] = []
    await Promise.all(
      (readLanes ? lanes : []).map(async (pr) => {
        const files = await gh(
          `/repos/${repo.fullName}/pulls/${pr.number}/files?per_page=100`,
          "application/vnd.github+json",
          DISCOVERY_REVALIDATE_SECONDS
        )
        if (!files.ok) {
          failed.push(`#${pr.number}: ${await githubFailure(files)}`)
          return
        }
        // The stub's own move: renamed from `triage/<name>.md`, or — when git
        // sees the rename as a delete and an add — both halves in the list.
        // A new `_done/` file with no open stub leaving is not a consumption.
        const list = (await files.json()) as {
          filename: string
          status: string
          previous_filename?: string
        }[]
        const removed = new Set(list.filter((f) => f.status === "removed").map((f) => f.filename))
        for (const file of list) {
          const name = file.filename.match(/^\.icm\/intake\/triage\/_done\/([^/]+)\.md$/)?.[1]
          if (!name || out.triage.has(name)) continue
          const from = `.icm/intake/triage/${name}.md`
          if (
            (file.status === "renamed" && file.previous_filename === from) ||
            (file.status === "added" && removed.has(from))
          )
            out.triage.set(name, pr)
        }
      })
    )
    if (failed.length > 0)
      out.error = `A lane pull request's files couldn't be read (${failed.join("; ")}).`
    return out
  } catch (err) {
    return { ...out, error: err instanceof Error ? err.message : "network error" }
  }
}

async function fetchRepoTickets(repo: TicketRepo): Promise<RepoRead> {
  try {
    const { entries: tree, error } = await readRepoTree(repo)
    if (error) {
      return {
        tickets: [],
        breakdowns: {},
        epicRows: {},
        prError: null,
        error: { repo, message: error },
      }
    }

    const stubPaths: { path: string; epic: string; sha: string }[] = []
    const legacyPaths: { path: string; sha: string }[] = []
    const breakdownPaths: { epic: string; sha: string }[] = []
    const runSlugs = new Set<string>()
    // Each epic's `_done/` stubs, by name only — the tree already lists them,
    // so knowing what an epic has finished costs no request. Their blobs are
    // never read: a done row takes its title from the breakdown's build order.
    // `triage` holds the finished one-offs, read only to title a lane run.
    const doneByEpic = new Map<string, Set<string>>()
    // Which stage each run in flight is at, read from which outputs exist —
    // the same derivation `project-labels.sh --stage auto` makes: Build's
    // notes.md present → release is next; a `lane/` folder → a lane run, not
    // resumable; otherwise build is next.
    const runStages = new Map<string, "build" | "release" | "lane">()
    // Each run folder's own folders — a scope run (`01_scope/` alone) is a
    // scope waiting for review on main, not a run in flight (spec
    // work-reader §4).
    const runChildren = new Map<string, Set<string>>()

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
        const child = entry.path.match(/^\.icm\/runs\/([^/]+)\/([^/]+)$/)
        if (child) {
          if (!runChildren.has(child[1])) runChildren.set(child[1], new Set())
          runChildren.get(child[1])!.add(child[2])
        }
        continue
      }
      const notes = entry.path.match(/^\.icm\/runs\/([^/]+)\/03_build\/output\/notes\.md$/)
      if (notes && runStages.get(notes[1]) !== "lane") runStages.set(notes[1], "release")
      const m = entry.path.match(/^\.icm\/intake\/(.+)$/)
      if (!m) continue
      const rel = m[1]
      if (!rel.endsWith(".md")) continue
      const segments = rel.split("/")
      // `<epic>/_done/<slug>.md` — a finished stub of a live epic. A whole
      // epic archived under `intake/_done/` is history and stays off the board.
      if (segments.length === 3 && segments[1] === "_done" && segments[0] !== "_done") {
        const slug = segments[2].replace(/\.md$/, "")
        if (slug.toLowerCase() === "breakdown") continue
        if (!doneByEpic.has(segments[0])) doneByEpic.set(segments[0], new Set())
        doneByEpic.get(segments[0])!.add(slug)
        continue
      }
      if (rel.includes("_done/")) continue
      if (segments.length === 1) {
        const nameLower = segments[0].toLowerCase()
        if (nameLower === "readme.md" || nameLower === "context.md") continue
        legacyPaths.push({ path: entry.path, sha: entry.sha })
      } else if (segments.length === 2) {
        // An epic's breakdown rides along with its stubs, by the same blob
        // SHA and on the same clock. The pseudo-batches never carry one.
        if (segments[1].toLowerCase() === "breakdown.md") {
          if (batchKind(segments[0]) === "epic")
            breakdownPaths.push({ epic: segments[0], sha: entry.sha })
          continue
        }
        stubPaths.push({ path: entry.path, epic: segments[0], sha: entry.sha })
      }
    }

    for (const slug of runSlugs) {
      const children = runChildren.get(slug)
      if (children?.size === 1 && children.has("01_scope")) runSlugs.delete(slug)
    }

    const [stubResults, legacyResults, breakdownResults, pulls] = await Promise.all([
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
      // A breakdown that can't be read is left out, as a stub that can't be
      // is: the epic still stands, it just shows no breakdown.
      Promise.all(
        breakdownPaths.map(async ({ epic, sha }) => {
          const raw = await fetchBlob(repo, sha)
          return raw === null ? null : ([epic, raw] as const)
        })
      ),
      // Only a repo with something to match pays for the read.
      stubPaths.length > 0 || runSlugs.size > 0
        ? fetchOpenPulls(repo, stubPaths.some((p) => p.epic === "triage"))
        : Promise.resolve<OpenPulls>({ spine: new Map(), triage: new Map(), bySlug: new Map(), error: null }),
    ])
    const breakdowns = Object.fromEntries(
      breakdownResults.filter((b): b is readonly [string, string] => b !== null)
    )
    const orders = new Map(
      Object.entries(breakdowns).map(([epic, raw]) => [epic, buildOrder(raw)])
    )

    const stubs = stubResults.filter((s): s is Stub => s !== null)

    // Positional grouping, per epic (spec work-panes §3). The lowest-sequence
    // stub without a `blocked:` line is the epic's one candidate for Up next:
    // "next" when every dependency it names is merged, "blocked" — waiting on
    // the one that isn't — otherwise. Every other open stub queues. Triage
    // stubs are all "next" — a backlog, not a batch.
    const openByEpic = new Map<string, Set<string>>()
    for (const s of stubs) {
      if (!openByEpic.has(s.epic)) openByEpic.set(s.epic, new Set())
      openByEpic.get(s.epic)!.add(s.slug)
    }
    // The open PR a stub is running in: a spine PR by its slug, or a lane PR
    // by the triage stub it consumed.
    const prOf = (s: Stub): TicketPr | null =>
      (s.epic === "triage" ? pulls.triage.get(s.slug) : pulls.spine.get(s.slug)) ?? null
    const nextOf = new Map<string, string>()
    for (const s of stubs) {
      // A running stub is under way, not runnable: the next one in sequence
      // is the epic's candidate, waiting on it.
      if (s.epic === "triage" || s.blocked !== null || prOf(s)) continue
      const current = nextOf.get(s.epic)
      const currentSeq = current
        ? (stubs.find((x) => x.epic === s.epic && x.slug === current)
            ?.sequence ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER
      if ((s.sequence ?? Number.MAX_SAFE_INTEGER - 1) < currentSeq)
        nextOf.set(s.epic, s.slug)
    }
    // A dependency is unmet while it is open in the epic, or finished into
    // `_done/` with its run still going. A slug the epic doesn't hold at all
    // blocks nothing — it stays visible in the stub's own fields.
    const unmetDependency = (s: Stub): WaitingOn | null => {
      for (const d of s.dependsOn) {
        if (openByEpic.get(s.epic)?.has(d)) return { slug: d, running: pulls.spine.has(d) }
        if (doneByEpic.get(s.epic)?.has(d) && runSlugs.has(d))
          return { slug: d, running: true }
      }
      return null
    }

    const tickets: Ticket[] = stubs.map((s) => {
      const waitingOn = s.epic === "triage" ? null : unmetDependency(s)
      const pr = prOf(s)
      let status: TicketStatus
      if (pr) status = "running"
      else if (s.blocked !== null) status = "blocked"
      else if (s.epic === "triage") status = "next"
      else if (nextOf.get(s.epic) === s.slug) status = waitingOn ? "blocked" : "next"
      else status = "open"
      const meta: [string, string][] = waitingOn
        ? [
            ...s.meta,
            ["Waiting on", waitingOn.running ? `${waitingOn.slug} — running` : waitingOn.slug],
          ]
        : s.meta
      const prompt = s.prompt ?? synthesizedPrompt(repo, s.path)
      return {
        repo,
        path: s.path,
        htmlUrl: blobUrl(repo, s.path),
        id: `${s.epic}/${s.slug}`,
        title: s.title,
        group: groupOf(status, false),
        status,
        today: false,
        lane: s.lane,
        waitingOn,
        origin: null,
        pr,
        kind: "stub",
        runStage: null,
        batch: s.epic,
        sequence: s.sequence,
        sequenceTotal: s.sequenceTotal,
        priority: s.priority,
        meta,
        prompt,
        ...pickupFor(repo, { kind: "stub", epic: s.epic, slug: s.slug, lane: s.lane }, prompt),
        hint: null,
        body: s.body,
      }
    })

    // A run is titled by the stub it consumed: found by slug in an epic's
    // `_done/`, its title and place from that epic's build order — else the
    // bare slug, as before.
    const originOf = (slug: string): (RunOrigin & { title: string | null }) | null => {
      for (const [epic, done] of doneByEpic) {
        if (!done.has(slug)) continue
        const placed = orders.get(epic)?.get(slug) ?? null
        // The plan's size is its highest place, not how many lines matched
        // the shape — a line that didn't would otherwise undercount it.
        const total = Math.max(0, ...[...(orders.get(epic)?.values() ?? [])].map((o) => o.sequence))
        return {
          epic,
          sequence: placed?.sequence ?? null,
          sequenceTotal: placed && total > 0 ? total : null,
          title: placed?.title ?? null,
        }
      }
      return null
    }

    for (const slug of [...runSlugs].sort()) {
      const runStage = runStages.get(slug) ?? "build"
      const found = originOf(slug)
      tickets.push({
        repo,
        path: `.icm/runs/${slug}`,
        htmlUrl: `https://github.com/${repo.fullName}/tree/HEAD/.icm/runs/${slug}`,
        id: `runs/${slug}`,
        title: found?.title ?? slug,
        group: groupOf("running", false),
        status: "running",
        today: false,
        lane: null,
        waitingOn: null,
        origin: found
          ? { epic: found.epic, sequence: found.sequence, sequenceTotal: found.sequenceTotal }
          : null,
        pr: pulls.bySlug.get(slug) ?? null,
        kind: "run",
        runStage,
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
        hint: null,
        body: "",
      })
    }

    tickets.push(
      ...legacyResults
        .filter((t): t is Ticket => t !== null)
        .map((t) => ({ ...t, ...pickupFor(repo, { kind: "legacy", slug: t.id }, t.prompt) }))
    )

    // Every stub of every epic, in sequence — open, running and done — for
    // the epic's own list. Open rows are the parsed stubs; `_done/` rows take
    // their place and title from the build order, and a `_done/` stub the
    // breakdown doesn't name sinks after the sequenced rows under its slug.
    const epicRows: Record<string, EpicRow[]> = {}
    const epics = new Set([...openByEpic.keys(), ...doneByEpic.keys()])
    for (const epic of epics) {
      if (batchKind(epic) !== "epic") continue
      const order = orders.get(epic)
      const rows: EpicRow[] = stubs
        .filter((s) => s.epic === epic)
        .map((s) => ({
          slug: s.slug,
          title: s.title,
          sequence: s.sequence ?? order?.get(s.slug)?.sequence ?? null,
          state: pulls.spine.has(s.slug) ? ("running" as const) : ("open" as const),
          ticketId: `${epic}/${s.slug}`,
        }))
      for (const slug of doneByEpic.get(epic) ?? []) {
        if (openByEpic.get(epic)?.has(slug)) continue
        const placed = order?.get(slug)
        const running = runSlugs.has(slug)
        rows.push({
          slug,
          title: placed?.title ?? slug,
          sequence: placed?.sequence ?? null,
          state: running ? "running" : "done",
          ticketId: running ? `runs/${slug}` : null,
        })
      }
      epicRows[epic] = rows.sort(
        (a, b) =>
          (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER) ||
          a.slug.localeCompare(b.slug)
      )
    }

    return {
      tickets: tickets.map(withLaunchHint),
      breakdowns,
      epicRows,
      error: null,
      prError: pulls.error ? { repo, message: pulls.error } : null,
    }
  } catch (err) {
    return {
      tickets: [],
      breakdowns: {},
      epicRows: {},
      prError: null,
      error: {
        repo,
        message: err instanceof Error ? err.message : "network error",
      },
    }
  }
}

// --- today.md — the one home of the today flag ------------------------------

/** "<repo>/<id>" ticket keys from icm-board's .icm/today.md, e.g.
 * "jamienisbet/estate-board/tree-fetch" or legacy "icm-board/ICM-001" — the
 * same shape `ticketKey()` (board-model.ts) builds a ticket's own key in. */
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
      keys.add(`${m[1].trim()}/${m[2].trim()}`)
    }
  } catch {
    // No today.md (or unreachable) just means no picks — never an error.
  }
  return keys
}

// ---------------------------------------------------------------------------

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
 * Sorted by `full_name` rather than `pushed`, and deduplicated on the way out.
 * Each page is cached on its own hourly clock (`DISCOVERY_REVALIDATE_SECONDS`),
 * so the pages of one sweep can be read at different times — a `pushed` sort
 * reorders the whole list on every push in the estate, and a repo that crossed
 * a page-100 boundary between two page reads showed up on both pages (a
 * duplicate board group) or on neither (missing for up to an hour). A
 * full-name sort never reorders on its own, so pages cached an hour apart
 * still partition the same list the same way.
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
      "/user/repos?per_page=100&sort=full_name&direction=asc&affiliation=owner,collaborator"
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
    return { fullNames: [...new Set(fullNames)], error: null }
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

export type Roster = {
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

  // The router probe, once per repo on the roster, on the same hourly clock
  // as discovery — so a repo that gains the pipeline sends verbs within the
  // hour.
  await Promise.all(
    repos.map(async (repo) => {
      repo.pipeline = await probeRouter(repo.fullName)
    })
  )

  return { repos, unreadable, sweepError: sweep.error }
}

/**
 * The roster, read once per request. Work and the Inbox's gates read both
 * stand on it, and the shell's badge reads the gates on every screen — so one
 * render never pays the database lookup twice. The GitHub half is already
 * shared by the Data Cache.
 */
export const readRoster = cache(loadRoster)

// ---------------------------------------------------------------------------
// Batch assembly — the board's shape. A batch is one line item: an epic folder
// with its stubs in sequence, one of the two pseudo-batches every repo can
// carry ("triage" one-offs, "backlog" legacy tickets), or "runs" — the repo's
// runs in flight, which file under no epic.

export type BatchKind = "epic" | "triage" | "backlog" | "runs"

export type Batch = {
  /** The epic folder's name, or the pseudo-batch's ("triage"/"backlog"/"runs"). */
  slug: string
  kind: BatchKind
  /** Humanized slug — the line item's label. */
  title: string
  /** The epic's `breakdown.md`, raw markdown — rendered only when the epic is
   * opened. Null when the epic has none (or it couldn't be read), and always
   * for triage and backlog. */
  breakdown: string | null
  /** The folder on GitHub — the batch's "open the real thing" escape hatch. */
  htmlUrl: string
  /** An epic's total: its open stubs plus everything in its `_done/`
   * (running ones included). Null for the pseudo-batches. */
  planned: number | null
  /** An epic's finished stubs: in `_done/` with no active run. 0 for the
   * pseudo-batches. */
  done: number
  /** Open tickets, batch order: sequence for epics, priority for the rest. */
  tickets: Ticket[]
  /** An epic's every stub in sequence — open, running and done (`EpicRow`).
   *  Null for the pseudo-batches. */
  rows: EpicRow[] | null
  /** The stub a swipe-right starts: the epic's "next", else the top of the
   * pile. Null for an empty batch (which the board never renders) and for
   * "runs" — a run in flight isn't picked up the way a stub is. */
  next: Ticket | null
  todayCount: number
  blockedCount: number
  p0Count: number
}

export type RepoSection = {
  repo: TicketRepo
  /** Epics by name, then triage, then backlog, then runs — stable positions. */
  batches: Batch[]
  /** Open tickets across the section's non-run batches — what's still waiting
   * to be picked up. A run in flight is already picked up, so it isn't
   * counted here (it has its own "in flight" count on the runs batch). */
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

/** The "runs" batch: every run in flight, id order — a pile, not a pipeline,
 * so there is no "next" to pick and nothing planned to be done against. */
function runsBatch(repo: TicketRepo, runs: Ticket[]): Batch {
  const ordered = [...runs].sort((a, b) => a.id.localeCompare(b.id))
  return {
    slug: RUNS_SLUG,
    kind: "runs",
    title: "In flight",
    breakdown: null,
    htmlUrl: `https://github.com/${repo.fullName}/tree/HEAD/.icm/runs`,
    planned: null,
    done: 0,
    tickets: ordered,
    rows: null,
    next: null,
    todayCount: ordered.filter((t) => t.today).length,
    blockedCount: 0,
    p0Count: 0,
  }
}

function assembleBatches(
  repo: TicketRepo,
  tickets: Ticket[],
  breakdowns: Record<string, string>,
  epicRows: Record<string, EpicRow[]>
): Batch[] {
  const byBatch = new Map<string, Ticket[]>()
  const runs: Ticket[] = []
  for (const t of tickets) {
    if (t.kind === "run") {
      runs.push(t)
      continue
    }
    if (t.batch === null) continue
    const list = byBatch.get(t.batch) ?? []
    list.push(t)
    byBatch.set(t.batch, list)
  }

  // An epic whose every stub is through still has its rows to show, all
  // dimmed, until the epic itself is archived.
  for (const slug of Object.keys(epicRows)) {
    if (!byBatch.has(slug)) byBatch.set(slug, [])
  }

  const batches: Batch[] = []
  for (const [slug, members] of byBatch) {
    const kind = batchKind(slug)
    const ordered = [...members].sort(batchOrder(kind))
    // An epic counts what it holds: open plus `_done/`, of which the done
    // ones are those with no run still going (spec work-panes §4).
    const rows = kind === "epic" ? (epicRows[slug] ?? []) : null
    batches.push({
      slug,
      kind,
      title: batchTitle(kind, slug),
      breakdown: kind === "epic" ? (breakdowns[slug] ?? null) : null,
      htmlUrl: batchFolderUrl(repo, kind, slug),
      planned: rows ? Math.max(rows.length, ordered.length) : null,
      done: rows ? rows.filter((r) => r.state === "done").length : 0,
      tickets: ordered,
      rows,
      next: ordered.find((t) => t.status === "next") ?? ordered[0] ?? null,
      todayCount: ordered.filter((t) => t.today).length,
      blockedCount: ordered.filter((t) => t.status === "blocked").length,
      p0Count: ordered.filter((t) => t.priority === "P0").length,
    })
  }
  if (runs.length > 0) batches.push(runsBatch(repo, runs))

  const kindOrder: Record<BatchKind, number> = {
    epic: 0,
    triage: 1,
    backlog: 2,
    runs: 3,
  }
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
 * the daily glance starts where the action is. Ranked on the section's
 * non-run batches alone: a run picked for today counts as "a run in flight"
 * here, not as a today-pick, or the two tiers would disagree.
 */
function sectionUrgency(section: RepoSection, hasRun: boolean): number {
  const batches = section.batches.filter((b) => b.kind !== "runs")
  if (batches.some((b) => b.todayCount > 0)) return 0
  if (batches.some((b) => b.blockedCount > 0)) return 1
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
  /** Each repo's epic breakdowns, by repo full name, then epic folder. */
  breakdowns: Map<string, Record<string, string>>
  /** Each repo's epic rows (`EpicRow`), by repo full name, then epic folder. */
  epicRows: Map<string, Record<string, EpicRow[]>>
  /** icm-board's today.md picks, in the file's order, as `<repo>/<id>`
   *  ticket keys — the Today view's order. */
  todayOrder: string[]
  errors: TicketFetchError[]
  /** Repos whose pull requests couldn't be read — running there comes from
   *  run folders alone. */
  prErrors: TicketFetchError[]
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
  const empty = {
    repos: [],
    tickets: [],
    breakdowns: new Map<string, Record<string, string>>(),
    epicRows: new Map<string, Record<string, EpicRow[]>>(),
    todayOrder: [],
    errors: [],
    prErrors: [],
    rosterError: null,
  }
  if (!isConfigured()) {
    return { configured: false, ...empty, dbError: null }
  }

  let roster: Roster
  try {
    roster = await readRoster()
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
          ? Promise.resolve<RepoRead>({ tickets: [], breakdowns: {}, epicRows: {}, error: null, prError: null })
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
      todayKeys.has(`${t.repo.slug}/${t.id}`)
        ? { ...t, today: true, group: groupOf(t.status, true) }
        : t
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
    breakdowns: new Map(
      roster.repos.map((repo, i) => [repo.fullName, results[i].breakdowns])
    ),
    epicRows: new Map(
      roster.repos.map((repo, i) => [repo.fullName, results[i].epicRows])
    ),
    todayOrder: [...todayKeys],
    errors: [
      ...roster.unreadable,
      ...results
        .map((r) => r.error)
        .filter((e): e is TicketFetchError => e !== null),
    ],
    prErrors: results
      .map((r) => r.prError)
      .filter((e): e is TicketFetchError => e !== null),
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
  const { repos, tickets, breakdowns, epicRows } = read

  const sections = repos
    .map((repo) => {
      const own = tickets.filter((t) => t.repo.fullName === repo.fullName)
      const batches = assembleBatches(
        repo,
        own,
        breakdowns.get(repo.fullName) ?? {},
        epicRows.get(repo.fullName) ?? {}
      )
      return {
        section: {
          repo,
          batches,
          open: batches.reduce(
            (n, b) => n + (b.kind === "runs" ? 0 : b.tickets.length),
            0
          ),
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

// ---------------------------------------------------------------------------
// Maintenance launchers — the board's "button tied to a script" surface, kept
// inside the read-only contract: each one copies its maintenance prompt, and
// offers it pre-filled on every registered tool; a human sends it. Prompts
// follow the intake README's rules and stand alone in a fresh session at the
// repo root.

export type MaintenanceLauncher = {
  key: string
  title: string
  /** One line under the title saying what the session will actually do. */
  hint: string
  launch: LaunchSet
}

/**
 * How a maintenance session lands what it changed (D39 §8): ticket-only
 * changes commit straight to main, every repo alike — no UAT branch, no
 * ticket PR. The shape and the merge rule live once, in the pr-conventions
 * skill, and the prompt points there rather than restating them.
 */
function ticketLanding(): string {
  return `Ticket-only changes commit straight to main — the shape and the merge rule are in the pr-conventions skill, "Ticket commits".`
}

export function repoMaintenanceLaunchers(repo: TicketRepo): MaintenanceLauncher[] {
  return [
    {
      key: "triage",
      title: "Triage the backlog",
      hint: "Batch related one-offs into epics, tighten what stays",
      launch: authoredLaunches(
        repo.fullName,
        "triage",
        `Read .icm/intake/README.md for this repo's ticket contract, then triage .icm/intake/triage/: where a real batch has formed, group the related one-off stubs into a sequenced epic folder (a breakdown.md beside sequenced stubs); tighten titles and priorities on what stays; move anything already done to the matching _done/ folder. ${ticketLanding()}`
      ),
    },
    {
      key: "sweep",
      title: "Sweep finished work",
      hint: "Move done stubs and merged runs to _done/",
      launch: authoredLaunches(
        repo.fullName,
        "sweep",
        `Read .icm/intake/README.md for this repo's ticket contract, then sweep for finished work: check the open stubs in .icm/intake/ and the run folders in .icm/runs/ against what has actually merged, and git mv anything finished into the matching _done/ folder. Verify against the code and PR history before moving anything — when unsure, leave it open. ${ticketLanding()}`
      ),
    },
  ]
}

/** Lives on an epic's sheet: re-ground the batch in the current state of the
 * code — refresh, resequence, split, or retire its remaining stubs. */
export function recutLaunches(repo: TicketRepo, batchSlug: string): LaunchSet {
  return authoredLaunches(
    repo.fullName,
    "recut",
    `Read .icm/intake/${batchSlug}/breakdown.md and every stub beside it, compare them against the current state of the code, and recut the batch: refresh stale stubs, resequence what remains, split anything too big, and move anything already done to _done/. Keep the breakdown honest — it should describe the work as it stands today. ${ticketLanding()}`
  )
}

/** One board-level button: the estate consistency pass, run where it lives. */
export function estateCheckLaunches(): LaunchSet {
  return authoredLaunches(
    TODAY_REPO,
    "estate-check",
    "Run the /icm-check pass across the estate and report what has drifted — intake shape, runs hygiene, today.md pointing at real stubs. Propose fixes as tickets in the offending repos rather than fixing anything silently."
  )
}

// ---------------------------------------------------------------------------
// The board as plain data — what /tickets hands its client root. The board is
// read once per visit and every interaction after that (the repo filter,
// opening a batch, reading a ticket) happens in the browser, so everything the
// client needs arrives here, serialisable: ticket bodies and epic breakdowns as
// raw markdown (rendered only when that ticket or epic is opened), and every
// launcher already built, because this module is server-only and the client
// can't call into it.

/** A ticket with its launch targets built (`launchesForTicket`). */
export type BoardTicket = Ticket & { launches: Launch[] }

/** A batch with its tickets ready for the client; `next` is only what a
 * swipe or a row needs — the full ticket is already in `tickets`, under `id`. */
export type BoardBatch = Omit<Batch, "tickets" | "next"> & {
  tickets: BoardTicket[]
  next: { id: string; title: string; pickup: string | null } | null
  /** The recut launcher — epics only. */
  recut: LaunchSet | null
}

export type BoardSection = {
  repo: TicketRepo
  batches: BoardBatch[]
  open: number
  maintenance: MaintenanceLauncher[]
}

export type BoardData = {
  repos: TicketRepo[]
  /** Open items per repo slug, runs included — the chip counts. */
  counts: Record<string, number>
  /** Open items across the estate. */
  total: number
  sections: BoardSection[]
  strip: BoardTicket[]
  errors: TicketFetchError[]
  /** Repos whose pull requests couldn't be read (spec work-reader §5). */
  prErrors: TicketFetchError[]
  rosterError: string | null
  dbError: string | null
  estateCheck: LaunchSet
  /** today.md's picks in its own order, as ticket keys (`<repo>/<id>`). */
  todayOrder: string[]
  /** When this read finished, ISO — the board's "as of". */
  readAt: string
}

function boardTicket(ticket: Ticket): BoardTicket {
  return { ...ticket, launches: launchesForTicket(ticket) }
}

/** The whole board for the client, or null when GitHub isn't configured. */
export async function readBoard(): Promise<BoardData | null> {
  const board = await listBoard()
  if (!board.configured) return null

  const counts: Record<string, number> = {}
  for (const ticket of board.tickets) {
    counts[ticket.repo.slug] = (counts[ticket.repo.slug] ?? 0) + 1
  }

  return {
    repos: board.repos,
    counts,
    total: board.tickets.length,
    sections: board.sections.map((section) => ({
      repo: section.repo,
      open: section.open,
      maintenance: repoMaintenanceLaunchers(section.repo),
      batches: section.batches.map(({ tickets, next, ...batch }) => ({
        ...batch,
        tickets: tickets.map(boardTicket),
        next: next ? { id: next.id, title: next.title, pickup: next.pickup } : null,
        recut:
          batch.kind === "epic" ? recutLaunches(section.repo, batch.slug) : null,
      })),
    })),
    strip: board.strip.map(boardTicket),
    errors: board.errors,
    prErrors: board.prErrors,
    rosterError: board.rosterError,
    dbError: board.dbError,
    estateCheck: estateCheckLaunches(),
    todayOrder: board.todayOrder,
    readAt: new Date().toISOString(),
  }
}
