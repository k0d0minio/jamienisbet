// Percentages — the commission taken on a client's revenue, the ownership stake
// negotiated in their company — are stored in basis points (services owns the
// column and the 100% ceiling; 850 = 8.5%). These are the two ends of the round
// trip: what the form types in, and what the list renders.
//
// The same shape as the money helpers next door, and for the same reason: an
// integer in the database, a human string at the edges, nothing floating in
// between.

import { MAX_BPS } from "@jamie-nisbet/services"

/**
 * Parse a human-entered percentage ("8.5", "8.5 %", "10") into basis points
 * (850, 850, 1000). Returns null when the input isn't a percentage in 0…100 —
 * an empty field, a word, or a stake larger than the whole company.
 */
export function parsePercentToBps(input: string): number | null {
  const normalized = input.trim().replace(/%/g, "").replace(/,/g, ".")
  if (!normalized) return null
  const bps = Math.round(Number(normalized) * 100)
  if (!Number.isFinite(bps) || bps < 0 || bps > MAX_BPS) return null
  return bps
}

/**
 * Basis points back to a readable percentage: 850 → "8.5%", 1000 → "10%".
 * Trailing zeros are dropped so a round figure doesn't read as false precision.
 */
export function formatBps(bps: number): string {
  return `${bps / 100}%`
}

/** Basis points to the plain number the form edits (850 → "8.5"). Null and zero
 * both show as an empty field — "no cut agreed" rather than "0%". */
export function bpsToPercentInput(bps: number | null): string {
  return bps !== null && bps > 0 ? String(bps / 100) : ""
}
