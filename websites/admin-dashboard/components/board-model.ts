import type {
  BoardBatch,
  BoardData,
  BoardSection,
  BoardTicket,
  MaintenanceLauncher,
  TicketGroup,
  TicketRepo,
} from "@/lib/tickets"

import type { BoardQuery } from "@/components/use-board-params"

// The board's shape as the list reads it, and what the URL has selected in it.
// Pure functions of the board and the query: the board component resolves the
// selection from the URL on every render, never from a copy of it in state, so
// the list, the pane and back/forward can't disagree.

/** The In flight pseudo-batch's slug — a run's id is `runs/<slug>`, so a run
 *  resolves to it by the same prefix rule as a stub to its epic. */
const RUNS_SLUG = "runs"

/** A row on list level 0: a lib batch, or In flight — the runs that belong to
 *  no batch and used to live on the now-strip. */
export type ListBatch = Omit<BoardBatch, "kind"> & {
  kind: BoardBatch["kind"] | "runs"
}

export type ListSection = Omit<BoardSection, "batches"> & {
  batches: ListBatch[]
}

/** A repo as its view shows it. A repo whose read failed has no tickets and so
 *  no section, but it still has a view — its error in full, its client, its
 *  maintenance — reached from its row in the estate overview. */
export type RepoFocus = {
  repo: TicketRepo
  /** Its section on list level 0; null for a repo that couldn't be read. */
  section: ListSection | null
  /** What GitHub said when this repo's read failed, in full. */
  error: string | null
  maintenance: MaintenanceLauncher[]
}

export type Selection =
  | { kind: "none" }
  | { kind: "repo"; focus: RepoFocus }
  | { kind: "batch"; section: ListSection; batch: ListBatch }
  | {
      kind: "ticket"
      section: ListSection
      batch: ListBatch
      ticket: BoardTicket
    }

export const ticketKey = (ticket: BoardTicket) =>
  `${ticket.repo.slug}/${ticket.id}`

export const batchKey = (section: ListSection, batch: ListBatch) =>
  `${section.repo.slug}/${batch.slug}`

/** The repo a selection sits in; null when nothing is selected. */
export function selectedRepoSlug(selection: Selection): string | null {
  if (selection.kind === "none") return null
  if (selection.kind === "repo") return selection.focus.repo.slug
  return selection.section.repo.slug
}

/** Section order is urgency, as the server orders it (lib/tickets
 *  `sectionUrgency`): a today-pick, then something blocked, then a run in
 *  flight, then the rest — by name within each. Recomputed here only because
 *  a repo whose one open item is a run has no server section to sort. */
function urgency(section: ListSection): number {
  // The server ranks a repo on its batches alone — a run picked for today
  // counts as "a run in flight" there, not as a today-pick — so In flight's
  // own dots are left out of the rank, or the two orders would disagree.
  const batches = section.batches.filter((b) => b.kind !== "runs")
  if (batches.some((b) => b.todayCount > 0)) return 0
  if (batches.some((b) => b.blockedCount > 0)) return 1
  if (batches.length < section.batches.length) return 2
  return 3
}

/**
 * The server's sections plus an In flight row for every repo with runs —
 * appended after Triage and Backlog, and given a section of its own where a
 * repo has nothing but runs open. `extraMaintenance` carries the maintenance
 * launchers for those run-only repos, which `readBoard()` builds only for the
 * sections it returns.
 */
export function listSections(
  board: BoardData,
  extraMaintenance: Record<string, MaintenanceLauncher[]>
): ListSection[] {
  const runsByRepo = new Map<string, BoardTicket[]>()
  for (const ticket of board.strip) {
    if (ticket.kind !== "run") continue
    const list = runsByRepo.get(ticket.repo.fullName) ?? []
    list.push(ticket)
    runsByRepo.set(ticket.repo.fullName, list)
  }

  const runsBatch = (runs: BoardTicket[]): ListBatch => {
    const repo = runs[0].repo
    return {
      slug: RUNS_SLUG,
      kind: "runs",
      title: "In flight",
      htmlUrl: `https://github.com/${repo.fullName}/tree/HEAD/.icm/runs`,
      planned: null,
      done: 0,
      tickets: [...runs].sort((a, b) => a.id.localeCompare(b.id)),
      next: null,
      recut: null,
      // A run can be picked for today (today.md names `runs/<slug>`), and the
      // row carries that dot the way an epic's row does.
      todayCount: runs.filter((t) => t.group === "today").length,
      blockedCount: runs.filter((t) => t.group === "blocked").length,
      p0Count: 0,
    }
  }

  const sections: ListSection[] = board.sections.map((section) => {
    const runs = runsByRepo.get(section.repo.fullName)
    runsByRepo.delete(section.repo.fullName)
    return {
      ...section,
      batches: runs ? [...section.batches, runsBatch(runs)] : section.batches,
    }
  })
  for (const [fullName, runs] of runsByRepo) {
    sections.push({
      repo: runs[0].repo,
      batches: [runsBatch(runs)],
      open: 0,
      maintenance: extraMaintenance[fullName] ?? [],
    })
  }

  return sections
    .map((section, index) => ({ section, index }))
    .sort(
      (a, b) =>
        urgency(a.section) - urgency(b.section) ||
        a.section.repo.slug.localeCompare(b.section.repo.slug) ||
        a.index - b.index
    )
    .map(({ section }) => section)
}

/** `<repo>/<rest>` → its two halves; null when it isn't that shape. */
function splitKey(value: string): [string, string] | null {
  const slash = value.indexOf("/")
  if (slash < 1 || slash === value.length - 1) return null
  return [value.slice(0, slash), value.slice(slash + 1)]
}

