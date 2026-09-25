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
// the list, the pane and back/forward can't disagree. The board itself
// (`lib/tickets.ts` `readBoard()`) already carries every repo section — runs
// included, in urgency order, maintenance built — so these are aliases, not a
// reshaping.
export type ListBatch = BoardBatch
export type ListSection = BoardSection

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

/** The In flight pseudo-batch's own slug (`lib/tickets.ts`'s
 *  `RUNS_BATCH_SLUG`) — reserved so no epic folder can ever take it:
 *  icm-board's triage cut slugifies a title by collapsing every run of non
 *  `[a-z0-9]` into one hyphen and trimming the ends, so a leading underscore
 *  can never survive into a real epic slug. Deliberately NOT "runs" — an epic
 *  titled just that (as this bug proved) would otherwise share a slug with
 *  this pseudo-batch, producing duplicate React keys and an ambiguous
 *  `?b=<repo>/runs`. Kept apart from `RUN_TICKET_PREFIX` below, which can't
 *  move — keep this in sync with `lib/tickets.ts`'s `RUNS_BATCH_SLUG`. */
const RUNS_SLUG = "_runs"

/** The id prefix a run ticket carries (`lib/tickets.ts`: `runs/<slug>`) —
 *  unlike `RUNS_SLUG`, this can't be reserved away: icm-board's `/day` writes
 *  today.md picks against it across every repo, so `batchSlugOf` below
 *  translates it to `RUNS_SLUG` rather than the id prefix moving. */
const RUN_TICKET_PREFIX = "runs"

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

/** `<repo>/<rest>` → its two halves; null when it isn't that shape. */
function splitKey(value: string): [string, string] | null {
  const slash = value.indexOf("/")
  if (slash < 1 || slash === value.length - 1) return null
  return [value.slice(0, slash), value.slice(slash + 1)]
}

/** The batch a ticket id files under, read off the id itself — `epic/slug`,
 *  `triage/slug`, `runs/slug` — so a ticket that has gone still names the
 *  batch to fall back to. A legacy id has no prefix and lives in the backlog.
 *  A run's id keeps the `runs/` prefix (see `RUN_TICKET_PREFIX`) even though
 *  the pseudo-batch's own slug is reserved as `RUNS_SLUG` — translated here
 *  so a stale run always falls back to In flight by identity, never to an
 *  epic that happens to share the word "runs". */
function batchSlugOf(ticketId: string): string {
  const slash = ticketId.indexOf("/")
  const prefix = slash > 0 ? ticketId.slice(0, slash) : "backlog"
  return prefix === RUN_TICKET_PREFIX ? RUNS_SLUG : prefix
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
 *  the same set and can't drift apart. Read off each ticket's state and today
 *  flag rather than its phone group, so a blocked today-pick counts in both —
 *  as Work's desk views count it (lib/tickets.ts `TicketStatus`). */
export function ticketsInGroup(
  board: BoardData,
  group: TicketGroup,
  repoSlug: string | null
): BoardTicket[] {
  const matches = (t: BoardTicket): boolean => {
    switch (group) {
      case "today":
        return t.today
      case "blocked":
        return t.status === "blocked"
      case "in-flight":
        return t.status === "running"
      default:
        return t.group === group
    }
  }
  return inView(board.strip, repoSlug).filter(matches)
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
      // A run in flight is already picked up, so `open` excludes it — this is
      // the backlog: what is still waiting to be picked up.
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

// ---------------------------------------------------------------------------
// The keyboard's view of the list (desktop only — components/use-board-keys.ts).

/** A row list level 0's cursor can rest on: a repo's header, or one of its
 *  batches. `key` is the row's identity across renders; `query` is what
 *  selecting it writes, and what the pane previews while the cursor sits on
 *  it. */
export type CursorRow = {
  key: string
  query: { r: string } | { b: string }
}

/** Level 0's rows in on-screen order: each section's header, then its
 *  batches. */
export function levelZeroRows(sections: ListSection[]): CursorRow[] {
  return sections.flatMap((section) => [
    { key: `r:${section.repo.slug}`, query: { r: section.repo.slug } },
    ...section.batches.map((batch) => {
      const key = batchKey(section, batch)
      return { key: `b:${key}`, query: { b: key } }
    }),
  ])
}

/** What a level-0 row selects — the same resolution a URL gets, so a preview
 *  and a committed selection can't show two different things. */
export function rowSelection(
  sections: ListSection[],
  unreadable: Parameters<typeof resolveSelection>[1],
  row: CursorRow
): Selection {
  const query =
    "r" in row.query
      ? { ticket: null, batch: null, repoSelection: row.query.r }
      : { ticket: null, batch: row.query.b, repoSelection: null }
  return resolveSelection(sections, unreadable, query).selection
}

/** What `c` puts on the clipboard for a selection, and what the toast calls
 *  it — exactly what the view's own copy button would: a ticket's pick-up, a
 *  batch's Copy next. Null where the view has nothing to copy. */
export function copyTarget(
  selection: Selection
): { value: string; what: string } | null {
  const ticket =
    selection.kind === "ticket"
      ? selection.ticket
      : selection.kind === "batch" && selection.batch.next
        ? (selection.batch.tickets.find((t) => t.id === selection.batch.next?.id) ??
          null)
        : null
  if (!ticket?.pickup) return null
  return {
    value: ticket.pickup,
    what: ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt",
  }
}

/** Where `o` goes for a selection — the URL its view's "Open on GitHub"
 *  already uses. Null with nothing selected. */
export function githubUrl(selection: Selection): string | null {
  switch (selection.kind) {
    case "ticket":
      return selection.ticket.htmlUrl
    case "batch":
      return selection.batch.htmlUrl
    case "repo":
      return `https://github.com/${selection.focus.repo.fullName}`
    default:
      return null
  }
}

/** One string per selection — what the pane keys its content on, and what a
 *  piece of client state set under one selection records, so it can tell
 *  when the URL has moved on without it. */
export function selectionKey(selection: Selection): string {
  switch (selection.kind) {
    case "ticket":
      return `t:${ticketKey(selection.ticket)}`
    case "batch":
      return `b:${batchKey(selection.section, selection.batch)}`
    case "repo":
      return `r:${selection.focus.repo.slug}`
    default:
      return "none"
  }
}
