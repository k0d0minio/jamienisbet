import "server-only"

import { cache } from "react"

import type {
  GateFact,
  GateKind,
  GateLaunch,
  GateLink,
  GateRow,
  GatesRead,
} from "@/lib/inbox-row"
import {
  launchLinkProps,
  launchesFor,
  primaryLaunch,
  type LaunchHint,
} from "@/lib/launchers"
import { HINT_RULES } from "@/lib/launchers/hint"
import {
  BOARD_CACHE_TAG,
  GATES_CACHE_TAG,
  githubGraphql,
  isBoardConfigured,
  LANE_LABELS,
  readBlob,
  readRepoTree,
  readRoster,
  runSlugOf,
  type Roster,
  type TicketRepo,
  type TreeEntry,
} from "@/lib/tickets"

// Gates and PRs — the Inbox's head group (D-13, D-14): what waits on Jamie's
// review across every repo on Work's roster. Pull requests waiting on the
// Spec approved or Ready to merge tick, green lane PRs waiting for a merge,
// red CI, blocked runs, and scopes on main nobody has taken into Define yet.
//
// Read-only (D-9). Every row is a pointer to where the thing is resolved — the
// PR, the preview, the failing check, the file — and it leaves when GitHub
// stops showing it waiting. Nothing here ticks, merges or re-runs anything.
//
// The budget (spec §2, D-38). Pull requests come from GitHub's GraphQL API,
// one aliased query per chunk of repos, never a REST call per PR: the head's
// check runs, commit statuses and deployments ride in the same answer. The
// query goes through the board's queue and cache (lib/tickets.ts), 60 seconds
// under its own tag, on GraphQL's rate budget rather than the REST one Work's
// trees and blobs spend. A second query reads each run's status.md at its PR's
// head commit — keyed by commit id, so it is only re-asked when a PR moves.
// Scopes and runs on main come from Work's own tree read and its blob cache.
//
// Never makes the Inbox wait: `loadGates` never rejects, and gives up after
// READ_BOUND_MS with a sentence rather than holding the group's loading line.

/** Open PRs read per repo, most recently updated first. */
const PRS_PER_REPO = 30
/** Repos per GraphQL query — keeps each answer well inside GitHub's node
 *  limit and Next's per-entry cache size. */
const REPOS_PER_QUERY = 10
/** How long the group may take before it says so instead. */
const READ_BOUND_MS = 10_000

/** The order the group lists its kinds in, and the precedence a PR's one row
 *  is picked by — Blocked run first, because it names what unblocks it. */
const KIND_ORDER: GateKind[] = ["blocked", "red", "spec", "merge", "lane", "scope"]

// ---- The GraphQL answer's shape --------------------------------------------

type CheckRunNode = {
  __typename: "CheckRun"
  name: string
  status: string
  conclusion: string | null
  detailsUrl: string | null
  startedAt: string | null
  completedAt: string | null
  databaseId: number | null
}

type StatusContextNode = {
  __typename: "StatusContext"
  context: string
  state: string
  targetUrl: string | null
  description: string | null
  createdAt: string
}

type PrNode = {
  number: number
  title: string
  url: string
  isDraft: boolean
  createdAt: string
  body: string
  headRefName: string
  labels: { nodes: { name: string }[] }
  commits: {
    nodes: {
      commit: {
        oid: string
        committedDate: string
        statusCheckRollup: {
          contexts: {
            nodes: (CheckRunNode | StatusContextNode | { __typename: string })[]
          }
        } | null
        deployments: {
          nodes: {
            environment: string | null
            latestStatus: { state: string; environmentUrl: string | null } | null
          }[]
        } | null
      }
    }[]
  }
}

type RepoNode = {
  pullRequests: { totalCount: number; nodes: PrNode[] }
} | null

