"use client"

// The Inbox's exact combined total (follow-ups + gates) — the only place it
// exists, since only the Inbox page reads GitHub's gates (lib/gates.ts →
// loadGates). The layout streams the follow-ups count alone (lib/inbox.ts →
// countFollowUps, cheap and Neon-only) on every render, including every
// screen's own pull-to-refresh; this module remembers the last combined
// total the Inbox actually read and hands it to the rail and the tab bar
// instead, so no other screen's refresh pays for the GitHub read just to
// show a number.
//
// It survives leaving the Inbox — a client-side navigation never re-renders
// the (app) layout that streamed the follow-ups count in, so there is
// nothing to fall back to that isn't stale — and a reload in this tab
// (sessionStorage). `undefined` means this tab has never read the Inbox at
// all: the streamed follow-ups count stands alone until it has.

const STORAGE_KEY = "jn-admin:inbox:live-count"

function readStored(): number | undefined {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw === null ? undefined : Number(raw)
  } catch {
    return undefined
  }
}

let liveCount: number | undefined =
  typeof window === "undefined" ? undefined : readStored()
const listeners = new Set<() => void>()

export function setLiveInboxCount(count: number | undefined) {
  liveCount = count
  try {
    if (count === undefined) window.sessionStorage.removeItem(STORAGE_KEY)
    else window.sessionStorage.setItem(STORAGE_KEY, String(count))
  } catch {
    // Storage can refuse (a private window, blocked site data) — the copy in
    // memory still carries it for the rest of this tab's life.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeLiveInboxCount(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getLiveInboxCount() {
  return liveCount
}
