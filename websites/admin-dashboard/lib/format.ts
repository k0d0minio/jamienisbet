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

// Stripe returns its timestamps as epoch seconds, and every one of them the
// admin shows is read as a *day*: an invoice is raised on a day, due on a day,
// paid on a day. The hour was never set by anyone and, on a grouped row, it
// costs exactly the width the figure and the state need. Two digits of year,
// so a figure from last year can never be mistaken for one from this one.
const shortEpochFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "2-digit",
})

export function formatEpochDay(seconds: number | null): string {
  if (!seconds) return "—"
  return shortEpochFormatter.format(new Date(seconds * 1000))
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

/** An Instagram handle as its profile link. The handle is stored bare (the '@'
 * is punctuation, not data), and a stray one is tolerated here rather than
 * breaking the URL. */
export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@+/, "")}`
}

/** A prospect's website as something a browser will actually open. The pool's
 * URLs arrive as people write them down — "example.pt" as often as
 * "https://example.pt" — and an href with no scheme is read as a relative path,
 * which would navigate inside the dashboard. */
export function websiteHref(url: string): string {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
}

/** The same URL as the one line worth showing: the host, without the scheme or
 * a leading www. Falls back to the raw string if it won't parse — a value
 * somebody typed is still worth showing them. */
export function websiteHost(url: string): string {
  try {
    return new URL(websiteHref(url)).host.replace(/^www\./, "")
  } catch {
    return url
  }
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
