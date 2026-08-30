import {
  isClientLanguage,
  isFitTier,
  isWebsiteGrade,
  type ClientLanguage,
  type FitTier,
  type WebsiteGrade,
} from "./queries/clients"
import { normalizeSuppressionValue, toE164 } from "./queries/suppressions"

// The door the cold pool walks in through — the pure half of it.
//
// Everything here is a function of its arguments: no database, no filesystem,
// no clock. It lives beside `deal.ts` and `cadence.ts` for that reason, and it
// exists as a module rather than as code inside the import script because two
// of its answers are needed away from the script — the dedupe key is how any
// surface decides "we already have this business", and the normalizer is what
// turns a hand-compiled list row into the columns the table actually holds.
//
// What it is *not* is a file parser. CSV headers, JSON shapes and column
// aliases are an operator-input problem and live with the script that reads
// them (packages/services/scripts/lib/columns.ts); by the time a row arrives
// here it is already keyed by the names below.

/**
 * One row of a compiled prospect list, as strings, keyed the way the table
 * thinks rather than the way a spreadsheet was headed.
 *
 * Every field is a string or absent, because that is what a CSV cell and a
 * hand-written JSON row both are — the coercion to numbers, E.164 and the
 * closed vocabularies is this module's job, and doing it anywhere else is how
 * two importers end up disagreeing about what "PT" means.
 */
export type ProspectInput = {
  /** The business, or the person if the list named one. At least one of
   *  `name` / `company` has to be there — a row with neither is not a lead. */
  name?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  instagram?: string | null
  sector?: string | null
  town?: string | null
  language?: string | null
  hook?: string | null
  fitTier?: string | null
  websiteUrl?: string | null
  websiteGrade?: string | null
  reviewCount?: string | null
  notes?: string | null
}

/**
 * A row ready to be written: the same facts, in the columns' own types and
 * lengths. `status`, `source` and `sourceDetail` are deliberately absent —
 * they are the importer's provenance, not the list's, and `insertProspects`
 * stamps them so no caller can file a batch as anything but `prospect` from
 * `import`.
 */
export type ProspectDraft = {
  name: string
  company: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  sector: string | null
  town: string | null
  language: ClientLanguage | null
  hook: string | null
  fitTier: FitTier | null
  websiteUrl: string | null
  websiteGrade: WebsiteGrade | null
  reviewCount: number | null
  notes: string | null
}

/** What was thrown away or guessed at on the way in — one line each, in the
 *  operator's terms, so a dry run can show the cost of a messy list before it
 *  is paid. A warning never stops a row; a `NormalizedProspect` with no draft
 *  does. */
export type NormalizedProspect = {
  /** Null when the row could not become a lead at all — see `problem`. */
  draft: ProspectDraft | null
  /** Why there is no draft. Null when there is one. */
  problem: string | null
  warnings: string[]
}

/** Column lengths from `schema/index.ts`, so a long cell is trimmed here
 *  rather than rejected by Postgres halfway through a batch. */
const LIMITS = {
  name: 120,
  company: 120,
  email: 200,
  phone: 40,
  whatsapp: 40,
  instagram: 100,
  sector: 60,
  town: 80,
  websiteUrl: 300,
} as const

/** Free text, trimmed and capped, or null when there is nothing in it. */
function text(raw: string | null | undefined, limit?: number): string | null {
  if (raw === null || raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed === "") return null
  return limit ? trimmed.slice(0, limit) : trimmed
}

/**
 * The words a compiled list actually uses for a language, mapped onto the
 * three the column holds. A list written by hand says "PT", "Portuguese",
 * "both" and "either" for what the table calls `pt` and `en-pt`.
 */
