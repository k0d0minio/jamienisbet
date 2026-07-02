// Money formatting for the Stripe surfaces. Stripe amounts are in minor units
// (cents) for the currencies Jamie bills in; format them into a readable,
// locale-stable string. Zero-decimal currencies aren't used here, so a fixed
// /100 is safe and keeps this simple.

/** Format a Stripe minor-unit amount (e.g. 12345) into "€123.45". */
export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100)
}

/**
 * Parse a human-entered major-unit amount ("123.45", "1,234.50") into Stripe
 * minor units (12345). Returns null when the input isn't a positive amount.
 */
export function parseAmountToMinor(input: string): number | null {
  const normalized = input.trim().replace(/,/g, "")
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100)
}
