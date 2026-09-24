import type {
  BoardBatch,
  BoardData,
  BoardSection,
  BoardTicket,
  TicketGroup,
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

export type Selection =
  | { kind: "none" }
  | { kind: "repo"; section: ListSection }
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
    if (section) return { selection: { kind: "repo", section }, correction: null }
    return { selection: { kind: "none" }, correction: { r: null } }
  }

  return { selection: { kind: "none" }, correction: null }
}

/** The masthead figures the estate overview sets, for the repos in view. A
 *  figure of nothing is omitted rather than set as a zero: no blocked stubs is
 *  not news, it is a good day. */
export function boardFigures(
  board: BoardData,
  repoSlug: string | null
): { key: string; value: number; label: string }[] {
  const inView = <T extends { repo: { slug: string } }>(rows: T[]) =>
    repoSlug ? rows.filter((r) => r.repo.slug === repoSlug) : rows
  const inGroup = (group: TicketGroup): number =>
    inView(board.strip).filter((t) => t.group === group).length

  return [
    { key: "today", value: inGroup("today"), label: "Today" },
    { key: "blocked", value: inGroup("blocked"), label: "Blocked" },
    {
      key: "open",
      // A run in flight is already picked up, so `open` excludes it — this is
      // the backlog: what is still waiting to be picked up.
      value: inView(board.sections).reduce((total, s) => total + s.open, 0),
      label: "Open",
    },
  ].filter((f) => f.value > 0)
}