/** The batch a ticket id files under, read off the id itself — `epic/slug`,
 *  `triage/slug`, `runs/slug` — so a ticket that has gone still names the
 *  batch to fall back to. A legacy id has no prefix and lives in the backlog. */
function batchSlugOf(ticketId: string): string {
  const slash = ticketId.indexOf("/")
  return slash > 0 ? ticketId.slice(0, slash) : "backlog"
}

/**
 * What the query selects. A selection that no longer resolves — a ticket
 * shipped since the link was made, a batch finished, a repo gone quiet —
 * falls back to its batch, else to nothing, and `correction` is the query
 * that says so, for the caller to write over the stale entry. Precedence, if
 * a hand-made URL names several: ticket, then batch, then repo.
 */
export function resolveSelection(
  sections: ListSection[],
  unreadable: { errors: BoardData["errors"]; maintenance: Record<string, MaintenanceLauncher[]> },
  query: { ticket: string | null; batch: string | null; repoSelection: string | null }
): { selection: Selection; correction: BoardQuery | null } {
  const sectionOf = (repoSlug: string) =>
    sections.find((s) => s.repo.slug === repoSlug) ?? null
  const batchOf = (section: ListSection, slug: string) =>
    section.batches.find((b) => b.slug === slug) ?? null

  if (query.ticket) {
    const key = splitKey(query.ticket)
    const section = key ? sectionOf(key[0]) : null
    if (key && section) {
      for (const batch of section.batches) {
        const ticket = batch.tickets.find((t) => t.id === key[1])
        if (ticket) {
          return {
            selection: { kind: "ticket", section, batch, ticket },
            correction: null,
          }
        }
      }
      const batch = batchOf(section, batchSlugOf(key[1]))
      if (batch) {
        return {
          selection: { kind: "batch", section, batch },
          correction: { b: batchKey(section, batch) },
        }
      }
    }
    return { selection: { kind: "none" }, correction: { t: null } }
  }

  if (query.batch) {
    const key = splitKey(query.batch)
    const section = key ? sectionOf(key[0]) : null
    const batch = key && section ? batchOf(section, key[1]) : null
    if (section && batch) {
      return { selection: { kind: "batch", section, batch }, correction: null }
    }
    return { selection: { kind: "none" }, correction: { b: null } }
  }

  if (query.repoSelection) {
    const section = sectionOf(query.repoSelection)
    const failed =
      unreadable.errors.find((e) => e.repo.slug === query.repoSelection) ?? null
    const repo = section?.repo ?? failed?.repo
    if (repo) {
      const focus: RepoFocus = {
        repo,
        section,
        error: failed?.message ?? null,
        maintenance: section?.maintenance ?? unreadable.maintenance[repo.fullName] ?? [],
      }
      return { selection: { kind: "repo", focus }, correction: null }
    }
    return { selection: { kind: "none" }, correction: { r: null } }
  }

  return { selection: { kind: "none" }, correction: null }
}

export type Figure = { key: string; value: number; label: string }

/** The rows for the repo in view — every repo when there is no filter. */
function inView<T extends { repo: { slug: string } }>(
  rows: T[],
  repoSlug: string | null
): T[] {
  return repoSlug ? rows.filter((r) => r.repo.slug === repoSlug) : rows
}

/** The estate's tickets in one group, for the repo in view, in board order.
 *  The strip holds every today-pick, run and blocked ticket, so it is the one
 *  place these are counted — the figures and the overview's Blocked rows read
 *  the same set and can't drift apart. */
export function ticketsInGroup(
  board: BoardData,
  group: TicketGroup,
  repoSlug: string | null
): BoardTicket[] {
  return inView(board.strip, repoSlug).filter((t) => t.group === group)
}

/** The masthead figures the estate overview sets, for the repos in view. A
 *  figure of nothing is omitted rather than set as a zero: no blocked stubs is
 *  not news, it is a good day. */
export function boardFigures(board: BoardData, repoSlug: string | null): Figure[] {
  return [
    { key: "today", value: ticketsInGroup(board, "today", repoSlug).length, label: "Today" },
    {
      key: "blocked",
      value: ticketsInGroup(board, "blocked", repoSlug).length,
      label: "Blocked",
    },
    {
      key: "open",
      // Runs in flight sit in no batch, so this is the backlog: what is
      // still waiting to be picked up.
      value: inView(board.sections, repoSlug).reduce((total, s) => total + s.open, 0),
      label: "Open",
    },
  ].filter((f) => f.value > 0)
}

/** One repo's figures for its view — the estate's, narrowed to it, plus the
 *  runs it has in flight. Zeros omitted, as on the overview. */
export function repoFigures(board: BoardData, focus: RepoFocus): Figure[] {
  const slug = focus.repo.slug
  const runs =
    focus.section?.batches.find((b) => b.kind === "runs")?.tickets.length ?? 0
  return [
    { key: "open", value: focus.section?.open ?? 0, label: "Open" },
    { key: "today", value: ticketsInGroup(board, "today", slug).length, label: "Today" },
    {
      key: "blocked",
      value: ticketsInGroup(board, "blocked", slug).length,
      label: "Blocked",
    },
    { key: "runs", value: runs, label: "In flight" },
  ].filter((f) => f.value > 0)
}

/** Why a blocked ticket is stuck, in its own words: the stub's `blocked:`
 *  line, else the stub ahead of it that is still open. */
export function blockedReason(ticket: BoardTicket): string | null {
  const said = ticket.meta.find(([key]) => key === "Blocked")?.[1]
  if (said) return said
  const waiting = ticket.meta.find(([key]) => key === "Waiting on")?.[1]
  return waiting ? `Waiting on ${waiting}` : null
}
