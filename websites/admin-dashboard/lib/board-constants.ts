// Values shared between `lib/tickets.ts` (server-only — it holds the
// `GITHUB_TOKEN` reads) and the client-safe board/work models
// (`components/board-model.ts`, `components/work-model.ts`, both bundled into
// "use client" screens). Kept in their own file, with no `server-only` tag,
// so both sides import the same definition instead of each carrying a copy
// that has to be kept in step by hand.

/** The In flight pseudo-batch's slug — reserved so no epic folder can ever
 *  take it: icm-board's triage cut slugifies a title by collapsing every run
 *  of non `[a-z0-9]` into one hyphen and trimming the ends, so a leading
 *  underscore can never survive into a real epic slug. Deliberately NOT
 *  "runs" — an epic titled just that would otherwise share this slug,
 *  producing duplicate batch keys and an ambiguous `?b=<repo>/runs`. A run
 *  ticket's own id keeps the unrelated `runs/<slug>` prefix regardless (see
 *  `board-model.ts`'s `RUN_TICKET_PREFIX`) — that one can't move, since
 *  icm-board's `/day` writes today.md picks against it across every repo. */
export const RUNS_SLUG = "_runs"

export const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

/** Lowest first; anything without a P0–P2 priority ranks behind all three. */
export function rank(t: { priority: string | null }): number {
  return t.priority !== null && t.priority in PRIORITY_RANK ? PRIORITY_RANK[t.priority] : 3
}
