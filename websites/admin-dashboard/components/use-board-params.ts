"use client"

import { useSearchParams } from "next/navigation"
import { useCallback } from "react"

// The tickets board's URL state, written with the History API rather than a
// navigation. The App Router folds `pushState` into `useSearchParams`, so a
// tap re-renders the board from the data it already holds: no request, no
// skeleton, and back/forward still step through what you looked at. A `<Link>`
// here would re-read the whole estate on every tap, which is what the board
// used to do.
//
// Two independent things live in the query:
//
// - `repo` — the retired phone chip rail's filter, still read so an old link
//   opens its repo (work-model.ts corrects it to `r`).
// - the selection: `t` (a ticket, `<repo>/<ticket id>`), `b` (a batch — an
//   epic, triage, backlog or `_runs` for In flight, `<repo>/<slug>`), `r` (a
//   repo) or `v` (one of Work's views, or the phone's Repos segment —
//   components/work-model.ts). Naming any of them replaces all of them, so a
//   caller states the whole selection: a list (`v`, `b` or `r`) and, beside
//   it, the ticket open in it (`t`). The desk draws the list in pane two and
//   the ticket in pane three; the phone draws the list as a level and the
//   ticket as the reader pushed over it — one key for both. `pane`, the flag
//   that once pushed a batch's view over its list on a phone, is retired: an
//   old link still carrying it is corrected, and any new selection clears it
//   with the rest.
//
// Every entry the board pushes remembers the query it was pushed from, so a
// back affordance can tell "the previous entry is exactly where I'm going" —
// then it is `history.back()`, and the browser's own back and the app's agree —
// from a cold deep link, where there is nothing behind it but the page you
// arrived from, and it pushes the parent instead.

export type BoardQuery = {
  repo?: string | null
  v?: string | null
  t?: string | null
  b?: string | null
  r?: string | null
  /** Retired — only ever cleared. */
  pane?: null
}

const SELECTION_KEYS = ["v", "t", "b", "r"] as const

/** The history-state key holding the query an entry was pushed from. */
const PREV_KEY = "jnBoardPrev"

/** A query string in one canonical order, so two spellings of the same state
 *  compare equal — `?v=next` with nothing else is the bare `/`, as Work
 *  reads it. */
function canonical(search: string): string {
  const params = new URLSearchParams(search)
  if (params.get("v") === "next" && [...params.keys()].length === 1) params.delete("v")
  params.sort()
  return params.toString()
}

/** The URL for `next` applied over the current query. Any selection key in
 *  `next` replaces the whole selection; `repo` is left alone unless named. */
function queryFor(next: BoardQuery): string {
  const params = new URLSearchParams(window.location.search)
  const touchesSelection = SELECTION_KEYS.some((key) => key in next)
  if (touchesSelection) {
    for (const key of SELECTION_KEYS) params.delete(key)
    // The retired `pane` flag goes with any new selection, but clearing it
    // alone (`{ pane: null }`) leaves the selection where it is.
    params.delete("pane")
  }
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  return params.toString()
}

/** The query the current entry was pushed from, if the board pushed it. */
function pushedFrom(): string | null {
  const state: unknown = window.history.state
  if (!state || typeof state !== "object" || !(PREV_KEY in state)) return null
  const prev = (state as Record<string, unknown>)[PREV_KEY]
  return typeof prev === "string" ? prev : null
}

// Only our own key goes in: the App Router copies its internal state into
// whatever is passed and syncs `useSearchParams` from the URL — unless the
// object already carries its internals, in which case it takes the call as
// its own and skips the sync. So never hand it `history.state` back.
function write(query: string, replace: boolean) {
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname
  if (replace) {
    // A correction to the entry already on screen keeps what it was pushed
    // from — it is still the same step back.
    const prev = pushedFrom()
    window.history.replaceState(prev === null ? null : { [PREV_KEY]: prev }, "", url)
    return
  }
  window.history.pushState(
    { [PREV_KEY]: canonical(window.location.search) },
    "",
    url
  )
}

export function useBoardParams() {
  const params = useSearchParams()

  /** Push `next` as a new history entry — a tap on the board. */
  const navigate = useCallback((next: BoardQuery) => {
    write(queryFor(next), false)
  }, [])

  /** Rewrite the current entry — a stale deep link corrected in place. */
  const correct = useCallback((next: BoardQuery) => {
    write(queryFor(next), true)
  }, [])

  /** Go back to `parent`: a real history step when that is where the entry
   *  came from, otherwise a push of the parent. */
  const back = useCallback((parent: BoardQuery) => {
    const target = queryFor(parent)
    if (pushedFrom() === canonical(target)) window.history.back()
    else write(target, false)
  }, [])

  /** Step back to the entry that pushed this one when the board pushed it —
   *  wherever that was — otherwise push `parent`. The phone's back: the
   *  level named on its button is the one it lands on (spec work-phone §5). */
  const pop = useCallback((parent: BoardQuery) => {
    if (pushedFrom() !== null) window.history.back()
    else write(queryFor(parent), false)
  }, [])

  return {
    repo: params.get("repo"),
    view: params.get("v"),
    ticket: params.get("t"),
    batch: params.get("b"),
    repoSelection: params.get("r"),
    /** The URL still carries the retired `pane` flag. */
    stalePane: params.has("pane"),
    navigate,
    correct,
    back,
    pop,
  }
}

/** The query the entry on screen was pushed from, when the board pushed it —
 *  read after a render, never during one (the server has no history). */
export function pushedFromQuery(): string | null {
  return pushedFrom()
}
