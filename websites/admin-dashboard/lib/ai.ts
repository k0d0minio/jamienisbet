import "server-only"

// The dashboard's one line to a language model, and the only file in the estate
// that names one.
//
// It goes through the **Vercel AI Gateway**, which is why there are no provider
// packages here and no SDK client to construct: the AI SDK treats a bare
// `provider/model` string as a Gateway model, so `generateText({ model:
// "openai/gpt-5-nano" })` is the whole integration. One key, one bill, one
// budget, and swapping a model is editing a string in this file.
//
// Auth is `AI_GATEWAY_API_KEY`, or nothing at all once deployed: a Vercel
// deployment carries an OIDC token the Gateway accepts, so production needs the
// key only until that is enabled. Both are read the same way — as "is there a
// way to authenticate" — because the surface's only question is whether to draw
// the drafting affordance at all.
//
// Nothing here sends anything to anybody. The Gateway returns text; a human
// reads it, edits it, and sends it from their own mailbox. See the estate's
// standing rule, and `.icm/docs/lia-cold-outreach.md` § 6 for the line this
// must not cross.

/**
 * English drafting. Nano-class, and enough for it: an English cold message is
 * four sentences of Jamie's own register, and the prompt in
 * `@jamie-nisbet/services` § outreach carries almost all of the difficulty.
 * At this pool's volume the whole campaign costs well under a euro.
 */
export const DRAFT_MODEL_EN = "openai/gpt-5-nano"

/**
 * Portuguese drafting, one step up — the ticket left this call to the session
 * and this is it.
 *
 * The reason is not that pt-PT is harder to *translate*: it is that a nano
 * model writes the Portuguese of a translation — Brazilian vocabulary, gerund
 * constructions, the stiff over-formal register of a bank letter — and the
 * entire value of these drafts is that they sound like a person in Mafra typed
 * them. A message that reads as translated is worse than no message, because it
 * is the exact signal a small business uses to spot a mailshot.
 *
 * Haiku-class costs roughly twenty times nano per token, which on a message
 * this short is a rounding error against the Gateway budget and cheap against
 * one prospect answering.
 */
export const DRAFT_MODEL_PT = "anthropic/claude-haiku-4.5"

/**
 * Which model writes this lead's message.
 *
 * `pt` is the only value that steps up. `en-pt` means the business reads either
 * and Jamie's own English is the better of the two messages, so it stays on the
 * cheap model along with `en` and an unset language.
 */
export function draftModelFor(language: string | null | undefined): string {
  return language === "pt" ? DRAFT_MODEL_PT : DRAFT_MODEL_EN
}

/**
 * True when the Gateway can be reached at all — the same "configured?" check
 * the Stripe and GitHub integrations use, and read by the lead profile so a
 * dashboard with no key degrades to a stated absence instead of a button that
 * fails.
 */
export function isGatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
}

/** How much room a draft is given. Four sentences need a couple of hundred
 *  tokens; the rest is headroom for a reasoning model, which spends output
 *  tokens thinking before it writes a word. */
export const DRAFT_MAX_OUTPUT_TOKENS = 2000
