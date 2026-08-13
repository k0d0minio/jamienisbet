// Consistent, locale-stable timestamp formatting for the admin tables.
const formatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDateTime(value: Date | string | null): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return formatter.format(date)
}

// Some timestamps are only ever read as a day — when work started on an
// engagement, say. The hour is noise there, so it gets its own formatter rather
// than a trimmed version of the one above.
const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" })

export function formatDate(value: Date | string | null): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return dateFormatter.format(date)
}

// Stripe returns timestamps as epoch seconds; render them the same way as the
// DB timestamps above.
export function formatEpoch(seconds: number | null): string {
  if (!seconds) return "—"
  return formatter.format(new Date(seconds * 1000))
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days between `since` and `now` (both ms). Never negative. */
export function daysSince(since: Date, now: number): number {
  return Math.max(0, Math.floor((now - since.getTime()) / DAY_MS))
}

/** How long a lead has been sitting, for the "last worked …" line: "today",
 * "1 day", "12 days". Callers pass `now` in so this stays pure — computing it
 * during a render is what the react-hooks/purity rule forbids. */
export function waitingLabel(days: number): string {
  if (days <= 0) return "today"
  if (days === 1) return "1 day"
  return `${days} days`
}

/** A lead's phone number as a WhatsApp deep link (https://wa.me/<digits>), so
 * tapping it opens the conversation instead of dialling. wa.me wants the full
 * international number as bare digits: strip formatting, then a leading `+` or
 * `00`. Numbers stored without a country code get Portugal's (+351) — the
 * default market — since wa.me can't resolve a national-format number. */
export function whatsappUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "")
  if (phone.trim().startsWith("+")) {
    // already international, digits are complete
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2)
  } else if (digits.length === 9) {
    digits = `351${digits}`
  }
  return `https://wa.me/${digits}`
}

// Turns a locale-invariant service id (e.g. "aiInfrastructure") into a readable
// label ("AI Infrastructure"). Purely cosmetic — the id stays the source of truth.
export function formatServiceId(value: string | null): string {
  if (!value) return "—"
  const words = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) =>
      word.toLowerCase() === "ai"
        ? "AI"
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
  return words.join(" ")
}
