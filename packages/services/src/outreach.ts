import { type CadenceSuggestion } from "./cadence"
import {
  clientLanguageLabel,
  websiteGradeLabel,
  type Client,
} from "./queries/clients"
import {
  touchChannelLabel,
  touchOutcomeLabel,
  type Touch,
  type TouchChannel,
} from "./queries/touches"

// The voice, and everything a draft is grounded on.
//
// Pure, like `cadence.ts` and `deal.ts` beside it: given a lead, a history and
// which rung of the cadence this is, it returns the two strings a model call
// takes. It reads nothing, writes nothing and knows nothing about the AI SDK —
// the Gateway call itself lives in the dashboard
// (`websites/admin-dashboard/lib/ai.ts` and the `generateTouchDraft` action).
//
// It lives here rather than in the app for the reason the cadence does: the
// register a cold message is written in is a fact about the business, not about
// one screen. An operator script drafting from a terminal, the reply triage of
// sequence 8 and the panel on the lead's profile should all sound like the same
// person, and the way to guarantee that is one prompt with one home.
//
// Two things this module deliberately does not do:
//
//   - **It never sends.** Nothing downstream of it does either. The estate's
//     standing rule — no outbound action without review — is why the app's job
//     ends at handing a human a draft.
//   - **It never invents.** Everything concrete in the prompt comes off the
//     row. A model with nothing to say is told to say less, not to fill in.

// ---- The four rungs ---------------------------------------------------------
// Same shape as the touch vocabularies: an ordered set, a label lookup, and a
// guard for the value coming off a form.

/**
 * Which message this is.
 *
 * Not a free choice — they are the cadence's own steps read as messages, which
 * is what lets the panel prefill the right one instead of asking. Step 1 is a
 * `first_touch`, step 2 is the `bump` down a second door, steps 3 and 4 are a
 * `follow_up`, and step 5 is the `breakup` that goes out before they are
 * parked.
 */
export const draftKinds = [
  "first_touch",
  "bump",
  "follow_up",
  "breakup",
] as const
export type DraftKind = (typeof draftKinds)[number]

/** What each one is called on screen. Short: they sit side by side in a
 *  segmented control on a phone. */
export const draftKindLabels: Record<DraftKind, string> = {
  first_touch: "First",
  bump: "Bump",
  follow_up: "Follow-up",
  breakup: "Last one",
}

/** The one lookup that turns a stored kind into UI text. An unrecognised value
 *  falls through to itself, the same way the touch labels do. */
export function draftKindLabel(value: string): string {
  return draftKindLabels[value as DraftKind] ?? value
}

export function isDraftKind(value: string): value is DraftKind {
  return (draftKinds as readonly string[]).includes(value)
}

/**
 * The channels a draft is written *for*.
 *
 * Three of the five, because the other two are not messages: you do not draft
 * a phone call, and a walk-in is a door you knock on. Offering to write one
 * would be the app pretending it can rehearse a conversation, which is exactly
 * the kind of ceremony the 2026-08 reversal removed.
 */
export const draftChannels = ["email", "whatsapp", "instagram"] as const
export type DraftChannel = (typeof draftChannels)[number]

export function isDraftChannel(value: string): value is DraftChannel {
  return (draftChannels as readonly string[]).includes(value)
}

/**
 * Which message the cadence's suggestion is asking for.
 *
 * A `reply` is a follow-up in register — they said something and this answers
 * it — and a `park` is the breakup that goes out before they sleep. Anything
 * unrecognised falls back to a first touch, which is the only kind that is
 * safe to write with no history at all.
 */
export function draftKindFor(
  suggestion: CadenceSuggestion | null | undefined
): DraftKind {
  if (!suggestion) return "first_touch"
  if (suggestion.kind === "park") return "breakup"
  if (suggestion.kind === "reply") return "follow_up"
  switch (suggestion.step) {
    case 1:
      return "first_touch"
    case 2:
      return "bump"
    case 5:
      return "breakup"
    default:
      return "follow_up"
  }
}

// ---- What a draft is grounded on --------------------------------------------