function language(raw: string | null | undefined): {
  value: ClientLanguage | null
  warning: string | null
} {
  const value = text(raw)
  if (!value) return { value: null, warning: null }
  const key = value.toLowerCase().replace(/[\s_]+/g, "-")
  const aliases: Record<string, ClientLanguage> = {
    en: "en",
    eng: "en",
    english: "en",
    ingles: "en",
    pt: "pt",
    "pt-pt": "pt",
    por: "pt",
    portuguese: "pt",
    portugues: "pt",
    "en-pt": "en-pt",
    "pt-en": "en-pt",
    both: "en-pt",
    either: "en-pt",
    any: "en-pt",
  }
  const mapped = aliases[key]
  if (mapped) return { value: mapped, warning: null }
  if (isClientLanguage(key)) return { value: key, warning: null }
  return { value: null, warning: `language "${value}" not recognised — left blank` }
}

/** A/B/C, however the list wrote it — "A", "a", "Tier A", "1". Priority
 *  numbers are the other way a hand-compiled list tiers, and 1/2/3 is the
 *  ordering A/B/C already has. */
function tier(raw: string | null | undefined): {
  value: FitTier | null
  warning: string | null
} {
  const value = text(raw)
  if (!value) return { value: null, warning: null }
  const letter = value.trim().toUpperCase().replace(/^TIER\s*/, "")
  const byNumber: Record<string, FitTier> = { "1": "A", "2": "B", "3": "C" }
  const mapped = byNumber[letter] ?? letter
  if (isFitTier(mapped)) return { value: mapped, warning: null }
  return { value: null, warning: `tier "${value}" is not A, B or C — left untiered` }
}

/** The four gradings, spelled the way a person writes them down. */
function grade(raw: string | null | undefined): {
  value: WebsiteGrade | null
  warning: string | null
} {
  const value = text(raw)
  if (!value) return { value: null, warning: null }
  const key = value.toLowerCase().replace(/[\s-]+/g, "_")
  const aliases: Record<string, WebsiteGrade> = {
    no_website: "none",
    nothing: "none",
    social: "social_only",
    social_media: "social_only",
    instagram_only: "social_only",
    facebook_only: "social_only",
    old: "dated",
    outdated: "dated",
    ok: "decent",
    good: "decent",
    fine: "decent",
  }
  const mapped = aliases[key] ?? key
  if (isWebsiteGrade(mapped)) return { value: mapped, warning: null }
  return {
    value: null,
    warning: `website grade "${value}" not recognised — left ungraded`,
  }
}

/** A review count, or null. Negatives and non-numbers are a typo rather than
 *  a fact, so they warn instead of landing. */
function reviews(raw: string | null | undefined): {
  value: number | null
  warning: string | null
} {
  const value = text(raw)
  if (!value) return { value: null, warning: null }
  const digits = value.replace(/[^\d]/g, "")
  if (digits === "") {
    return { value: null, warning: `review count "${value}" is not a number — dropped` }
  }
  return { value: Number.parseInt(digits, 10), warning: null }
}

/** A website as typed. A bare domain gets `https://` in front of it so the
 *  column holds something a browser and a fetch can both open — the pool's
 *  lists write "example.pt" far more often than the full URL. */
