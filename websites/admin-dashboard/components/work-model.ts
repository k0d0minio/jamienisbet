import type { DeskStatus } from "@jamie-nisbet/ui"

import {
  batchKey,
  blockedReason,
  resolveSelection,
  ticketKey,
  type ListBatch,
  type ListSection,
  type RepoFocus,
  type Selection,
} from "@/components/board-model"
import type { BoardQuery } from "@/components/use-board-params"
import type { BoardData, BoardTicket, MaintenanceLauncher } from "@/lib/tickets"

// Work at the desk, as data (spec work-panes §2–§5): the four views, the list
// the URL has open, the ticket open in it, and the rows each pane draws. Pure
// functions of the board and the query, resolved on every render — the URL is
// the one home of what is selected, so the panes and back/forward can't
// disagree. The phone board below `lg` keeps its own model
// (components/board-model.ts); this one reuses its pieces where they fit.

export type WorkView = "next" | "today" | "running" | "blocked"

export const WORK_VIEWS: { view: WorkView; label: string; description: string }[] = [
  { view: "next", label: "Up next", description: "runnable now, across every repo" },
  { view: "today", label: "Today", description: "picked for today in icm-board" },
  { view: "running", label: "Running", description: "a run in flight" },
  { view: "blocked", label: "Blocked", description: "waiting on something" },
]

const isView = (value: string | null): value is WorkView =>
  WORK_VIEWS.some((v) => v.view === value)

/** The In flight pseudo-batch's slug on the phone board (board-model.ts
 *  `RUNS_SLUG`) — at the desk, a link to it means the Running view. */
const RUNS_SLUG = "_runs"

/** What pane two lists. */
export type WorkList =
  | { kind: "view"; view: WorkView }
  | { kind: "batch"; section: ListSection; batch: ListBatch }
  | { kind: "repo"; focus: RepoFocus }

/** A ticket, where it lives. */
export type Located = {
  section: ListSection
  batch: ListBatch
  ticket: BoardTicket
}

export type WorkSelection = {
  list: WorkList
  /** The ticket open in pane three, if one is. */
  ticket: Located | null
}

type Unreadable = {
  errors: BoardData["errors"]
  maintenance: Record<string, MaintenanceLauncher[]>
}

export type WorkQuery = {
  view: string | null
  ticket: string | null
  batch: string | null
  repoSelection: string | null
  /** The phone board's chip filter — at the desk, a way into a repo. */
  repo: string | null
}

const DEFAULT_LIST: WorkList = { kind: "view", view: "next" }

/** Every ticket on the board by its key (`<repo>/<id>`), with where it lives —
 *  runs included, under the In flight pseudo-batch. */
export function locateAll(sections: ListSection[]): Map<string, Located> {
  const all = new Map<string, Located>()
  for (const section of sections) {
    for (const batch of section.batches) {
      for (const ticket of batch.tickets) {
        all.set(ticketKey(ticket), { section, batch, ticket })
      }
    }
  }
  return all
}

/** The query that names a list — what pane one writes. */
export function listQuery(list: WorkList): BoardQuery {
  switch (list.kind) {
    case "view":
      return { v: list.view }
    case "batch":
      return { b: batchKey(list.section, list.batch) }
    case "repo":
      return { r: list.focus.repo.slug }
  }
}

/** One string per list — its identity across renders. */
export function listKey(list: WorkList): string {
  switch (list.kind) {
    case "view":
      return `v:${list.view}`
    case "batch":
      return `b:${batchKey(list.section, list.batch)}`
    case "repo":
      return `r:${list.focus.repo.slug}`
  }
}

/** The list a ticket lives in when a link names only the ticket: its epic,
 *  triage or backlog — or, for a run, the Running view. */
function homeList(located: Located): WorkList {
  if (located.batch.kind === "runs") return { kind: "view", view: "running" }
  return { kind: "batch", section: located.section, batch: located.batch }
}

/** The ticket's batch slug read off its id, as the phone board reads it — so
 *  a ticket that has shipped still names the batch to fall back to. */
function batchSlugOf(ticketId: string): string {
  const slash = ticketId.indexOf("/")
  const prefix = slash > 0 ? ticketId.slice(0, slash) : "backlog"
  return prefix === "runs" ? RUNS_SLUG : prefix
}

/** The list the query names, if it names one that resolves; `undefined` when
 *  it names none, `null` when it names one that is gone. */