const PR_FIELDS = `
fragment gatePulls on Repository {
  pullRequests(states: OPEN, first: ${PRS_PER_REPO}, orderBy: {field: UPDATED_AT, direction: DESC}) {
    totalCount
    nodes {
      number title url isDraft createdAt body headRefName
      labels(first: 20) { nodes { name } }
      commits(last: 1) {
        nodes {
          commit {
            oid committedDate
            statusCheckRollup {
              contexts(first: 60) {
                nodes {
                  __typename
                  ... on CheckRun { name status conclusion detailsUrl startedAt completedAt databaseId }
                  ... on StatusContext { context state targetUrl description createdAt }
                }
              }
            }
            deployments(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes { environment latestStatus { state environmentUrl } }
            }
          }
        }
      }
    }
  }
}`

function repoArgs(repo: TicketRepo): string {
  const [owner, name] = repo.fullName.split("/")
  return `owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}`
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// ---- Signals: ci-status.sh's arithmetic -------------------------------------

type Signal = {
  name: string
  state: "passed" | "failed" | "running" | "skipped"
  href: string | null
  /** When it settled (or last changed), ms. */
  at: number | null
}

const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).getTime() : null

/**
 * The head's signals, read the way `.icm/scripts/ci-status.sh` reads them:
 * check runs deduplicated by name with the newest attempt winning (a re-run
 * leaves both on the SHA, and the stale one is how a green PR reads red
 * forever); a check run fails on any completed conclusion but success,
 * neutral or skipped; a commit status fails on failure or error; "Vercel
 * Preview Comments" is noise; a Vercel status that says its build was skipped
 * is neither a pass nor a failure. Advisory jobs count — a red advisory job is
 * a finding.
 */
function signalsOf(pr: PrNode): Signal[] {
  const nodes = pr.commits.nodes[0]?.commit.statusCheckRollup?.contexts.nodes ?? []
  const newest = new Map<string, CheckRunNode>()
  const statuses: StatusContextNode[] = []
  for (const node of nodes) {
    if (node.__typename === "CheckRun") {
      const run = node as CheckRunNode
      if (/Vercel Preview Comments/.test(run.name)) continue
      const held = newest.get(run.name)
      // The id first: a re-run still queued has no start time yet, and must
      // still replace the failed attempt it was queued to replace.
      const later =
        !held ||
        (run.databaseId !== null && held.databaseId !== null
          ? run.databaseId > held.databaseId
          : (time(run.startedAt) ?? Number.MAX_SAFE_INTEGER) >
            (time(held.startedAt) ?? Number.MAX_SAFE_INTEGER))
      if (later) newest.set(run.name, run)
    } else if (node.__typename === "StatusContext") {
      statuses.push(node as StatusContextNode)
    }
  }

  const signals: Signal[] = []
  for (const run of newest.values()) {
    const conclusion = (run.conclusion ?? "").toUpperCase()
    signals.push({
      name: run.name,
      state:
        run.status.toUpperCase() !== "COMPLETED"
          ? "running"
          : ["SUCCESS", "NEUTRAL", "SKIPPED"].includes(conclusion)
            ? "passed"
            : "failed",
      href: run.detailsUrl,
      at: time(run.completedAt) ?? time(run.startedAt),
    })
  }
  for (const status of statuses) {
    const state = status.state.toUpperCase()
    const skipped = /Ignored Build Step|Skipped|Not affected/i.test(
      status.description ?? ""
    )
    signals.push({
      name: status.context,
      state: skipped
        ? "skipped"
        : state === "SUCCESS"
          ? "passed"
          : state === "FAILURE" || state === "ERROR"
            ? "failed"
            : "running",
      href: skipped ? null : status.targetUrl,
      at: time(status.createdAt),
    })
  }
  return signals.sort((a, b) => a.name.localeCompare(b.name))
}

/** The head's previews: each deployed environment's newest successful
 *  deployment, production left out. */
