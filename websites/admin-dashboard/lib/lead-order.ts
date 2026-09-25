// The leads list's order, handed to the profile for j / k (D-24).
//
// The list is the one screen that knows what order the operator is looking at
// — its filter, its view, a crack, whatever sort it grows — so it records the
// ids it rendered, in order, and the profile reads them back to find a lead's
// neighbours. Session storage and nothing else: it is per tab, it dies with
// the tab, and no list query runs twice. A profile opened from anywhere else
// (a link, the palette, the Inbox, Work) finds itself missing from the stored
// order and simply has no j / k.
//
// Storage can be absent or refuse (a private window, blocked site data), so
// every access is guarded and a failure reads as "no order".

const KEY = "jn:lead-order"

/** Record the ids the leads list rendered, in the order it rendered them. */
export function writeLeadOrder(ids: readonly string[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // No storage: the profile will find no order, which it handles.
  }
}

/** The stored order as the raw string, or null — a stable snapshot for
 *  `useSyncExternalStore` (a string compares equal to itself; a fresh array
 *  would not). */
export function readLeadOrderSnapshot(): string | null {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** The ids in a stored snapshot, or null when it is absent or malformed. */
export function parseLeadOrder(raw: string | null): string[] | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) &&
      parsed.every((id): id is string => typeof id === "string")
      ? parsed
      : null
  } catch {
    return null
  }
}

export type LeadPosition = {
  /** 1-based, for "3 of 12". */
  index: number
  total: number
  previous: string | null
  next: string | null
}

/** Where `id` sits in `order`, or null when it isn't there. Pure. */
export function leadPosition(
  order: readonly string[] | null,
  id: string
): LeadPosition | null {
  if (!order) return null
  const at = order.indexOf(id)
  if (at === -1) return null
  return {
    index: at + 1,
    total: order.length,
    previous: at > 0 ? order[at - 1] : null,
    next: at < order.length - 1 ? order[at + 1] : null,
  }
}
