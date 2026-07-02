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

// Stripe returns timestamps as epoch seconds; render them the same way as the
// DB timestamps above.
export function formatEpoch(seconds: number | null): string {
  if (!seconds) return "—"
  return formatter.format(new Date(seconds * 1000))
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
