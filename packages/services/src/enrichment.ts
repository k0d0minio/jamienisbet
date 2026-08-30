import { firstJsonObject, jsonText } from "./model-json"
import {
  clientLanguageLabel,
  isClientLanguage,
  isWebsiteGrade,
  websiteGradeLabel,
  type Client,
  type ClientLanguage,
  type WebsiteGrade,
} from "./queries/clients"
import { deriveFitTier, type TierFacts, type TierVerdict } from "./tiering"

// Enrichment — read their website, propose facts, change nothing.
//
// The grounding that keeps a drafted message from being slop. The pool's PDF
// shipped with hand-researched hooks; eighty-five of them go stale, and this is
// how they stay alive as the pool grows: fetch the business's own site, have a
// cheap model say what is actually on it, and put the answer *next to* what is
// already stored so a person accepts it a field at a time.
//
// Three rules shape every function below, and the third is the ticket's:
//
//   **It reads one page, of their own site.** Not a broker, not a crawl, not a
//   reviews API — the LIA (`.icm/docs/lia-cold-outreach.md` § 1) is explicit
//   that this pool is compiled by looking at shops, and a scraper would put the
//   whole assessment back on the table. One GET, capped, with a timeout.
//
//   **It proposes; it never decides.** Everything here returns a *proposal*.
//   The tier is not in it: that comes from `deriveFitTier` over the facts once
//   they are accepted, so "why is this A-tier" has an answer that does not
//   involve a model. AI proposes facts, the function decides the tier.
//
//   **It never overwrites silently.** `enrichmentChanges` returns current and
//   proposed side by side and marks the ones that would replace something, and
//   `enrichmentPatch` writes only what the caller says was accepted. The hook
//   is the field this exists for: a hand-written hook is the most valuable
//   sentence on the record and a model must not be able to quietly better it.
//
// Pure, except for one clearly-marked function: `fetchWebsitePage` is the only
// thing in `packages/services` that reaches the network, and it is here rather
// than in either caller because the dashboard's Enrich action and the
// `leads-enrich` script have to see the same page in the same shape. The
// Gateway call itself is *not* here, for the same reason `outreach.ts` doesn't
// carry one: this package holds no AI SDK. Each caller runs `generateText` over
// the prompt this file builds and hands the text back to `parseEnrichment`.

// ---- What comes back --------------------------------------------------------

/** What the record needs to know about itself to be enriched — everything a
 *  proposal could touch, so the diff can show what is already there. */
export type EnrichLead = Pick<
  Client,
  | "name"
  | "company"
  | "sector"
  | "town"
  | "language"
  | "hook"
  | "websiteUrl"
  | "websiteGrade"
  | "reviewCount"
  | "email"
  | "phone"
  | "whatsapp"
  | "instagram"
>

/**
 * What the model came back with.
 *
 * Nine proposable columns and a list of evidence. Every field is nullable and
 * null means *the page did not say* — which is the answer far more often than
 * a model left alone would like, so the prompt spends most of its words on it.
 */
export type EnrichmentProposal = {
  websiteGrade: WebsiteGrade | null
  sector: string | null
  town: string | null
  language: ClientLanguage | null
  hook: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  /**
   * What the page actually showed, two to five short lines: whether you can
   * book or order on it, how recently anyone touched it, what it is built
   * from, which doors it offers.
   *
   * **Read, never stored.** These are the evidence behind the grade — the
   * thing a person reads before accepting it — and there is no column for
   * them, deliberately: a findings table is the document ceremony the 2026-08
   * reversal removed. They live as long as the sheet is open.
   */
  findings: string[]
}

/** The nine columns a proposal can touch, in the order the review reads them:
 *  what the site is, then what the business is, then the doors it opens. */
export const enrichmentFields = [
  "websiteGrade",
  "sector",
  "town",
  "language",
  "hook",
  "email",
  "phone",
  "whatsapp",
  "instagram",
] as const
export type EnrichmentField = (typeof enrichmentFields)[number]

/** What each one is called on screen — the same words the facts and contact
 *  cards use, so a proposal names the row it would change. */