function previewsOf(pr: PrNode): { name: string; url: string }[] {
  const nodes = pr.commits.nodes[0]?.commit.deployments?.nodes ?? []
  const seen = new Set<string>()
  const previews: { name: string; url: string }[] = []
  for (const node of nodes) {
    const env = node.environment ?? "Preview"
    if (seen.has(env)) continue
    seen.add(env)
    if (/production/i.test(env)) continue
    const status = node.latestStatus
    if (status?.state.toUpperCase() !== "SUCCESS" || !status.environmentUrl) continue
    previews.push({ name: env, url: status.environmentUrl })
  }
  return previews
}

// ---- The PR body: the pipeline's own markers --------------------------------

/**
 * A gate box, read the way `.icm/_shared/github.md` reads it: find the anchor
 * comment, and the checklist line after it is the gate. Null when the anchor
 * is absent — "not required", never "unticked".
 */
export function gateTicked(body: string, anchor: string): boolean | null {
  const lines = body.split("\n")
  const at = lines.findIndex((line) => line.includes(`<!-- gate:${anchor} -->`))
  if (at === -1) return null
  for (const line of lines.slice(at + 1)) {
    const box = line.match(/^\s*[-*]\s+\[([ xX])\]/)
    if (box) return box[1] !== " "
    if (line.trim() !== "") return null
  }
  return null
}

function isLanePr(pr: PrNode): boolean {
  return (
    pr.labels.nodes.some((label) => LANE_LABELS.has(label.name.toLowerCase())) ||
    /PIPELINE RUN \(lane:/.test(pr.body)
  )
}

/** `blocked: yes — why` from a run's status.md; null when it isn't blocked. */
export function blockedReason(statusMd: string): string | null {
  const m = statusMd.match(/^-\s*blocked:\s*yes\b\s*[—–:-]?\s*(.*)$/im)
  if (!m) return null
  return m[1].trim() || "The run says it is blocked, without saying why."
}

function dateLine(markdown: string, key: string): number | null {
  const m = markdown.match(new RegExp(`^-\\s*${key}:\\s*(\\d{4}-\\d{2}-\\d{2})`, "im"))
  return m ? new Date(`${m[1]}T00:00:00Z`).getTime() : null
}

// ---- Classification ----------------------------------------------------------

type PrFacts = {
  pr: PrNode
  signals: Signal[]
  previews: { name: string; url: string }[]
  slug: string | null
  blocked: { reason: string; updated: number | null } | null
}

/**
 * The one kind a PR is shown as, by precedence — or null when it waits on
 * nobody yet: a draft in Build, checks still running, Ready to merge ticked
 * and waiting on Release. Pure, so the rules can be read in one place.
 */
export function kindOf(facts: PrFacts): GateKind | null {
  const { pr, signals } = facts
  if (facts.blocked) return "blocked"
  const failed = signals.some((s) => s.state === "failed")
  const running = signals.some((s) => s.state === "running")
  if (!pr.isDraft && failed) return "red"
  if (gateTicked(pr.body, "spec-approved") === false) return "spec"
  const green = !failed && !running
  if (!pr.isDraft && green && gateTicked(pr.body, "ready-to-merge") === false) {
    return "merge"
  }
  if (!pr.isDraft && green && isLanePr(pr)) return "lane"
  return null
}

// ---- Ages ----------------------------------------------------------------------

/** When each row started waiting, for the group's order — kept off the row
 *  itself, which carries only what the browser shows. */
const SINCE = new WeakMap<GateRow, number>()

function since(row: GateRow, at: number | null): GateRow {
  SINCE.set(row, at ?? Number.MAX_SAFE_INTEGER)
  return row
}

function ageOf(
  since: number | null,
  now: number,
  granularity: "time" | "day"
): { age: string; ageSpoken: string } {
  if (since === null) return { age: "—", ageSpoken: "Waiting, since when unknown" }
  const ms = Math.max(0, now - since)
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`
  if (granularity === "day") {
    const days = Math.floor(ms / 86_400_000)
    return days === 0
      ? { age: "today", ageSpoken: "Since today" }
      : { age: `${days}d`, ageSpoken: `Waiting ${plural(days, "day")}` }
  }
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return { age: "now", ageSpoken: "Just now" }
  if (minutes < 60) return { age: `${minutes}m`, ageSpoken: `Waiting ${plural(minutes, "minute")}` }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { age: `${hours}h`, ageSpoken: `Waiting ${plural(hours, "hour")}` }
  const days = Math.floor(hours / 24)
  return { age: `${days}d`, ageSpoken: `Waiting ${plural(days, "day")}` }
}

// ---- Links and launches ---------------------------------------------------------

const encodeRef = (ref: string) => ref.split("/").map(encodeURIComponent).join("/")

function fileLink(
  repo: TicketRepo,
  ref: string,
  path: string,
  id: string,
  label: string
): GateLink {
  return {
    id,
    label,
    href: `https://github.com/${repo.fullName}/blob/${encodeRef(ref)}/${path}`,
  }
}

