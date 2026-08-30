// Which model does what, and whether there is a Gateway to ask at all.
//
// Everything goes through the **Vercel AI Gateway**, which is why there is no
// provider package anywhere in the estate and no SDK client to construct: the
// AI SDK treats a bare `provider/model` string as a Gateway model, so
// `generateText({ model: "openai/gpt-5-nano" })` is the whole integration. One
// key, one bill, one budget, and swapping a model is editing a string in this
// file.
//
// It lives here rather than in the dashboard because the dashboard is no longer
// the only caller. Sequence 5 put drafting on a screen; sequence 7 puts
// enrichment on a screen *and* in `scripts/leads-enrich.ts`, and a batch that
// graded eighty sites with a different model from the one the Enrich sheet uses
// would produce a pool tiered two ways. So the model ids sit beside the prompts
// they belong to — `outreach.ts` and `enrichment.ts` — and
// `websites/admin-dashboard/lib/ai.ts` re-exports them.
//
// This module names models. It does not call one: no AI SDK is imported
// anywhere in this package's `src/`, and the two prompt builders stay pure.
// `generateText` is run by the caller — the dashboard's server action, or the
// operator script, which is the one place `ai` appears as a dependency here.
//
// Nothing downstream of any of it sends anything to anybody. See the estate's
// standing rule, and `.icm/docs/lia-cold-outreach.md` § 6 for the line this
// must not cross.

/**
 * English drafting. Nano-class, and enough for it: an English cold message is
 * four sentences of Jamie's own register, and the prompt in `outreach.ts`
 * carries almost all of the difficulty. At this pool's volume the whole
 * campaign costs well under a euro.
 */
export const DRAFT_MODEL_EN = "openai/gpt-5-nano"

/**
 * Portuguese drafting, one step up — sequence 5 left this call to the session
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
 * Enrichment — reading a page and filling in a form.
 *
 * Back on the cheap model, and the reason is the shape of the task rather than
 * its importance. Drafting in Portuguese is a register problem, where a small
 * model's output is *wrong in a way a human can't fix without rewriting it*.
 * This is extraction against a rubric: the answer is on the page, the output is
 * nine nullable fields, and every one of them is read by a person before it is
 * stored. A nano model that misgrades a site costs one toggle left off; the
 * same model drafting a Portuguese email costs the relationship.
 *
 * It also has to be cheap by the row. The batch script grades the whole pool in
 * one run, and a page is a hundred times the tokens of a draft.
 */
export const ENRICH_MODEL = "openai/gpt-5-nano"

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
 *
 * Two ways to be authenticated, read as one question. `AI_GATEWAY_API_KEY` is
 * the ordinary one and the only one a terminal has; a Vercel deployment also
 * carries an OIDC token the Gateway accepts, so production needs the key only
 * until that is enabled.
 */
export function isGatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
}

/** How much room a draft is given. Four sentences need a couple of hundred
 *  tokens; the rest is headroom for a reasoning model, which spends output
 *  tokens thinking before it writes a word. */
export const DRAFT_MAX_OUTPUT_TOKENS = 2000

/** The same headroom for an enrichment. The object itself is small — nine
 *  short fields and five lines of findings — and the rest is the same
 *  allowance for a model that thinks before it answers. */
export const ENRICH_MAX_OUTPUT_TOKENS = 2000

/**
 * And the same again for a reply triage, which is the two shapes at once: five
 * short fields of classification, and — when the reply warrants one — a whole
 * drafted answer inside the sixth.
 *
 * That answer is why sequence 8 has no model id of its own and calls
 * `draftModelFor` instead. The expensive half of a triage is not deciding that
 * somebody engaged; it is writing back to them in their own language, which is
 * the exact register problem `DRAFT_MODEL_PT` exists for. A Portuguese business
 * that replies in Portuguese and gets a translated-sounding answer has learned
 * the same thing about the sender as if the first message had read that way —
 * and it has learned it at the point where they were actually interested.
 */
export const TRIAGE_MAX_OUTPUT_TOKENS = 2000