export const enrichmentFieldLabels: Record<EnrichmentField, string> = {
  websiteGrade: "Web presence",
  sector: "Sector",
  town: "Town",
  language: "Language",
  hook: "Hook",
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
}

export function isEnrichmentField(value: string): value is EnrichmentField {
  return (enrichmentFields as readonly string[]).includes(value)
}

// ---- The page ---------------------------------------------------------------

/** One page, reduced to what a model can read and what a regex found on it. */
export type WebsitePage = {
  /** What was asked for, with a scheme on it. */
  url: string
  /** Where it ended up. A site that redirects to a Facebook page has told you
   *  its grade without the model saying a word. */
  finalUrl: string
  title: string | null
  description: string | null
  /** The readable text, tags stripped and capped. */
  text: string
  /** The contact and social links found in the markup — extracted rather than
   *  asked for, because a regex cannot invent an address and a model can. */
  links: {
    emails: string[]
    phones: string[]
    whatsapp: string[]
    instagram: string[]
    facebook: string[]
  }
}

export type WebsiteFetch =
  | { ok: true; page: WebsitePage }
  /** Why it could not be read, in words a person can act on. Deliberately not
   *  a grade: a site that times out might be down for an hour, and grading it
   *  `none` from a failed request is the app inventing a finding. */
  | { ok: false; reason: string }

/** How long to wait, how much to read, and how much to keep. A small
 *  business's home page is a few kilobytes of text inside a few hundred of
 *  markup; the caps are there for the ones that ship a 20MB single-page app. */
const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 2_000_000
const MAX_TEXT = 6_000

/** Honest, identifiable, and not pretending to be a browser. */
const USER_AGENT = "Mozilla/5.0 (compatible; jamie-nisbet-lead-engine/1.0)"

/**
 * Fetch one page and reduce it. **The only function in this package that
 * reaches the network.**
 *
 * Never throws: every failure — a bad URL, a timeout, a 404, a PDF where a
 * home page should be — comes back as `{ ok: false, reason }`, because the
 * caller is a sheet on a phone or a row in a batch and neither wants a stack
 * trace. A page that could not be read produces no proposal at all: the model
 * is not asked to grade a site nobody saw.
 */
export async function fetchWebsitePage(
  rawUrl: string,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<WebsiteFetch> {
  const url = websiteUrl(rawUrl)
  if (!url) return { ok: false, reason: `"${rawUrl}" isn't a web address.` }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: opts.signal ?? AbortSignal.timeout(opts.timeoutMs ?? FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        // The pool is Portuguese businesses; a site that serves either should
        // serve the one its customers read.
        "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
      },
    })

    if (!response.ok) {
      return { ok: false, reason: `The site answered ${response.status}.` }
    }
    const type = response.headers.get("content-type") ?? ""
    if (type && !/text\/html|text\/plain|xhtml/i.test(type)) {
      return { ok: false, reason: `That address serves ${type.split(";")[0]}.` }
    }

    const html = await readCapped(response, MAX_BYTES)
    if (html.trim() === "") return { ok: false, reason: "The page came back empty." }

    return {
      ok: true,
      page: {
        url,
        finalUrl: response.url || url,
        title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
        description: metaContent(html, "description"),
        text: readableText(html),
        links: extractLinks(html),
      },
    }
  } catch (error) {
    const name = (error as Error)?.name
    if (name === "TimeoutError" || name === "AbortError") {
      return { ok: false, reason: "The site took too long to answer." }
    }
    return { ok: false, reason: "Couldn't reach the site." }
  }
}

/** A URL with a scheme on it, or null. The pool's addresses are written the
 *  way people say them ("padariasol.pt"), which is also why the facts sheet
 *  refuses native url validation. Anything but http(s) is refused outright —
 *  a `file:` or `data:` address in a column is not a website. */
export function websiteUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withScheme)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

/** Read the body, stopping at `max` bytes. A cap on the *response* rather than
 *  on the text: `content-length` is a hint a server may not send, and the
 *  point is not to pull a video into memory before deciding it wasn't HTML. */