function launchOf(
  repo: TicketRepo,
  label: string,
  prompt: string,
  hint: LaunchHint,
  hintLine: boolean
): GateLaunch | null {
  const entry = primaryLaunch(
    launchesFor({ repoFullName: repo.fullName, prompt, mode: "code", hint, hintLine })
  )
  if (!entry) return null
  return {
    label,
    href: entry.url,
    newTab: launchLinkProps(entry).target === "_blank",
    hint: entry.hint,
    unavailable: entry.unavailableReason,
  }
}

/** The pipeline's executor: Build and Release own a red head (D-41). */
const EXECUTOR_HINT: LaunchHint = {
  tier: HINT_RULES.verb.executorTier,
  effort: HINT_RULES.verb.fallbackEffort,
}
/** `new` opens Define — the advisor pass. */
const DEFINE_HINT: LaunchHint = {
  tier: HINT_RULES.verb.newTier,
  effort: HINT_RULES.verb.fallbackEffort,
}
/** A fix with no stage behind it is sized like a bug. */
const FIX_HINT: LaunchHint = HINT_RULES.prompt.lane.bug

function fixPrompt(repo: TicketRepo, pr: PrNode, failed: Signal[]): string {
  const checks = failed.map((s) => s.name).join(", ")
  return [
    `CI is red on ${repo.fullName} PR #${pr.number} (${pr.url}), branch \`${pr.headRefName}\`.`,
    `Failing: ${checks}.`,
    "Read the failing checks' logs, find the cause and push a fix to that branch. Do not open a new PR.",
  ].join("\n")
}

const SIGNAL_TONE: Record<Signal["state"], GateFact["tone"]> = {
  passed: "ok",
  failed: "fail",
  running: "muted",
  skipped: "muted",
}

function signalFacts(signals: Signal[]): GateFact[] {
  if (signals.length === 0) return [{ label: "Checks", value: "not run", tone: "muted" }]
  return signals.map((s) => ({ label: s.name, value: s.state, tone: SIGNAL_TONE[s.state] }))
}

const TEXT: Record<Exclude<GateKind, "blocked" | "red">, string> = {
  spec: "Read the spec on the PR and tick Spec approved; Build starts only after that.",
  merge: "Smoke the preview, then tick Ready to merge; Release takes it from there.",
  lane: "Lane PRs carry no checkbox: smoke the preview and squash-merge from GitHub.",
  scope:
    "Read the scope and the breakdown on main; when happy, run new to walk the batch into Define.",
}

