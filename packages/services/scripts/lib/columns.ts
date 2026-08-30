import type { ProspectInput } from "@jamie-nisbet/services"

// What a spreadsheet column is called, and what it means.
//
// This is an operator-input concern, not a model one, which is why it lives
// here rather than in `src/import.ts`: the table has one name for a town, and
// a list compiled by hand has four. Everything below is the translation, and
// nothing below knows what happens to a value afterwards.
//
// The aliases are the words the 2026-07-23 Mafra/Lisbon list and its relatives
// actually use, in English and Portuguese, because the next list will be
// headed by whoever compiles it rather than by this file.

/** Header → field. The first alias of each field is the canonical spelling,
 *  and the one the `--help` and the template print. */
const ALIASES: Record<keyof ProspectInput, readonly string[]> = {
  name: ["name", "business", "nome", "contact", "contact_name"],
  company: ["company", "empresa", "business_name", "trading_name"],
  email: ["email", "e_mail", "mail", "correio"],
  phone: ["phone", "telephone", "tel", "telefone", "telemovel", "mobile", "number"],
  whatsapp: ["whatsapp", "wa", "whats_app", "whatsapp_number"],
  instagram: ["instagram", "ig", "insta", "handle"],
  sector: ["sector", "sector_cluster", "industry", "setor", "category", "type"],
  town: ["town", "city", "cidade", "vila", "location", "area", "concelho"],
  language: ["language", "lang", "idioma", "outreach_language"],
  hook: ["hook", "pain_point", "pain", "angle", "opportunity", "note_hook"],
  fitTier: ["fit_tier", "tier", "priority", "grade", "prioridade"],
  websiteUrl: ["website_url", "website", "site", "url", "web"],
  websiteGrade: ["website_grade", "site_grade", "web_presence", "presence"],
  reviewCount: ["review_count", "reviews", "google_reviews", "avaliacoes"],
  notes: ["notes", "note", "comment", "comments", "observacoes"],
}

/** The canonical header line, for `--template`. */
export const TEMPLATE_HEADERS: readonly string[] = Object.values(ALIASES).map(
  (names) => names[0]
)

/** Lowercase, and everything that isn't a letter or a digit becomes an
 *  underscore — so "Website URL", "website-url" and "WEBSITE_URL" are one
 *  column, and so are "Telemóvel" and "telemovel". */
export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const BY_HEADER = new Map<string, keyof ProspectInput>()
for (const [field, names] of Object.entries(ALIASES) as [
  keyof ProspectInput,
  readonly string[],
][]) {
  for (const name of names) BY_HEADER.set(name, field)
}

export type MappedRow = {
  input: ProspectInput
  /** Headers that meant nothing here — reported once for the file, not once
   *  per row, so a column nobody mapped is visible rather than silently lost. */
  unmapped: string[]
}

/**
 * One record from a CSV or a JSON array, keyed the way `normalizeProspect`
 * expects.
 *
 * Unrecognised keys are collected rather than dropped: a list with a "Owner"
 * column that nobody mapped is a list where the operator should know that
 * column did not land, and finding out from the dry run is the point of having
 * one.
 */
export function mapRow(record: Record<string, unknown>): MappedRow {
  const input: ProspectInput = {}
  const unmapped: string[] = []

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const header = normalizeHeader(rawKey)
    const field = BY_HEADER.get(header)
    const value = stringify(rawValue)

    if (!field) {
      if (header !== "" && value !== null) unmapped.push(rawKey.trim())
      continue
    }
    // First column wins: a file with both "business" and "name" has one name.
    if (input[field] === undefined || input[field] === null) input[field] = value
  }

  return { input, unmapped }
}

/** JSON rows carry numbers and booleans; a CSV carries strings. Everything
 *  becomes the string the normalizer reads, or null. */
function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") return value.trim() === "" ? null : value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return null
}