function namedList(
  sections: ListSection[],
  unreadable: Unreadable,
  query: WorkQuery
): WorkList | null | undefined {
  if (query.batch) {
    const slash = query.batch.indexOf("/")
    const slug = slash > 0 ? query.batch.slice(slash + 1) : ""
    if (slug === RUNS_SLUG) return { kind: "view", view: "running" }
    const resolved = resolveSelection(sections, unreadable, {
      ticket: null,
      batch: query.batch,
      repoSelection: null,
    }).selection
    return resolved.kind === "batch"
      ? { kind: "batch", section: resolved.section, batch: resolved.batch }
      : null
  }
  if (query.repoSelection) {
    const resolved = resolveSelection(sections, unreadable, {
      ticket: null,
      batch: null,
      repoSelection: query.repoSelection,
    }).selection
    return resolved.kind === "repo" ? { kind: "repo", focus: resolved.focus } : null
  }
  if (query.view) return isView(query.view) ? { kind: "view", view: query.view } : null
  return undefined
}

/**
 * What the query selects at the desk, and the query that says so when the URL
 * doesn't yet (`correction`, for the caller to write over the entry in
 * place). Old and foreign links resolve (spec work-panes §5): a ticket alone
 * opens in its own list; `?b=<repo>/_runs` is the Running view; the phone's
 * `?repo=` chip opens that repo; a ticket since shipped falls back to its
 * batch; anything unknown falls back to Up next.
 */
export function resolveWork(
  sections: ListSection[],
  unreadable: Unreadable,
  query: WorkQuery
): { selection: WorkSelection; correction: BoardQuery | null } {
  const all = locateAll(sections)
  let named = namedList(sections, unreadable, query)
  let stale = named === null
  // The retired chip filter: with no list of its own, it opens its repo.
  if (named === undefined && query.repo) {
    const viaChip = namedList(sections, unreadable, { ...query, repoSelection: query.repo })
    if (viaChip) named = viaChip
  }
  // The query is canonical when it names exactly the list on screen by its
  // own key, and the ticket open in it, and nothing else. A bare `/` is Up
  // next, as it is.
  const canonicalFor = (list: WorkList, ticket: string | null): boolean => {
    const want: BoardQuery = { v: null, b: null, r: null, ...listQuery(list) }
    const bare =
      list.kind === "view" &&
      list.view === "next" &&
      !query.view &&
      !query.batch &&
      !query.repoSelection
    const listOk =
      bare ||
      (query.view === (want.v ?? null) &&
        query.batch === (want.b ?? null) &&
        query.repoSelection === (want.r ?? null))
    return !stale && !query.repo && listOk && query.ticket === ticket
  }

  const result = (list: WorkList, ticket: Located | null) => {
    const key = ticket ? ticketKey(ticket.ticket) : null
    return {
      selection: { list, ticket },
      correction: canonicalFor(list, key)
        ? null
        : { ...listQuery(list), t: key, repo: null },
    }
  }

  if (query.ticket) {
    const located = all.get(query.ticket) ?? null
    if (located) return result(named ?? homeList(located), located)
    // Shipped since the link was made: its batch, else wherever the list
    // said, else Up next.
    stale = true
    const slash = query.ticket.indexOf("/")
    if (slash > 0) {
      const repoSlug = query.ticket.slice(0, slash)
      const fallback = namedList(sections, unreadable, {
        ...query,
        view: null,
        repoSelection: null,
        batch: `${repoSlug}/${batchSlugOf(query.ticket.slice(slash + 1))}`,
      })
      if (fallback) return result(fallback, null)
    }
    return result(named ?? DEFAULT_LIST, null)
  }

  return result(named ?? DEFAULT_LIST, null)
}

/** The phone board's `Selection` for what pane three shows — so the detail
 *  views, `c` and `o` read the desk exactly as they read the phone. A view
 *  with no ticket open shows the estate overview (`none`). */
export function paneSelection(selection: WorkSelection): Selection {
  if (selection.ticket) return { kind: "ticket", ...selection.ticket }
  const { list } = selection
  if (list.kind === "batch") return { kind: "batch", section: list.section, batch: list.batch }
  if (list.kind === "repo") return { kind: "repo", focus: list.focus }
  return { kind: "none" }
}

// ---------------------------------------------------------------------------
// The views.

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
const rank = (t: BoardTicket) =>
  t.priority !== null && t.priority in PRIORITY_RANK ? PRIORITY_RANK[t.priority] : 3

/** Every ticket on the board in board order: repos in urgency order, each
 *  repo's batches in theirs. */
function boardOrder(sections: ListSection[]): BoardTicket[] {
  return sections.flatMap((s) => s.batches.flatMap((b) => b.tickets))
}

