import type { Client, FitTier } from "./queries/clients"

// The tier, derived — never scored, never migrated.
//
// `fit_tier` is A/B/C and it decides the order of the week: the outreach queue
// sorts overdue first and then by this letter, so what this file returns is
// what Jamie works on Monday morning. That makes two properties non-negotiable,
// and they are the whole reason this is a function rather than a column
// somebody fills in:
//
//   **It is derived from stored facts only.** Website grade, sector, town,
//   review count — four columns, nothing else, no history, no clock, no model
//   output. So re-tiering the pool is a re-run (`leads-enrich --retier`), never
//   a migration, and a tier can never be more current than the facts under it.
//
//   **It says why.** Every signal returns a line of English, so "why is this
//   A-tier" is answered on the lead's own page and in the terminal rather than
//   by reading this file. A number nobody can explain is exactly what the
//   breakdown's research rejected at this scale.
//
// Pure, like `cadence.ts` and `deal.ts` beside it. Nothing here reads the
// database and nothing writes one — the enrichment pass proposes *facts*, and
// this decides the tier from them. That split is the ticket's own rule: AI
// proposes, the function decides.
//
// The weights are a judgement about what a one-person web consultancy in Mafra
// should call first, written down where they can be argued with:
//
//   need   — a bad or missing website *is* the pitch. The breakdown names it as
//            the strongest single signal, so it carries the most points.
//   value  — whether a website is how this kind of business actually gets
//            customers. A restaurant lives on it; a scrap yard does not.
//   reach  — whether Jamie can walk in. The cadence's step 4 is a visit, and
//            turning up is the highest-conversion touch available in a town
//            this size.
//   alive  — whether anyone is looking after the business at all. Reviews are
//            the only proxy on file, and a business with none may be shut.

/** The four columns a tier is derived from. Structural, like `DealTerms` and
 *  `CadenceLead`: a whole `Client` row, a list projection and an enrichment
 *  proposal being previewed can all be asked the same question. */
export type TierFacts = Pick<
  Client,
  "websiteGrade" | "sector" | "town" | "reviewCount"
>

/** One reason, with the points it carried. The line is written for a person —
 *  it appears under the tier on the lead's profile and beside the row in the
 *  script — so it says what was found, not which branch was taken. */
export type TierSignal = {
  key: "need" | "value" | "reach" | "alive"
  points: number
  reason: string
}

export type TierVerdict = {
  /** Null when there is nothing on file to tier from — untiered, which is not
   *  the same as C. */
  tier: FitTier | null
  score: number
  signals: TierSignal[]
}

/**
 * The thresholds, out of a possible 8.
 *
 * Two numbers rather than a curve, because three buckets is the whole point:
 * A is "call this week", B is "worth a cadence", C is "last in the queue".
 * Read them against the worked examples in the README — a Mafra restaurant
 * with a dated site and forty reviews is a 7, and a Lisbon clinic with a good
 * site is a 3.
 */
export const TIER_A_FROM = 6
export const TIER_B_FROM = 3

/**
 * The tier this record's facts add up to, and the reasons behind it.
 *
 * Returns `tier: null` — untiered — when all four facts are empty. That is the
 * honest answer for a row nobody has looked at: `fit_tier` null already means
 * "not graded" everywhere else, and filing an unexamined business as C would
 * bury it under the ones that were actually assessed.
 */
export function deriveFitTier(facts: TierFacts): TierVerdict {
  if (
    !facts.websiteGrade &&
    !facts.sector &&
    !facts.town &&
    facts.reviewCount === null
  ) {
    return { tier: null, score: 0, signals: [] }
  }

  const signals = [
    needSignal(facts.websiteGrade),
    valueSignal(facts.sector),
    reachSignal(facts.town),
    aliveSignal(facts.reviewCount),
  ]
  const score = signals.reduce((total, signal) => total + signal.points, 0)

  const tier: FitTier =
    score >= TIER_A_FROM ? "A" : score >= TIER_B_FROM ? "B" : "C"
  return { tier, score, signals }
}

/** The tier alone, for a caller that only wants the letter — a batch re-tier
 *  comparing against what is stored, mostly. */
export function fitTierOf(facts: TierFacts): FitTier | null {
  return deriveFitTier(facts).tier
}

/** The verdict as one line: `A · 7/8 — no website, restaurant, Mafra, 40
 *  reviews`. What a table row and a caption both need. */
export function tierSummary(verdict: TierVerdict): string {
  if (!verdict.tier) return "Untiered — nothing on file to grade from"
  const reasons = verdict.signals.map((signal) => signal.reason).join(", ")
  return `${verdict.tier} · ${verdict.score}/8 — ${reasons}`
}

// ---- need: what their web presence is ---------------------------------------

/**
 * The strongest signal, and the only one that can carry three points.
 *
 * `none` and `social_only` score the same deliberately: a business whose whole
 * presence is an Instagram page has the identical need to one with nothing —
 * they are findable and they cannot be booked — and the pool is full of both.
 * `decent` scores zero rather than going negative: a good site is not a reason
 * to write them off, it is only not a reason to call.
 */
function needSignal(grade: string | null): TierSignal {
  const points =
    grade === "none" || grade === "social_only"
      ? 3
      : grade === "dated"
        ? 2
        : grade === "decent"
          ? 0
          : 1

  const reason =
    grade === "none"
      ? "no website"
      : grade === "social_only"
        ? "social only"
        : grade === "dated"
          ? "dated site"
          : grade === "decent"
            ? "site is fine"
            : "site not graded"

  return { key: "need", points, reason }
}

// ---- value: whether a website is how they get customers ---------------------

