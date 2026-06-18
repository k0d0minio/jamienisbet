// Currency formatting to the brand rule: symbol before the number, comma
// thousands separator, e.g. €1,500 / €750.50 (see _config/brand/voice/).
//
// Stripe holds amounts in the currency's minor unit (cents for EUR), so divide
// by 100 before display.

const HAS_DECIMALS = /\.\d/

/** Format a major-unit amount (e.g. 1500) as a brand-styled currency string. */
export function formatMoney(amount: number, currency = "EUR"): string {
  const formatted = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    // Show cents only when they're non-zero, so €1,500 stays clean.
    minimumFractionDigits: HAS_DECIMALS.test(String(amount)) ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
  // en-IE renders EUR as "€1,500" already; other currencies keep their symbol.
  return formatted
}

/** Convert a Stripe minor-unit amount (cents) to a brand-styled string. */
export function formatStripeAmount(minor: number, currency = "EUR"): string {
  return formatMoney(minor / 100, currency)
}