/** What the prompt needs to know about the lead. Structural, like
 *  `CadenceLead`: a whole `Client` row, a list projection and a script's own
 *  object can all be asked for a draft. */
export type DraftLead = Pick<
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
  | "sourceDetail"
>

/** What it needs to know about a touch — enough to say what was tried and what
 *  came of it, and no more. A draft is grounded on the shape of the history,
 *  not on its prose. */
export type DraftTouch = Pick<
  Touch,
  "channel" | "direction" | "outcome" | "note" | "loggedAt"
>

/** The two strings a model call takes. */
export type DraftPrompt = { system: string; prompt: string }

// ---- The voice --------------------------------------------------------------

/**
 * The register, written once.
 *
 * It is `packages/ui/BRAND.md` § Content fundamentals turned into instructions
 * — first person singular, plain and unhurried, sentence case, no emoji, no
 * hype — plus the handful of rules that are specific to a message to a small
 * business in Mafra rather than to the portfolio's prose.
 *
 * The "never" list is the important half. Every phrase in it is one a model
 * reaches for by default and a person never writes, and one of them ("I love
 * your website") is named in the ticket for exactly that reason.
 *
 * It says nothing about *how* the message comes back, and that is deliberate:
 * `OUTREACH_OUTPUT_RULE` below carries that, because sequence 8's reply triage
 * wants this voice inside a JSON field rather than on its own. Every caller
 * that wants a bare message joins the two.
 */
export const OUTREACH_VOICE = `You are writing one short message for Jamie Nisbet to send himself.

Jamie is a solo software engineer and AI consultant based in Mafra, Portugal. He writes to local businesses one at a time, in his own words. You are not writing marketing copy, and you are not writing on behalf of a company — you are writing the message he would type.

Voice:
- First person singular. "I", never "we" — he is one person, and that is the point.
- Plain, direct, unhurried. Concrete outcomes, not adjectives.
- Short sentences, one idea each. An em dash for the aside, not a semicolon.
- Sentence case throughout. No emoji. No exclamation marks. No headings, no bullet lists, no bold.
- Name the real thing where it adds precision; skip buzzwords ("solutions", "leverage", "cutting-edge", "digital presence").

Rules:
- Lead with one specific observation from the grounding — the hook, the state of their site, the review count. One, not three.
- Never flatter, and never open with a compliment. Never write "I love your website", "I came across your page", "I hope this finds you well", "quick question", "just following up", "reaching out".
- Never invent a fact. Everything concrete must come from the grounding below. Where the grounding is thin, say less rather than filling it in.
- Do not promise a result, a price or a timeline. Nothing has been agreed.
- Close with one small, specific next step phrased as a question they can answer in a line.
- Sign off with just "Jamie" on the last line. No title, no company, no links.`

/** How a bare draft comes back. Split out of the voice so a caller that wants
 *  the message *inside* something — the reply triage returns it as one field of
 *  a JSON object — can take the register without the shape. */
export const OUTREACH_OUTPUT_RULE = `Return the message and nothing else: no preamble, no commentary, no quotation marks around it, no markdown fences.`

// ---- Building the prompt ----------------------------------------------------

/**
 * The system and user prompts for one draft.
 *
 * The split is the usual one and it matters here: the system half is the voice
 * and the rules, identical for every lead, so a Gateway that caches prefixes
 * can; the user half is this business and this history, which is the only part
 * that changes.
 */
export function buildDraftPrompt(args: {
  lead: DraftLead
  kind: DraftKind
  channel: DraftChannel
  /** Newest-first or oldest-first, either way — it is sorted here. */
  history: readonly DraftTouch[]
}): DraftPrompt {
  const { lead, kind, channel } = args
  const portuguese = lead.language === "pt"

  return {
    system: [
      OUTREACH_VOICE,
      OUTREACH_OUTPUT_RULE,
      "",
      draftLanguageRule(portuguese),
      "",
      draftChannelRule(channel),
      "",
      kindRule(kind, channel, lead),
    ].join("\n"),
    prompt: [
      draftGroundingBlock(lead),
      "",
      draftHistoryBlock(args.history),
      "",
      `Write the ${kind.replace("_", " ")} message, for ${touchChannelLabel(channel)}, in ${portuguese ? "European Portuguese" : "English"}.`,
    ].join("\n"),
  }
}

