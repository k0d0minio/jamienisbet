"use client"

// The Inbox badge's live override. Client-side navigation never re-renders
// the (app) layout that streamed `countInbox()` into the rail and the tab
// bar (lib/inbox.ts), so without this the badge trails the queue between a
// load, a pull-to-refresh or a server action — the Inbox screen's own read
// is the same rule (lib/inbox.ts → countFollowUps, lib/gates.ts →
// countGates) and costs no extra Neon read. `undefined` means no override:
// the streamed count stands. Cleared on unmount, so leaving the Inbox falls
// back to the last streamed value rather than freezing on a stale live one.

let liveCount: number | undefined
const listeners = new Set<() => void>()

export function setLiveInboxCount(count: number | undefined) {
  liveCount = count
  listeners.forEach((listener) => listener())
}

export function subscribeLiveInboxCount(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getLiveInboxCount() {
  return liveCount
}