/** A view's tickets, in its order (spec work-panes §3). Up next and Blocked
 *  read by priority, then the board's repo order, then sequence; Running in
 *  board order; Today in today.md's own order. */
export function viewTickets(
  board: Pick<BoardData, "sections" | "todayOrder">,
  view: WorkView
): BoardTicket[] {
  const ordered = boardOrder(board.sections)
  const position = new Map(ordered.map((t, i) => [ticketKey(t), i]))
  const byPriority = (a: BoardTicket, b: BoardTicket) =>
    rank(a) - rank(b) || (position.get(ticketKey(a)) ?? 0) - (position.get(ticketKey(b)) ?? 0)
  switch (view) {
    case "next":
      // An unmigrated legacy ticket has no epic to be next in; it waits in its
      // repo's Backlog rather than flooding the estate's Up next.
      return ordered
        .filter((t) => t.status === "next" && t.kind !== "legacy")
        .sort(byPriority)
    case "blocked":
      return ordered.filter((t) => t.status === "blocked").sort(byPriority)
    case "running":
      return ordered.filter((t) => t.status === "running")
    case "today": {
      const byKey = new Map(ordered.map((t) => [ticketKey(t), t]))
      return board.todayOrder
        .map((key) => byKey.get(key))
        .filter((t): t is BoardTicket => t !== undefined)
    }
  }
}

// ---------------------------------------------------------------------------
// Pane two's rows.

/** One row of pane two. Only a `ticket` row can be selected; a `done` row is
 *  an epic's finished stub (its file is never read); a `heading` groups a
 *  repo's list by epic. */
export type PaneRow =
  | {
      kind: "ticket"
      key: string
      ticket: BoardTicket
      /** Set in an epic's own list, before the title. */
      sequence: number | null
      /** The mono `repo / epic · n of m` line — estate views only. */
      line: string | null
    }
  | { kind: "done"; key: string; title: string; sequence: number | null }
  | { kind: "heading"; key: string; title: string }

/** The mono line an estate-view row carries: where the ticket lives, and its
 *  place there. */
export function whereLine(ticket: BoardTicket): string {
  const repo = ticket.repo.slug
  if (ticket.kind === "run") {
    const origin = ticket.origin
    if (!origin) return `${repo} / run`
    const place =
      origin.sequence !== null && origin.sequenceTotal !== null
        ? ` · ${origin.sequence} of ${origin.sequenceTotal}`
        : ""
    return `${repo} / ${origin.epic}${place}`
  }
  if (ticket.kind === "legacy") return `${repo} / backlog`
  if (ticket.batch === "triage")
    return ticket.lane ? `${repo} / triage · ${ticket.lane}` : `${repo} / triage`
  const place =
    ticket.sequence !== null && ticket.sequenceTotal !== null
      ? ` · ${ticket.sequence} of ${ticket.sequenceTotal}`
      : ""
  return `${repo} / ${ticket.batch}${place}`
}

/** The note a row carries under its title: why it is blocked, or what is
 *  running. Null for every other row. */
export function rowNote(ticket: BoardTicket): { tone: "blocked" | "running"; text: string } | null {
  if (ticket.status === "blocked") {
    const reason = blockedReason(ticket)
    return reason ? { tone: "blocked", text: reason } : null
  }
  if (ticket.status === "running") {
    const text =
      ticket.runStage === "lane"
        ? "Lane — PR open for your merge"
        : ticket.runStage === "release"
          ? "Release next"
          : "Build next"
    return { tone: "running", text }
  }
  return null
}

/** An epic's rows, in sequence: open and running rows open their ticket, done
 *  rows are dimmed and open nothing. */
function epicRows(
  section: ListSection,
  batch: ListBatch,
  all: Map<string, Located>,
  includeDone: boolean
): PaneRow[] {
  const rows: PaneRow[] = []
  for (const row of batch.rows ?? []) {
    const located = row.ticketId ? all.get(`${section.repo.slug}/${row.ticketId}`) : undefined
    if (located) {
      rows.push({
        kind: "ticket",
        key: ticketKey(located.ticket),
        ticket: located.ticket,
        sequence: row.sequence,
        line: null,
      })
    } else if (row.state === "done" && includeDone) {
      rows.push({
        kind: "done",
        key: `done:${section.repo.slug}/${batch.slug}/${row.slug}`,
        title: row.title,
        sequence: row.sequence,
      })
    }
  }
  return rows
}