function prRow(repo: TicketRepo, facts: PrFacts, kind: GateKind, now: number): GateRow {
  const { pr, signals, previews, slug } = facts
  const failed = signals.filter((s) => s.state === "failed")
  const openPr: GateLink = { id: "pr", label: `Open PR #${pr.number}`, href: pr.url }
  const runFile = (file: string, label: string) =>
    fileLink(repo, pr.headRefName, `.icm/runs/${slug}/${file}`, file, label)
  const commitAt = time(pr.commits.nodes[0]?.commit.committedDate)
  const base = {
    key: `gate:${repo.fullName}#${pr.number}`,
    kind,
    title: pr.title,
    repo: repo.slug,
    ref: `#${pr.number}`,
    refLong: `PR #${pr.number}`,
    late: kind === "blocked" || kind === "red",
  }

  if (kind === "blocked") {
    const blocked = facts.blocked!
    return since({
      ...base,
      ...ageOf(blocked.updated, now, "day"),
      text: `Blocked: ${blocked.reason}`,
      facts: [
        { label: "Blocked", value: blocked.reason, tone: "fail" },
        ...signalFacts(signals),
      ],
      primary: runFile("handoff.md", "Read handoff.md"),
      secondary: openPr,
      rest: [runFile("status.md", "Read status.md")],
      launch: null,
    }, blocked.updated)
  }

  if (kind === "red") {
    const firstFailure = failed
      .map((s) => s.at)
      .filter((at): at is number => at !== null)
      .sort((a, b) => a - b)[0]
    const [first, ...others] = failed
    const spine = gateTicked(pr.body, "spec-approved") !== null
    const readyTicked = gateTicked(pr.body, "ready-to-merge") === true
    const launch =
      spine && slug
        ? launchOf(
            repo,
            "Launch a fix session",
            `/pipeline ${readyTicked ? "release" : "build"} ${slug}`,
            EXECUTOR_HINT,
            false
          )
        : launchOf(repo, "Launch a fix session", fixPrompt(repo, pr, failed), FIX_HINT, true)
    return since({
      ...base,
      ...ageOf(firstFailure ?? commitAt, now, "time"),
      text: `${failed.map((s) => s.name).join(", ")} failed on the head.`,
      facts: signalFacts(signals),
      primary: {
        id: "check",
        label: "Open failing check",
        href: first?.href ?? `${pr.url}/checks`,
      },
      secondary: openPr,
      rest: others
        .filter((s) => s.href)
        .map((s) => ({ id: `check-${s.name}`, label: `${s.name} — failed`, href: s.href! })),
      launch,
    }, firstFailure ?? commitAt)
  }

  if (kind === "spec") {
    return since({
      ...base,
      ...ageOf(time(pr.createdAt), now, "time"),
      text: TEXT.spec,
      facts: signalFacts(signals),
      primary: openPr,
      secondary: slug ? runFile("02_define/output/spec.md", "Read spec.md") : null,
      rest: [],
      launch: null,
    }, time(pr.createdAt))
  }

  // Ready to merge, or a green lane PR: the preview is what to smoke.
  const settled = signals
    .map((s) => s.at)
    .filter((at): at is number => at !== null)
    .sort((a, b) => b - a)[0]
  const [preview, ...otherPreviews] = previews
  return since({
    ...base,
    ...ageOf(settled ?? commitAt, now, "time"),
    text: TEXT[kind as "merge" | "lane"],
    facts: signalFacts(signals),
    primary: preview ? { id: "preview", label: "Open preview", href: preview.url } : openPr,
    secondary: preview ? openPr : null,
    rest: otherPreviews.map((p) => ({
      id: `preview-${p.name}`,
      label: p.name,
      href: p.url,
    })),
    launch: null,
  }, settled ?? commitAt)
}

// ---- Scopes and runs on main ------------------------------------------------------

/**
 * What the default branch says is waiting: scopes nobody has taken into Define
 * yet (D-39 — `scope.md` landed, open stubs, and nothing in the epic's
 * `_done/`), and run folders whose status.md says blocked. From Work's own
 * tree read and blob cache; `_done/` is never read, only listed.
 */
