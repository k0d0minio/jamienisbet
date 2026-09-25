// The leads list's order, handed to the profile for j / k (D-24).
//
// The list is the one screen that knows what order the operator is looking at
// — its filter, its view, a crack, whatever sort it grows — so it records the
// ids it rendered, in order, and the profile reads them back to find a lead's
// neighbours. Session storage and nothing else: it is per tab, it dies with
// the tab, and no list query runs twice.
//
// The order alone would outlive its meaning — open the prospects list, then a
// lead from the Inbox, and a stale "17 of 40" would appear. So the list also
// records which lead it opened (the origin), and j / k re-record it on every
// step; a profile honours the order only when it is that lead. One opened from
// anywhere else (a link, the palette, the Inbox, Work) finds a different
// origin and simply has no j / k.
//
// Storage can be absent or refuse (a private window, blocked site data), so
// every access is guarded and a failure reads as "no order".

const KEY = "jn:lead-order"
const ORIGIN_KEY = "jn:lead-order-origin"

/** Record the ids the leads list rendered, in the order it rendered them. */
export function writeLeadOrder(ids: readonly string[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // No storage: the profile will find no order, which it handles.
  }
}

/** Record that the lead `id` is being opened from the list's order — by the
 *  list itself, or by a j / k step on a profile. */
export function markLeadOrigin(id: string): void {
  try {
    window.sessionStorage.setItem(ORIGIN_KEY, id)
  } catch {
    // No storage: no origin, so no j / k — which is the safe reading.
  }
}

/** The lead the order was last used to open, or null. */
export function readLeadOriginSnapshot(): string | null {
  try {
    return window.sessionStorage.getItem(ORIGIN_KEY)
  } catch {
    return null
  }
}

/** The lead id a same-origin `/leads/<id>` href opens, or null. */
export function leadIdFromHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return null
    const match = /^\/leads\/([^/]+)$/.exec(url.pathname)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
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
