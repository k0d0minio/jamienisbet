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