async function mainRows(
  repo: TicketRepo,
  entries: TreeEntry[],
  prSlugs: Set<string>,
  now: number
): Promise<GateRow[]> {
  const blobs = new Map(entries.filter((e) => e.type === "blob").map((e) => [e.path, e.sha]))
  const scopes = new Set<string>()
  const runs = new Set<string>()
  const open = new Map<string, number>()
  const done = new Set<string>()
  for (const path of blobs.keys()) {
    const scope = path.match(/^\.icm\/runs\/([^/]+)\/01_scope\/output\/scope\.md$/)
    if (scope) scopes.add(scope[1])
    const status = path.match(/^\.icm\/runs\/([^/]+)\/status\.md$/)
    if (status && status[1] !== "_done") runs.add(status[1])
    const stub = path.match(/^\.icm\/intake\/([^/]+)\/([^/]+)\.md$/)
    if (stub && stub[2].toLowerCase() !== "breakdown") {
      open.set(stub[1], (open.get(stub[1]) ?? 0) + 1)
    }
    const finished = path.match(/^\.icm\/intake\/([^/]+)\/_done\/[^/]+\.md$/)
    if (finished) done.add(finished[1])
  }

  const rows: GateRow[] = []
  const base = { repo: repo.slug, ref: "main", refLong: "main" }

  await Promise.all(
    [...scopes].map(async (slug) => {
      const stubs = open.get(slug) ?? 0
      if (stubs === 0 || done.has(slug) || slug === "_done") return
      const scopePath = `.icm/runs/${slug}/01_scope/output/scope.md`
      const breakdownPath = `.icm/intake/${slug}/breakdown.md`
      const [scopeMd, breakdownMd] = await Promise.all([
        readBlob(repo, blobs.get(scopePath)!),
        blobs.has(breakdownPath) ? readBlob(repo, blobs.get(breakdownPath)!) : null,
      ])
      const heading =
        breakdownMd?.match(/^#\s+(?:Breakdown:\s*)?(.+)$/m)?.[1].trim() ??
        scopeMd?.match(/^#\s+(?:Scope:\s*)?(.+)$/m)?.[1].trim() ??
        slug
      const breakdown = blobs.has(breakdownPath)
      const agreed = scopeMd ? dateLine(scopeMd, "agreed") : null
      rows.push(since({
        ...base,
        key: `gate:${repo.fullName}:scope:${slug}`,
        kind: "scope",
        title: `${heading} — ${stubs} ${stubs === 1 ? "stub" : "stubs"}`,
        late: false,
        ...ageOf(agreed, now, "day"),
        text: TEXT.scope,
        facts: [
          { label: "scope.md", value: "on main", tone: "ok" },
          {
            label: "breakdown.md",
            value: breakdown ? "on main" : "missing",
            tone: breakdown ? "ok" : "fail",
          },
          { label: "Open stubs", value: String(stubs), tone: "plain" },
        ],
        primary: fileLink(repo, "HEAD", scopePath, "scope", "Read scope.md"),
        secondary: breakdown
          ? fileLink(repo, "HEAD", breakdownPath, "breakdown", "Read breakdown.md")
          : null,
        rest: [
          {
            id: "intake",
            label: "The intake folder",
            href: `https://github.com/${repo.fullName}/tree/HEAD/.icm/intake/${slug}`,
          },
        ],
        launch: launchOf(repo, "Launch “new”", "/pipeline new", DEFINE_HINT, false),
      }, agreed))
    })
  )

  // Sustentus archives merged runs outside `_done/` — its runs/ is history,
  // not flight (the board skips it for the same reason).
  if (repo.slug !== "sustentus") {
    await Promise.all(
      [...runs].map(async (slug) => {
        if (prSlugs.has(slug)) return
        const statusPath = `.icm/runs/${slug}/status.md`
        const statusMd = await readBlob(repo, blobs.get(statusPath)!)
        const reason = statusMd ? blockedReason(statusMd) : null
        if (!reason || !statusMd) return
        const updated = dateLine(statusMd, "updated")
        rows.push(since({
          ...base,
          key: `gate:${repo.fullName}:run:${slug}`,
          kind: "blocked",
          title: slug,
          late: true,
          ...ageOf(updated, now, "day"),
          text: `Blocked: ${reason}`,
          facts: [
            { label: "Blocked", value: reason, tone: "fail" },
            { label: "Run", value: `.icm/runs/${slug}`, tone: "plain" },
          ],
          primary: fileLink(repo, "HEAD", `.icm/runs/${slug}/handoff.md`, "handoff.md", "Read handoff.md"),
          secondary: fileLink(repo, "HEAD", statusPath, "status.md", "Read status.md"),
          rest: [],
          launch: null,
        }, updated))
      })
    )
  }
  return rows
}

// ---- The read ----------------------------------------------------------------------

/** status.md at each PR's head commit, for the PRs that name a run: one
 *  query, keyed by commit ids, so it is re-asked only when a PR is pushed. */
async function readRunStatuses(
  wanted: { repo: TicketRepo; oid: string; slug: string; key: string }[]
): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  if (wanted.length === 0) return found
  const byRepo = new Map<string, typeof wanted>()
  for (const w of wanted) {
    byRepo.set(w.repo.fullName, [...(byRepo.get(w.repo.fullName) ?? []), w])
  }
  const repos = [...byRepo.values()]
  await Promise.all(
    chunks(repos, REPOS_PER_QUERY).map(async (group) => {
      const query = `query GateRunStatus {\n${group
        .map(
          (items, r) =>
            `  r${r}: repository(${repoArgs(items[0].repo)}) {\n${items
              .map(
                (w, f) =>
                  `    f${f}: object(expression: ${JSON.stringify(
                    `${w.oid}:.icm/runs/${w.slug}/status.md`
                  )}) { ... on Blob { text } }`
              )
              .join("\n")}\n  }`
        )
        .join("\n")}\n}`
      const answer = await githubGraphql<
        Record<string, Record<string, { text?: string | null } | null> | null>
      >(query, [BOARD_CACHE_TAG, GATES_CACHE_TAG])
      if (!answer.data) return
      group.forEach((items, r) => {
        items.forEach((w, f) => {
          const text = answer.data?.[`r${r}`]?.[`f${f}`]?.text
          if (text) found.set(w.key, text)
        })
      })
    })
  )
  return found
}

async function readGates(): Promise<GatesRead> {
  if (!isBoardConfigured()) return { state: "unconfigured" }

  let roster: Roster
  try {
    roster = await readRoster()
  } catch (err) {
    return {
      state: "failed",
      message: `the repo roster couldn't be read — ${
        err instanceof Error ? err.message : "the database didn't answer"
      }`,
    }
  }
  const repos = roster.repos
  const notes: string[] = []
  if (roster.sweepError) {
    notes.push(`Only the pinned repos were read — ${roster.sweepError}`)
  }

  // Every repo's main tree (scopes, runs on main) needs nothing from the PR
  // answer, so it starts now, beside it. It never rejects.
  const treesRead = Promise.all(repos.map((repo) => readRepoTree(repo)))

  // Pull requests: one query per chunk of repos.
  const pulls = new Map<string, PrNode[]>()
  const answers = await Promise.all(
    chunks(repos, REPOS_PER_QUERY).map(async (group) => {
      const query = `query GatePulls {\n${group
        .map((repo, i) => `  r${i}: repository(${repoArgs(repo)}) { ...gatePulls }`)
        .join("\n")}\n}\n${PR_FIELDS}`
      return {
        group,
        answer: await githubGraphql<Record<string, RepoNode>>(query, [
          BOARD_CACHE_TAG,
          GATES_CACHE_TAG,
        ]),
      }
    })
  )
  const failures = answers.filter((a) => a.answer.failure !== null)
  if (failures.length === answers.length && answers.length > 0) {
    return { state: "failed", message: failures[0].answer.failure! }
  }
  for (const { group, answer } of answers) {
    if (answer.failure !== null) {
      notes.push(
        `${group.map((r) => r.slug).join(", ")} couldn't be read — ${answer.failure}`
      )
      continue
    }
    group.forEach((repo, i) => {
      const node = answer.data[`r${i}`]
      const error = answer.errors.find((e) => e.path?.[0] === `r${i}`)
      if (!node) {
        notes.push(`${repo.slug} couldn't be read — ${error?.message ?? "GitHub returned nothing for it"}`)
        return
      }
      if (node.pullRequests.totalCount > PRS_PER_REPO) {
        notes.push(
          `${repo.slug} has ${node.pullRequests.totalCount} open PRs — only the ${PRS_PER_REPO} most recently updated are read.`
        )
      }
      pulls.set(repo.fullName, node.pullRequests.nodes)
    })
  }

  // Which PRs name a run, and that run's status.md at the head.
  const wanted: { repo: TicketRepo; oid: string; slug: string; key: string }[] = []
  for (const repo of repos) {
    for (const pr of pulls.get(repo.fullName) ?? []) {
      const slug = runSlugOf(pr.body)
      const oid = pr.commits.nodes[0]?.commit.oid
      if (slug && oid) wanted.push({ repo, oid, slug, key: `${repo.fullName}#${pr.number}` })
    }
  }

  const now = Date.now()
  const [statuses, trees] = await Promise.all([readRunStatuses(wanted), treesRead])
  // "As of" is when GitHub answered, not when this render ran: a cached
  // answer served stale while it refreshes carries its own older date.
  const answeredAt = answers
    .map((a) => (a.answer.failure === null ? a.answer.at : null))
    .filter((at): at is number => at !== null)
    .sort((a, b) => a - b)[0]

  const rows: GateRow[] = []
  for (const repo of repos) {
    for (const pr of pulls.get(repo.fullName) ?? []) {
      const statusMd = statuses.get(`${repo.fullName}#${pr.number}`)
      const reason = statusMd ? blockedReason(statusMd) : null
      const facts: PrFacts = {
        pr,
        signals: signalsOf(pr),
        previews: previewsOf(pr),
        slug: runSlugOf(pr.body),
        blocked: reason ? { reason, updated: dateLine(statusMd!, "updated") } : null,
      }
      const kind = kindOf(facts)
      if (!kind) continue
      rows.push(prRow(repo, facts, kind, now))
    }
  }
  await Promise.all(
    repos.map(async (repo, i) => {
      const tree = trees[i]
      if (tree.error) {
        notes.push(`${repo.slug}'s main branch couldn't be read — ${tree.error}`)
        return
      }
      const prSlugs = new Set(
        (pulls.get(repo.fullName) ?? [])
          .map((pr) => runSlugOf(pr.body))
          .filter((slug): slug is string => slug !== null)
      )
      rows.push(...(await mainRows(repo, tree.entries, prSlugs, now)))
    })
  )

  // Oldest first within a kind; a row whose start is unknown goes last.
  rows.sort(
    (a, b) =>
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
      (SINCE.get(a) ?? 0) - (SINCE.get(b) ?? 0) ||
      a.key.localeCompare(b.key)
  )

  return {
    state: "ok",
    rows,
    notes,
    readAt: new Date(answeredAt ?? now).toISOString(),
  }
}

/**
 * The group's read, once per request — read only by the Inbox page (never by
 * the shell's badge: components/inbox-live-count.ts carries its result to
 * the rail and the tab bar instead, so no other screen's render pays for
 * this). Never rejects and never takes longer than READ_BOUND_MS: past that
 * the group says GitHub didn't answer in time, and the rest of the Inbox
 * stands.
 */
export const loadGates = cache(async (): Promise<GatesRead> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const bound = new Promise<GatesRead>((resolve) => {
    timer = setTimeout(
      () =>
        resolve({
          state: "failed",
          message: `GitHub didn't answer within ${READ_BOUND_MS / 1000} seconds.`,
        }),
      READ_BOUND_MS
    )
  })
  try {
    return await Promise.race([
      readGates().catch(
        (err): GatesRead => ({
          state: "failed",
          message: err instanceof Error ? err.message : "the read failed",
        })
      ),
      bound,
    ])
  } finally {
    clearTimeout(timer)
  }
})