/**
 * Which language, and how strictly.
 *
 * `pt` is the only value that changes the answer: `en-pt` means the business
 * reads either, and Jamie's own English is the better message of the two. The
 * Portuguese rule is specific about *which* Portuguese, because the failure
 * mode is not a wrong language — it is a Brazilian one, which reads to a
 * business in Mafra like a message from a call centre.
 */
export function draftLanguageRule(portuguese: boolean): string {
  if (!portuguese) {
    return "Language: write in English. Plain British-flavoured English, not American marketing English."
  }
  return [
    "Language: write in European Portuguese (pt-PT), not Brazilian.",
    "- Use pt-PT vocabulary and spelling: telemóvel, ecrã, ficheiro, utilizador, site. Never celular, tela, arquivo, usuário.",
    "- Address them as você or impersonally — formal but not stiff. Never tu, and never a gerund construction (estou a escrever, not estou escrevendo).",
    "- Write it as a Portuguese speaker would, not as a translation of an English sentence.",
  ].join("\n")
}

/**
 * What the channel does to the shape.
 *
 * The three of them are three different lengths, and getting that wrong is the
 * most visible way a drafted message reads as drafted: five sentences in a
 * WhatsApp bubble is an essay, and one line in an email is abrupt.
 *
 * Email is also the only one that needs a subject, and it is asked for as the
 * first line rather than as a second call — the whole draft is one string, it
 * is stored as one string on the touch, and `splitDraft` in the dashboard is
 * what pulls the subject back out for the `mailto:`.
 */
export function draftChannelRule(channel: DraftChannel): string {
  switch (channel) {
    case "email":
      return [
        "Channel: email. 3 to 5 sentences in the body — a cold email that fills a phone screen does not get read.",
        'Start with a single line "Subject: ..." and then a blank line, and then the message. The subject is at most 60 characters, sentence case, and says the specific thing rather than teasing it. No colon-separated marketing headline.',
      ].join("\n")
    case "whatsapp":
      return [
        "Channel: WhatsApp. 2 to 4 short sentences, no subject line, no greeting block — this is a chat message and it opens straight into the point.",
        "Write it as one paragraph. The first sentence has to work as the notification preview.",
      ].join("\n")
    case "instagram":
      return [
        "Channel: Instagram DM. 2 to 3 short sentences, no subject line, no greeting block.",
        "Shorter and lighter than an email: a DM that reads like a letter reads like a bot.",
      ].join("\n")
  }
}

/**
 * What this rung is for, and — on a first-touch email — the two lines the law
 * puts there.
 *
 * Article 14 (data not obtained from the data subject): the first message says
 * who I am, where the details came from, and how to stop it. The assessment
 * that requires them is `.icm/docs/lia-cold-outreach.md` § 3, and this is the
 * place they are actually written: a first email that leaves them out is the
 * one output of this module that would be a compliance problem rather than a
 * bad draft.
 *
 * Only email carries them, and deliberately. They are the ePrivacy opt-out
 * regime's condition on an *electronic marketing* message; a WhatsApp draft
 * that recited its own provenance in a two-sentence bubble would read as a
 * form letter, which is the thing that makes the whole approach fail.
 */