/** Pane two's rows for a list. */
export function paneRows(
  board: Pick<BoardData, "sections" | "todayOrder">,
  list: WorkList
): PaneRow[] {
  const all = locateAll(board.sections)
  const ticketRow = (ticket: BoardTicket, line: boolean): PaneRow => ({
    kind: "ticket",
    key: ticketKey(ticket),
    ticket,
    sequence: null,
    line: line ? whereLine(ticket) : null,
  })

  switch (list.kind) {
    case "view":
      return viewTickets(board, list.view).map((t) => ticketRow(t, true))
    case "batch":
      return list.batch.kind === "epic"
        ? epicRows(list.section, list.batch, all, true)
        : list.batch.tickets.map((t) => ticketRow(t, list.batch.kind === "runs"))
    case "repo": {
      const section = list.focus.section
      if (!section) return []
      const rows: PaneRow[] = []
      const shown = new Set<string>()
      for (const batch of section.batches) {
        if (batch.kind === "runs") continue
        const members =
          batch.kind === "epic"
            ? epicRows(section, batch, all, false)
            : batch.tickets.map((t) => ticketRow(t, false))
        if (members.length === 0) continue
        rows.push({ kind: "heading", key: `h:${batch.slug}`, title: batch.title })
        for (const row of members) {
          rows.push(row)
          shown.add(row.key)
        }
      }
      // Runs that belong to no epic still on the list (a lane's, an unmatched
      // one) close the repo's list under their own heading.
      const loose = (section.batches.find((b) => b.kind === "runs")?.tickets ?? []).filter(
        (t) => !shown.has(ticketKey(t))
      )
      if (loose.length > 0) {
        rows.push({ kind: "heading", key: "h:_runs", title: "Running" })
        rows.push(...loose.map((t) => ticketRow(t, true)))
      }
      return rows
    }
  }
}

/** A row's dot. */
export function deskStatus(ticket: BoardTicket): DeskStatus {
  return ticket.status
}

// ---------------------------------------------------------------------------
// Pane one's entries.

/** One entry of pane one, in on-screen order: the views, then each repo with
 *  (unfolded) its epics, Triage and Backlog. `list` is what opening it shows. */
export type NavEntry =
  | { kind: "view"; key: string; view: WorkView; count: number }
  | {
      kind: "repo"
      key: string
      slug: string
      open: number
      /** Its read failed — its view says what GitHub said. */
      failed: boolean
      /** Holds at least one batch to fold. */
      foldable: boolean
    }
  | {
      kind: "batch"
      key: string
      repo: string
      slug: string
      title: string
      /** `done/total` for an epic, the open count for a pile. */
      figure: string
      query: string
    }

/** Pane one's entries. `expanded` says which repos are unfolded. */
export function navEntries(
  board: Pick<BoardData, "sections" | "todayOrder" | "errors">,
  expanded: (slug: string) => boolean
): NavEntry[] {
  const entries: NavEntry[] = WORK_VIEWS.map(({ view }) => ({
    kind: "view",
    key: `v:${view}`,
    view,
    count: viewTickets(board, view).length,
  }))
  const sectioned = new Set(board.sections.map((s) => s.repo.slug))
  for (const section of board.sections) {
    const slug = section.repo.slug
    const batches = section.batches.filter((b) => b.kind !== "runs")
    entries.push({
      kind: "repo",
      key: `r:${slug}`,
      slug,
      open: section.open,
      failed: board.errors.some((e) => e.repo.slug === slug),
      foldable: batches.length > 0,
    })
    if (!expanded(slug)) continue
    for (const batch of batches) {
      const key = batchKey(section, batch)
      entries.push({
        kind: "batch",
        key: `b:${key}`,
        repo: slug,
        slug: batch.slug,
        title: batch.title,
        figure:
          batch.kind === "epic" && batch.planned !== null
            ? `${batch.done}/${batch.planned}`
            : String(batch.tickets.length),
        query: key,
      })
    }
  }
  // A repo whose read failed has no section; it is still listed, its view
  // the way to what GitHub said.
  for (const error of board.errors) {
    if (sectioned.has(error.repo.slug)) continue
    entries.push({
      kind: "repo",
      key: `r:${error.repo.slug}`,
      slug: error.repo.slug,
      open: 0,
      failed: true,
      foldable: false,
    })
  }
  return entries
}

/** The query opening a pane-one entry writes. */
export function entryQuery(entry: NavEntry): BoardQuery {
  switch (entry.kind) {
    case "view":
      return { v: entry.view }
    case "repo":
      return { r: entry.slug }
    case "batch":
      return { b: entry.query }
  }
}

/** The pane-one entry that shows a list — for its highlight. */
export function entryKeyOf(list: WorkList): string {
  return listKey(list)
}
