// The cold pool's three small vocabularies, mirrored for the browser.
//
// `clientLanguages`, `fitTiers` and `websiteGrades` — and their labels — live in
// @jamie-nisbet/services, which is the authority: the server action re-validates
// everything this file names, and clears the column for anything it doesn't.
// They are copied here for the same reason the status ladder is copied into
// `components/client-status-select.tsx` and its two siblings: the facts card is
// a client component, and importing the services barrel would pull the Drizzle
// client and the Neon driver into the browser bundle to read four labels.
//
// The same trick as `lib/lead-segments.ts`, one level up: a plain module both
// the client component and a server render can import, rather than a constant
// exported out of a "use client" file, which arrives on the server as a
// reference instead of a value.
//
// Keep in step with packages/services/src/queries/clients.ts.

/** Which language to open in. */
export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "en-pt", label: "Either" },
] as const

/** How good a fit they are — by rule, not by score. Null = untiered, which is
 *  not the same as a bad grade. */
export const FIT_TIERS = [
  { value: "A", hint: "Clear need, reachable, worth the effort" },
  { value: "B", hint: "Plausible — worth a cadence" },
  { value: "C", hint: "Long shot; last in the queue" },
] as const

/** What their web presence amounts to. "No website" is a finding; null means
 *  nobody has looked. */
export const WEBSITE_GRADES = [
  { value: "none", label: "No website" },
  { value: "social_only", label: "Social only" },
  { value: "dated", label: "Dated" },
  { value: "decent", label: "Decent" },
] as const

/** A stored value's readable word, or null when the column is empty. An
 *  unrecognised value falls through to itself, so a row written before this
 *  list changed still names itself rather than disappearing. */
function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  if (!value) return null
  return options.find((o) => o.value === value)?.label ?? value
}

export function languageLabel(value: string | null): string | null {
  return labelFor(LANGUAGES, value)
}

export function websiteGradeLabel(value: string | null): string | null {
  return labelFor(WEBSITE_GRADES, value)
}

/** What a tier letter means, for the line under it. Null for an untiered row
 *  and for a letter this list doesn't name. */
export function fitTierHint(value: string | null): string | null {
  if (!value) return null
  return FIT_TIERS.find((t) => t.value === value)?.hint ?? null
}
