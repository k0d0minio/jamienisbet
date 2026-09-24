"use client"

import { useSearchParams } from "next/navigation"
import { useCallback } from "react"

// The tickets board's URL state — the repo filter (`?repo=`) and the selected
// ticket (`?t=<repo>/<epic>/<slug>`) — written with the History API rather
// than a navigation. The App Router folds `pushState` into `useSearchParams`,
// so a filter tap re-renders the board from the data it already holds: no
// request, no skeleton, and back/forward still step through what you looked
// at. A `<Link>` here would re-read the whole estate on every tap, which is
// what the board used to do.
//
// Nothing reads `t` yet — the master–detail layout wires it in (stub 2 of
// tickets-master-detail); it lives here so the board has one owner of its URL.
export function useBoardParams() {
  const params = useSearchParams()

  const set = useCallback((key: "repo" | "t", value: string | null) => {
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    const query = next.toString()
    window.history.pushState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    )
  }, [])

  return {
    repo: params.get("repo"),
    ticket: params.get("t"),
    setRepo: useCallback((slug: string | null) => set("repo", slug), [set]),
    setTicket: useCallback((id: string | null) => set("t", id), [set]),
  }
}