async function readCapped(response: Response, max: number): Promise<string> {
  const body = response.body
  if (!body) return await response.text()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      chunks.push(value)
      size += value.byteLength
      if (size >= max) break
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  const joined = new Uint8Array(size)
  let at = 0
  for (const chunk of chunks) {
    joined.set(chunk.subarray(0, Math.min(chunk.byteLength, size - at)), at)
    at += chunk.byteLength
    if (at >= size) break
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(joined)
}

/**
 * Markup in, prose out.
 *
 * Not a parser and not trying to be one: scripts, styles and comments go
 * (their contents are the bulk of a modern page and none of it is what the
 * business says), tags collapse to spaces, the handful of entities that
 * actually appear in Portuguese copy are decoded, and the result is capped.
 * A model reading six thousand characters of a bakery's home page knows
 * everything this pass can learn.
 */
export function readableText(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
  return decodeEntities(stripped).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT)
}

/**
 * The doors the markup itself carries.
 *
 * Extracted rather than asked for. A model handed a page will happily return
 * `geral@padariasol.pt` because that is what a bakery's address looks like,
 * and a phone number written into a lead's record from a guess is worse than
 * an empty column. So the addresses, numbers and handles come off `href`s and
 * the model is told to choose among them.
 */
export function extractLinks(html: string): WebsitePage["links"] {
  const hrefs = [...html.matchAll(/(?:href|content)\s*=\s*["']([^"']+)["']/gi)].map(
    (match) => decodeEntities(match[1]).trim()
  )

  const emails = new Set<string>()
  const phones = new Set<string>()
  const whatsapp = new Set<string>()
  const instagram = new Set<string>()
  const facebook = new Set<string>()

  for (const href of hrefs) {
    const mail = /^mailto:([^?]+)/i.exec(href)
    if (mail) {
      emails.add(mail[1].trim().toLowerCase())
      continue
    }
    const tel = /^tel:(.+)$/i.exec(href)
    if (tel) {
      phones.add(tel[1].replace(/[^\d+]/g, ""))
      continue
    }
    const chat = /(?:wa\.me|api\.whatsapp\.com\/send)\D*(\d[\d]{6,})/i.exec(href)
    if (chat) {
      whatsapp.add(chat[1])
      continue
    }
    const gram = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(href)
    if (gram && !INSTAGRAM_RESERVED.has(gram[1].toLowerCase())) {
      instagram.add(gram[1].replace(/\/$/, ""))
      continue
    }
    const book = /facebook\.com\/([A-Za-z0-9._-]+)/i.exec(href)
    if (book && !FACEBOOK_RESERVED.has(book[1].toLowerCase())) facebook.add(book[1])
  }

  // Capped: a page linking forty handles is a directory, not a bakery, and the
  // prompt does not need forty of anything.
  const take = (set: Set<string>) => [...set].slice(0, 5)
  return {
    emails: take(emails),
    phones: take(phones),
    whatsapp: take(whatsapp),
    instagram: take(instagram),
    facebook: take(facebook),
  }
}

/** Path segments that are the platform rather than a business — the share and
 *  embed URLs every site carries. */
const INSTAGRAM_RESERVED = new Set(["p", "reel", "reels", "explore", "stories", "tv"])
const FACEBOOK_RESERVED = new Set([
  "sharer",
  "sharer.php",
  "share.php",
  "dialog",
  "plugins",
  "tr",
])

function firstMatch(html: string, pattern: RegExp): string | null {
  const found = pattern.exec(html)?.[1]
  const value = found ? decodeEntities(found).replace(/\s+/g, " ").trim() : ""
  return value === "" ? null : value.slice(0, 200)
}

function metaContent(html: string, name: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["'](?:og:)?${name}["'][^>]*>`,
    "i"
  )
  const tag = pattern.exec(html)?.[0]
  return tag ? firstMatch(tag, /content\s*=\s*["']([^"']*)["']/i) : null
}

/** The entities that actually turn up in a Portuguese small-business page.
 *  Numeric ones are decoded generically; the rest are not worth a table. */