function website(raw: string | null | undefined): string | null {
  const value = text(raw, LIMITS.websiteUrl)
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`.slice(0, LIMITS.websiteUrl)
}

/**
 * One list row, in the columns the table holds.
 *
 * Nothing here is clever: the numbers become numbers, the vocabularies are
 * checked against their closed sets, the contact points are normalized through
 * the *same* helpers the suppression table uses (which is the point — a number
 * stored one way and suppressed another is a suppression that silently does
 * nothing), and anything that does not fit warns rather than throwing, because
 * a batch that dies on row 40 of 85 is worse than a batch that lands with four
 * blank tiers.
 *
 * The one hard requirement is a name.
 */
export function normalizeProspect(input: ProspectInput): NormalizedProspect {
  const warnings: string[] = []

  const company = text(input.company, LIMITS.company)
  const named = text(input.name, LIMITS.name) ?? company
  if (!named) {
    return { draft: null, problem: "no name or company on the row", warnings }
  }

  const email = normalizeSuppressionValue("email", input.email)
  if (input.email?.trim() && !email) {
    warnings.push(`email "${input.email.trim()}" is empty after normalizing — dropped`)
  }
  if (email && !email.includes("@")) {
    warnings.push(`email "${email}" has no @ — kept as given`)
  }

  const phone = normalizeSuppressionValue("phone", input.phone)
  if (input.phone?.trim() && !phone) {
    warnings.push(`phone "${input.phone.trim()}" has no digits — dropped`)
  }

  // WhatsApp is null when it is the same line as the phone: the column exists
  // for the businesses whose chat is a *different* number, and storing the
  // same one twice would make the profile draw two identical channels.
  const whatsappRaw = normalizeSuppressionValue("phone", input.whatsapp)
  const whatsapp = whatsappRaw && whatsappRaw !== phone ? whatsappRaw : null
  if (whatsappRaw && whatsapp === null) {
    warnings.push("whatsapp is the same number as the phone — left blank, which means the same thing")
  }

  const instagram = normalizeSuppressionValue("instagram", input.instagram)

  const lang = language(input.language)
  if (lang.warning) warnings.push(lang.warning)
  const fit = tier(input.fitTier)
  if (fit.warning) warnings.push(fit.warning)
  const web = grade(input.websiteGrade)
  if (web.warning) warnings.push(web.warning)
  const count = reviews(input.reviewCount)
  if (count.warning) warnings.push(count.warning)

  return {
    problem: null,
    warnings,
    draft: {
      name: named,
      // A list of businesses names the business once; the row then reads the
      // same either way — `name` is what every screen shows, `company` is what
      // a filter groups on. When the list did name a person separately, the
      // two say different things and both are kept.
      company: company ?? named,
      email,
      phone: phone?.slice(0, LIMITS.phone) ?? null,
      whatsapp: whatsapp?.slice(0, LIMITS.whatsapp) ?? null,
      instagram: instagram?.slice(0, LIMITS.instagram) ?? null,
      sector: text(input.sector, LIMITS.sector),
      town: text(input.town, LIMITS.town),
      language: lang.value,
      hook: text(input.hook),
      fitTier: fit.value,
      websiteUrl: website(input.websiteUrl),
      websiteGrade: web.value,
      reviewCount: count.value,
      notes: text(input.notes),
    },
  }
}

// ---- Dedupe -----------------------------------------------------------------

/**
 * The key two rows are "the same business" by: their name and their town,
 * flattened until spelling stops mattering.
 *
 * Name *and* town, because neither alone is enough on this pool — there is a
 * "Farmácia Central" in most towns in the district, and the same restaurant
 * appears in two lists with its address written differently. Accents come off
 * (a list compiled by hand has "Café" and "Cafe" in it), punctuation and case
 * go, whitespace collapses, and the common Portuguese company suffixes are
 * dropped so "Padaria Sol Lda" and "Padaria Sol" are one business.
 *
 * A row with no town keys on the name alone, which is looser on purpose: a
 * duplicate is *reported*, never overwritten, so a false match costs a line of
 * output and a false miss costs a second cold call to the same person.
 */
export function dedupeKey(
  name: string | null | undefined,
  town: string | null | undefined
): string {
  return `${flatten(name)}|${flatten(town)}`
}

/** The same key, asked of a row that is already in the table. Structural, so a
 *  whole `Client`, a list projection and a fresh draft can all be compared. */
export function dedupeKeyOf(row: {
  name: string | null
  town: string | null
}): string {
  return dedupeKey(row.name, row.town)
}

/** Common Portuguese and English legal suffixes — noise in a name, and written
 *  inconsistently in every hand-compiled list. */
const SUFFIXES = new Set([
  "lda",
  "ldª",
  "sa",
  "unipessoal",
  "ltd",
  "ltda",
  "limited",
  "sarl",
  "eirl",
])

function flatten(value: string | null | undefined): string {
  if (!value) return ""
  const bare = value
    .normalize("NFD")
    // Combining marks: "Café" and "Cafe" are one business.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word !== "" && !SUFFIXES.has(word))
  return bare.join(" ")
}