/**
 * Sector weight, by keyword rather than by lookup table.
 *
 * `sector` is free text on purpose — the pool's own words, in two languages
 * ("restaurant", "clínica dentária") — so this matches folded word prefixes
 * instead of comparing ids. A sector nothing matches scores 1: unknown is not
 * the same as low, and a business this file has never heard of should not be
 * pushed down the queue for it.
 */
function valueSignal(sector: string | null): TierSignal {
  const found = fold(sector)
  if (found === "") return { key: "value", points: 1, reason: "sector unknown" }
  const said = sector?.trim() ?? found

  if (matches(found, HIGH_VALUE_SECTORS)) {
    return { key: "value", points: 2, reason: `${said} — lives on being found` }
  }
  if (matches(found, LOW_VALUE_SECTORS)) {
    return { key: "value", points: 0, reason: `${said} — sells elsewhere` }
  }
  return { key: "value", points: 1, reason: said }
}

/** Businesses whose customers find, compare and book them online — where a bad
 *  site costs money every week. Prefixes, so "restaurante" and "restaurant"
 *  both hit `restaur` — see `matches` for why they are anchored. */
const HIGH_VALUE_SECTORS = [
  "restaur",
  "cafe",
  "pastelaria",
  "padaria",
  "bakery",
  "bar",
  "hotel",
  "alojamento",
  "guesthouse",
  "hostel",
  "turismo",
  "clinic",
  "dentist",
  "dentaria",
  "medic",
  "fisioterap",
  "veterinar",
  "gym",
  "ginasio",
  "pilates",
  "yoga",
  "cabeleireir",
  "barbeir",
  "barber",
  "salon",
  "estetica",
  "spa",
  "surf",
  "escola",
  "school",
  "imobiliar",
  "real estate",
]

/** Businesses whose customers arrive through contracts, wholesale or a trade
 *  counter — where a website is a brochure nobody was going to read. */
const LOW_VALUE_SECTORS = [
  "grossista",
  "wholesale",
  "industri",
  "fabrica",
  "factory",
  "transport",
  "logistic",
  "agricol",
  "agricultur",
  "armazem",
]

// ---- reach: whether he can walk in ------------------------------------------

/**
 * How far away they are, in three bands.
 *
 * "Nearby" is the same thing the cadence's walk-in step means by it, and the
 * bands are towns rather than distances because a town is what the pool
 * actually carries. A town nothing matches is treated as far: the pool's
 * unmatched towns are the greater-Lisbon ones, and guessing "nearby" would put
 * a walk-in on a lead an hour up the A8.
 */
function reachSignal(town: string | null): TierSignal {
  const found = fold(town)
  if (found === "") return { key: "reach", points: 0, reason: "town unknown" }
  const said = town?.trim() ?? found

  if (matches(found, HOME_TOWNS)) {
    return { key: "reach", points: 2, reason: `${said} — walkable` }
  }
  if (matches(found, NEAR_TOWNS)) {
    return { key: "reach", points: 1, reason: `${said} — a short drive` }
  }
  return { key: "reach", points: 0, reason: `${said} — a trip` }
}

/** The concelho of Mafra: somewhere an afternoon can take in three visits. */
const HOME_TOWNS = [
  "mafra",
  "ericeira",
  "malveira",
  "venda do pinheiro",
  "encarnacao",
  "azueira",
  "carvoeira",
  "santo isidoro",
  "igreja nova",
  "cheleiros",
  "gradil",
  "enxara",
  "alcainca",
  "vila franca do rosario",
  "sobral da abelheira",
  "milharado",
]

/** The ring around it — one visit is a morning rather than an afternoon, which
 *  is still worth making for a lead that earns it. */
const NEAR_TOWNS = [
  "sintra",
  "torres vedras",
  "loures",
  "odivelas",
  "sobral de monte agraco",
  "arruda dos vinhos",
  "alenquer",
  "colares",
  "algueirao",
  "cacem",
  "queluz",
  "amadora",
]

// ---- alive: whether anyone is looking after it ------------------------------

/**
 * Reviews as a proxy for a going concern.
 *
 * The one negative in the whole function, and it is deliberate: a business with
 * a website and zero reviews is often one that closed. Null is not zero —
 * nobody looked — and scores nothing either way, because `review_count` stays
 * hand-entered (the ticket's own call: no Places API at this scale).
 */
function aliveSignal(reviews: number | null): TierSignal {
  if (reviews === null) {
    return { key: "alive", points: 0, reason: "reviews not looked up" }
  }
  if (reviews === 0) {
    return { key: "alive", points: -1, reason: "no reviews — may be shut" }
  }
  return {
    key: "alive",
    points: 1,
    reason: `${reviews} ${reviews === 1 ? "review" : "reviews"}`,
  }
}

// ---- matching ---------------------------------------------------------------

/**
 * Does any keyword start a word in this folded string?
 *
 * A **word prefix**, not a bare substring, and the difference is not academic:
 * "restaur" has to reach "restaurante", so the keywords are prefixes — but a
 * plain `includes` would then find "spa" inside "espaço" and file a shop as a
 * health club. Anchoring each keyword to a word boundary keeps the prefix
 * matching and loses the accident.
 */
function matches(folded: string, keywords: readonly string[]): boolean {
  return keywords.some((word) => new RegExp(`\\b${word}`).test(folded))
}

/** Lowercased, accents off, whitespace collapsed — enough for a word-prefix
 *  match against a list a person typed. The dedupe key's `flatten` in
 *  `import.ts` does more (it drops company suffixes); this one deliberately
 *  does less, because "Padaria Lda" and "Padaria" are the same sector either
 *  way and dropping words could only lose a match. */
function fold(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}