function kindRule(
  kind: DraftKind,
  channel: DraftChannel,
  lead: DraftLead
): string {
  const lines: string[] = []

  switch (kind) {
    case "first_touch":
      lines.push(
        "This is the first message. They have never heard from Jamie.",
        "Say who he is in one clause — a software engineer nearby — and get to the observation. Do not explain the business he is in.",
        "One line about what he would actually do about the thing you observed. Specific and small."
      )
      break
    case "bump":
      lines.push(
        "They were messaged a few days ago on a different channel and said nothing.",
        "This is the same hook coming through another door, not a repeat: assume they never saw the first one, so it must stand alone, but it must be shorter and lead with a different sentence.",
        "Do not mention the earlier message, and do not apologise for writing again."
      )
      break
    case "follow_up":
      lines.push(
        "There is a history below. Read it: this message continues it.",
        "Two or three sentences. Add one thing that was not in the last message — a second observation, or a smaller ask than the one they did not answer.",
        "Do not recap what was already sent, and do not ask whether they saw it."
      )
      break
    case "breakup":
      lines.push(
        "This is the last message before they are left alone.",
        "Say plainly that this is the last one and that the door stays open. No guilt, no urgency, no discount, no deadline.",
        "Two or three sentences, and it should be easy to reply to with a single word."
      )
      break
  }

  if (kind === "first_touch" && channel === "email") {
    lines.push(
      "",
      "This email must also carry two short lines, in the message's own language, after the message and before the sign-off:",
      `1. Where the details came from — ${sourceLine(lead)}.`,
      `2. How to stop — the equivalent of "Reply 'remove' and I won't contact you again."`,
      "Plain sentences on their own lines, not a footer and not in brackets. They are the reason this email is allowed to exist, so they are written like the rest of it."
    )
  }

  return lines.join("\n")
}

/** Where this row's details actually came from, in the words the message can
 *  use. The import stamps `source_detail` with the batch it came in on; a lead
 *  typed in by hand has nothing but their own website, which is still the true
 *  answer. */
function sourceLine(lead: DraftLead): string {
  if (lead.websiteUrl) return "their own website"
  if (lead.sourceDetail) return `a public listing (${lead.sourceDetail})`
  return "their public listing"
}

/** Everything true about this business that a message may lean on, one fact per
 *  line. Absent facts are absent rather than "unknown": a line that says
 *  nothing is a line a model will try to fill. */
export function draftGroundingBlock(lead: DraftLead): string {
  const facts: (string | null)[] = [
    `Business: ${lead.company?.trim() || lead.name}`,
    lead.company?.trim() && lead.company.trim() !== lead.name
      ? `Person to address: ${lead.name}`
      : null,
    lead.sector ? `Sector: ${lead.sector}` : null,
    lead.town ? `Town: ${lead.town}` : null,
    lead.language ? `Reads: ${clientLanguageLabel(lead.language)}` : null,
    lead.websiteUrl ? `Website: ${lead.websiteUrl}` : null,
    lead.websiteGrade
      ? `Website, as graded: ${websiteGradeLabel(lead.websiteGrade)}`
      : null,
    typeof lead.reviewCount === "number"
      ? `Google reviews: ${lead.reviewCount}`
      : null,
    lead.hook ? `The hook — why they would care: ${lead.hook}` : null,
  ]

  return ["The business:", ...facts.filter(Boolean).map((f) => `- ${f}`)].join(
    "\n"
  )
}

/** What has already been tried, oldest first — the shape of the history rather
 *  than its prose, plus whatever note was left, which is the only part that
 *  ever says what was actually discussed. */
export function draftHistoryBlock(history: readonly DraftTouch[]): string {
  if (history.length === 0) {
    return "History: nothing has been sent to them yet."
  }

  const ordered = [...history].sort(
    (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime()
  )

  return [
    "What has happened so far, oldest first:",
    ...ordered.map((touch) => {
      const who = touch.direction === "in" ? "they got in touch" : "Jamie wrote"
      const note = touch.note?.trim()
      return `- ${day(touch.loggedAt)} · ${touchChannelLabel(touch.channel)} · ${who} · ${touchOutcomeLabel(touch.outcome)}${note ? ` — note: ${note}` : ""}`
    }),
  ].join("\n")
}

/** `2026-08-30`. Unambiguous to a model in any locale, which a "30/08" is
 *  not — and this is the one place in the estate where a date is being read by
 *  something other than a person. */
function day(at: Date): string {
  return at.toISOString().slice(0, 10)
}

/** Narrowing helper for the channels a caller already holds as a
 *  `TouchChannel`: the drafting surface offers three of the five, and this is
 *  what says which one a cadence suggestion landed on. */
export function draftChannelOf(
  channel: TouchChannel | null | undefined
): DraftChannel | null {
  return channel && isDraftChannel(channel) ? channel : null
}
