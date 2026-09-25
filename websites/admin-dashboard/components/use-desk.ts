"use client"

import { useSyncExternalStore } from "react"

// Is Work at the desk? Tailwind's `lg` (1024px): from there Work is three
// panes (components/work-desk.tsx), under it the phone board
// (components/tickets-board.tsx) until `work-phone` replaces it.
//
// Null on the server and through hydration, where the width isn't known —
// the caller renders both layouts behind their CSS breakpoints then, so the
// first paint is right at either width, and keeps only one once this settles.

export const DESK_QUERY = "(min-width: 64rem)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESK_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function useDesk(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESK_QUERY).matches,
    () => null
  )
}