function decodeEntities(value: string): string {
  return value
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&(?:lt|#60);/gi, "<")
    .replace(/&(?:gt|#62);/gi, ">")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&#(\d+);/g, (whole: string, code: string) =>
      codePoint(whole, Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (whole: string, code: string) =>
      codePoint(whole, Number.parseInt(code, 16))
    )
}

/** A numeric entity's character, or the entity left as it was written.
 *  `String.fromCodePoint` throws on anything past U+10FFFF, and a page with a
 *  mangled entity in its footer must not take the whole enrichment down —
 *  which is exactly what it would do, wearing "couldn't reach the site" as its
 *  reason. */
function codePoint(whole: string, code: number): string {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return whole
  try {
    return String.fromCodePoint(code)
  } catch {
    return whole
  }
}

// ---- The prompt -------------------------------------------------------------

/** The two strings a model call takes — the same shape `buildDraftPrompt`
 *  returns, and for the same reason: the system half never changes, so a
 *  Gateway that caches prefixes can. */
export type EnrichmentPrompt = { system: string; prompt: string }

/**
 * What the model is for, and what it is not.
 *
 * The grading rubric is the substance of it. Four words — none, social_only,
 * dated, decent — decide the strongest signal in the tier function, so they
 * are defined by what a visitor would find rather than by taste: a site that
 * cannot be used on a phone, or that says nothing about opening hours, is
 * `dated` whatever it looks like.
 *
 * The rest of the file is spent on the one failure that matters. A model
 * handed a home page will fill nine fields because nine fields were asked for
 * — inventing a town from a Portuguese-sounding name and a sector from a stock
 * photo. Every rule here is a way of saying null is a real answer.
 */
export const ENRICHMENT_SYSTEM = `You are reading one small business's own website for Jamie Nisbet, a solo software engineer and AI consultant in Mafra, Portugal, who is deciding who to approach and what to say.

Return one JSON object and nothing else. No prose, no markdown fences, no commentary.

{
  "website_grade": "none" | "social_only" | "dated" | "decent" | null,
  "sector": string | null,
  "town": string | null,
  "language": "en" | "pt" | "en-pt" | null,
  "hook": string | null,
  "email": string | null,
  "phone": string | null,
  "whatsapp": string | null,
  "instagram": string | null,
  "findings": [string]
}

How to grade the site:
- "decent" — works on a phone, says what they do, and a customer can act: book, order, enquire, or at minimum find hours and a number that is current.
- "dated" — a real site that has stopped being useful: no mobile layout, a menu or price list as a PDF or an image, copyright years long past, a contact form that is the only way through, content that reads abandoned.
- "social_only" — the address is a Facebook or Instagram page, or the site is a one-page placeholder whose real content is a social feed.
- "none" — a parked domain, a hosting placeholder, a "coming soon" page, or a directory listing rather than their own site.
- null — the page does not let you tell.

The other fields:
- "sector" — what this business is, in two or three plain words, in the language the site is written in ("restaurante", "clínica dentária", "builder"). Not a category id, not a marketing phrase.
- "town" — only a Portuguese town named on the page as where they are. Never inferred from the language, the name or the domain.
- "language" — which language THIS BUSINESS reads, judged by the language the site is written in. "en-pt" only when the site genuinely offers both.
- "hook" — one sentence, at most 25 words, naming the specific thing about this site that would make them care. Concrete and checkable ("the menu is a PDF that opens sideways on a phone", "no way to book a table without ringing"). First person is not needed — this is a note, not a message. Never flattery, never a compliment, never a generic observation that would be true of any site. null if the page gives you nothing specific.
- "email", "phone", "whatsapp", "instagram" — choose only from the links listed in the page block. Prefer a general business address (geral@, info@) over a personal one. Phone and WhatsApp are digits and an optional leading +. Instagram is the bare handle without the "@". null when the block lists none.
- "findings" — two to five short lines of what you actually saw: whether a customer can book or order online, how recently the site looks like it was touched, what it seems to be built with, which contact doors it offers. Evidence, not opinion. This is what a person reads to decide whether to believe the grade.

Rules:
- Never invent. Every value must come from the page text or the links listed with it. If the page does not say, the answer is null — nine nulls and three findings is a good response to a thin page.
- Never guess a contact detail. An address that is not in the links block does not exist.
- Do not repeat what is already on the record: you are being asked what the site says, not what to keep.
- Sentence case. No emoji, no exclamation marks, no marketing language.`

/**
 * The user half: this business, and this page.
 *
 * What is already on the record goes in — not so the model can keep it, but so
 * it can tell a fresh finding from a restatement, and so a hook it proposes is
 * different from the one already there rather than a paraphrase of it.
 */
export function buildEnrichmentPrompt(args: {
  lead: EnrichLead
  page: WebsitePage
}): EnrichmentPrompt {
  const { lead, page } = args

  const known = [
    `Business: ${lead.company?.trim() || lead.name}`,
    lead.sector ? `Sector on file: ${lead.sector}` : null,
    lead.town ? `Town on file: ${lead.town}` : null,
    lead.language ? `Language on file: ${clientLanguageLabel(lead.language)}` : null,
    lead.websiteGrade
      ? `Graded on file as: ${websiteGradeLabel(lead.websiteGrade)}`
      : null,
    lead.hook ? `Hook on file: ${lead.hook}` : null,
  ].filter(Boolean)

  const links = [
    labelled("mailto:", page.links.emails),
    labelled("tel:", page.links.phones),
    labelled("WhatsApp:", page.links.whatsapp),
    labelled("Instagram:", page.links.instagram),
    labelled("Facebook:", page.links.facebook),
  ].filter(Boolean)

  return {
    system: ENRICHMENT_SYSTEM,
    prompt: [
      "What is already on the record:",
      ...known.map((fact) => `- ${fact}`),
      "",
      `The page — ${page.url}${page.finalUrl !== page.url ? ` (redirected to ${page.finalUrl})` : ""}:`,
      page.title ? `- Title: ${page.title}` : null,
      page.description ? `- Description: ${page.description}` : null,
      "",
      links.length > 0
        ? ["Links found in the markup:", ...links.map((l) => `- ${l}`)].join("\n")
        : "Links found in the markup: none.",
      "",
      "Page text:",
      page.text === "" ? "(the page carried no readable text)" : page.text,
    ]
      .filter((part) => part !== null)
      .join("\n"),
  }
}

function labelled(label: string, values: readonly string[]): string | null {
  return values.length === 0 ? null : `${label} ${values.join(", ")}`
}

// ---- Reading the answer -----------------------------------------------------

/** How long a proposed hook may be. The column is `text`, so this is about the
 *  sentence rather than the storage: a hook is one line a first message leads
 *  with, and a paragraph is a model padding. */
const HOOK_LIMIT = 240

/**
 * The model's text, validated into a proposal — or null if it did not return
 * usable JSON.
 *
 * Every field is checked against the closed set it belongs to and dropped
 * rather than coerced: `website_grade: "ok"` is not a grade, and storing a
 * word no surface can label is how a column stops meaning anything. The two
 * vocabularies are the same ones the facts sheet validates against, which is
 * the point of them living in `queries/clients.ts`.
 */
export function parseEnrichment(raw: string): EnrichmentProposal | null {
  const json = firstJsonObject(raw)
  if (!json) return null

  const grade = jsonText(json.website_grade)
  const language = jsonText(json.language)

  return {
    websiteGrade: grade && isWebsiteGrade(grade) ? grade : null,
    sector: jsonText(json.sector, 60),
    town: jsonText(json.town, 80),
    language: language && isClientLanguage(language) ? language : null,
    hook: jsonText(json.hook, HOOK_LIMIT),
    email: email(json.email),
    phone: digits(json.phone),
    whatsapp: digits(json.whatsapp),
    // The '@' is punctuation, not data — the same rule the contact sheet
    // follows when a handle is typed in by hand.
    instagram:
      jsonText(json.instagram, 100)?.replace(/^@+/, "").replace(/\/+$/, "") || null,
    findings: findings(json.findings),
  }
}

function email(value: unknown): string | null {
  const found = jsonText(value, 200)?.toLowerCase() ?? null
  return found && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(found) ? found : null
}

/** A number as a person would store it: digits, and a leading + if it had one.
 *  Normalizing to E.164 is `queries/suppressions.ts`'s job and happens on the
 *  way to a suppression check, not here. */
function digits(value: unknown): string | null {
  const found = jsonText(value, 40)
  if (!found) return null
  const cleaned = found.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
  return /\d{6,}/.test(cleaned) ? cleaned : null
}

function findings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => jsonText(entry, 200))
    .filter((entry): entry is string => entry !== null)
    .slice(0, 6)
}

// ---- The review -------------------------------------------------------------

/** One field the proposal would change, with both sides of it. */
export type EnrichmentChange = {
  field: EnrichmentField
  label: string
  /** The stored value, as it reads on screen. Null when the column is empty. */
  current: string | null
  /** What would go in the column — the raw value, not the label. */
  value: string
  /** What that value reads as. Differs from `value` for the two vocabularies:
   *  `social_only` shows as "Social only". */
  proposed: string
  /**
   * True when the column already holds something else.
   *
   * The distinction the whole ticket turns on: filling a blank is a
   * correction, replacing a hook somebody wrote is a decision. Surfaces show
   * these differently and the batch script refuses them outright.
   */
  conflict: boolean
}

/**
 * What this proposal would actually change, in reading order.
 *
 * Fields the model left null are absent — "the page didn't say" is not a
 * change. So are fields whose proposal matches what is stored, which is most
 * of them on a second pass: a review sheet listing nine rows of "Mafra → Mafra"
 * would train a person to accept everything without reading it.
 */
export function enrichmentChanges(
  lead: EnrichLead,
  proposal: EnrichmentProposal
): EnrichmentChange[] {
  const changes: EnrichmentChange[] = []

  for (const field of enrichmentFields) {
    const value = proposal[field]
    if (value === null) continue

    const current = lead[field] ?? null
    if (current !== null && same(current, value)) continue

    changes.push({
      field,
      label: enrichmentFieldLabels[field],
      current: current === null ? null : readable(field, current),
      value,
      proposed: readable(field, value),
      conflict: current !== null,
    })
  }

  return changes
}

/** Two values that mean the same column. Case and spacing only — a proposal of
 *  "Mafra" against a stored "mafra " is not a change worth a row. */
function same(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** A stored value as the UI says it. Only the two closed vocabularies have a
 *  label; everything else is its own text. */
function readable(field: EnrichmentField, value: string): string {
  if (field === "websiteGrade") return websiteGradeLabel(value) ?? value
  if (field === "language") return clientLanguageLabel(value) ?? value
  return value
}

/** The columns an enrichment writes. A deliberate subset of
 *  `ClientProfilePatch` — enrichment cannot touch a name, a deal or a note. */
export type EnrichmentPatch = Partial<
  Record<EnrichmentField, string> & { fitTier: string | null }
>

/**
 * The accepted changes as columns, and the tier those facts come to.
 *
 * One function so the Enrich sheet and the batch script cannot disagree about
 * what accepting a change means. The tier is derived *after* the accepted
 * facts are folded in — that is the whole ordering the ticket asks for, and it
 * is why re-tiering is a re-run rather than a migration.
 *
 * `retier: false` leaves `fit_tier` alone entirely, for the caller that has
 * a tier on file it did not offer to change.
 */
export function enrichmentPatch(args: {
  lead: EnrichLead
  changes: readonly EnrichmentChange[]
  /** Which of them the operator took. */
  accepted: ReadonlySet<EnrichmentField>
  retier?: boolean
}): { patch: EnrichmentPatch; tier: TierVerdict } {
  const patch: EnrichmentPatch = {}
  for (const change of args.changes) {
    if (args.accepted.has(change.field)) patch[change.field] = change.value
  }

  const tier = deriveFitTier(tierFactsAfter(args.lead, patch))
  if (args.retier !== false) patch.fitTier = tier.tier
  return { patch, tier }
}

/** The four tier facts as they would stand once a patch lands — what the sheet
 *  recomputes the tier from as each toggle moves. */
export function tierFactsAfter(
  lead: EnrichLead,
  patch: EnrichmentPatch
): TierFacts {
  return {
    websiteGrade: patch.websiteGrade ?? lead.websiteGrade,
    sector: patch.sector ?? lead.sector,
    town: patch.town ?? lead.town,
    // Never proposed — `review_count` stays hand-entered, which is the
    // ticket's own call: no Places API is worth its key at this scale.
    reviewCount: lead.reviewCount,
  }
}
