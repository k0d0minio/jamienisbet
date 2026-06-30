import { localeHtmlLang, type Locale } from "@/i18n/routing"

// Currency formatting. Stripe holds amounts in the currency's minor unit (cents
// for EUR), so divide by 100 before display. The presentation locale drives the
// grouping/decimal separators and symbol position via Intl (e.g. en-GB "€1,500",
// pt-PT/fr-FR "1 500 €") — the currency itself is invariant.

const HAS_DECIMALS = /\.\d/

/** Format a major-unit amount (e.g. 1500) as a currency string for `locale`. */
export function formatMoney(
  amount: number,
  currency = "EUR",
  locale: Locale = "en",
): string {
  return new Intl.NumberFormat(localeHtmlLang[locale], {
    style: "currency",
    currency: currency.toUpperCase(),
    // Show cents only when they're non-zero, so €1,500 stays clean.
    minimumFractionDigits: HAS_DECIMALS.test(String(amount)) ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Convert a Stripe minor-unit amount (cents) to a localized currency string. */
export function formatStripeAmount(
  minor: number,
  currency = "EUR",
  locale: Locale = "en",
): string {
  return formatMoney(minor / 100, currency, locale)
}
