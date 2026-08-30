"use server"

import { revalidatePath } from "next/cache"
import { generateText } from "ai"

import {
  buildDraftPrompt,
  completeComplianceDate,
  createClientManually,
  createComplianceDate,
  createFormLink,
  createTask,
  deleteClient,
  deleteComplianceDate,
  deleteFormLink,
  deleteTask,
  getClient,
  getFormLink,
  isBillingType,
  isClientLanguage,
  isClientStatus,
  isComplianceRecurrence,
  isDealType,
  isDraftChannel,
  isDraftKind,
  isFitTier,
  isSuppressed,
  isTouchChannel,
  isTouchDirection,
  isTouchOutcome,
  isWebsiteGrade,
  listTouchesForClient,
  logTouch,
  NURTURE_WAKE_DAYS,
  parkClient,
  setClientArchived,
  setClientNextAction,
  setClientRepo,
  setClientStatus,
  setClientWakeAt,
  setClientWorkStarted,
  setTaskClient,
  setTaskCompleted,
  suggestNextTouch,
  suppressClient,
  suppressionKindLabel,
  touchClient,
  updateClient,
  type CadenceSuggestion,
  type ClientProfilePatch,
  type DraftChannel,
} from "@jamie-nisbet/services"

import {
  DRAFT_MAX_OUTPUT_TOKENS,
  draftModelFor,
  isGatewayConfigured,
} from "@/lib/ai"
import { ensureStripeCustomer, pushClientToStripe } from "@/lib/clients-stripe"
import { renderFormAnswersMarkdown } from "@/lib/form-markdown"
import { scaffoldIcmBaseline } from "@/lib/icm-scaffold"
import { loadOnboardingForm } from "@/lib/onboarding"
import { parseAmountToMinor } from "@/lib/money"
import { parsePercentToBps } from "@/lib/percent"
import { formLinkUrl } from "@/lib/portfolio"
import { getStripe } from "@/lib/stripe"
import {
  clientSlug,
  commitRepoFile,
  createRepo,
  getRepo,
  isGithubConfigured,
  listAccessibleRepos,
  type RepoListing,
  type RepoSummary,
} from "@/lib/github"

// Three screens read a lead: the Needs you feed at "/" (whose first section is
// the ones that have gone quiet), the list at "/leads", and the profile at
// "/leads/<id>". An edit anywhere has to refresh all three — marking someone
// touched is exactly the write that should drop them out of the feed.
function revalidateLead(id: string) {
  revalidateLeadLists()
  revalidatePath(`/leads/${id}`)
}

/** The two screens that list leads, todos and compliance dates. */
function revalidateLeadLists() {
  revalidatePath("/")
  revalidatePath("/leads")
}

// ---- Status & profile -------------------------------------------------------

export async function updateClientStatus(id: string, status: string) {
  if (!isClientStatus(status)) {
    throw new Error(`Unknown lead status: ${status}`)
  }
  await setClientStatus(id, status)
  revalidateLead(id)
}

/** Stamp the lead as worked today without changing anything else — the manual
 * counterpart to a status change, for a call or an email sent from elsewhere. */
export async function markTouched(id: string) {
  await touchClient(id)
  revalidateLead(id)
}

/** "The work has begun." Its own flag rather than another status, because it is
 * orthogonal to where the deal sits: delivery can start on a handshake before
 * anything is signed, and on a barter or equity deal there is no first invoice
 * in Stripe to signal it. Toggling off is for when it was hit by mistake. */
export async function setWorkStarted(id: string, started: boolean) {
  await setClientWorkStarted(id, started)
  revalidateLead(id)
}

// The profile is edited in slices — contact, notes, deal — each from its own
// sheet on the lead's page, so no form ever posts fields it didn't show.
// Empty strings become null so a cleared field doesn't persist as "".

/**
 * The contact slice of the profile on its own — who they are and how to reach
 * them, across all four channels the outreach actually uses. Touches nothing
 * about the deal or the cold-pool facts, so the contact edit sheet on a lead's
 * page can never zero a value it didn't show.
 */
export async function saveClientContact(id: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const patch: ClientProfilePatch = {
    email: value("email"),
    phone: value("phone"),
    company: value("company"),
    // Null means "the phone number is the WhatsApp number", which is true of
    // almost every business in the pool — the column is for the ones where it
    // isn't. The handle is stored bare; the '@' is punctuation, not data.
    whatsapp: value("whatsapp"),
    instagram: value("instagram")?.replace(/^@+/, "") || null,
  }
  // `name` is NOT NULL — an emptied field leaves the existing name untouched.
  const name = value("name")
  if (name !== null) patch.name = name

  const updated = await updateClient(id, patch)
  const stripe = getStripe()
  if (stripe && updated) await pushClientToStripe(stripe, updated)
  revalidateLead(id)
}

/**
 * The facts slice — what a business is, where it is, and why it would care.
 * Its own action for the same reason the deal has one: the facts sheet posts
 * only the facts, so saving them can never blank a contact detail it never
 * showed, and vice versa.
 *
 * Every field is validated here rather than trusted from the form, because
 * three of them are closed vocabularies (`language`, `fit_tier`,
 * `website_grade`) stored as plain varchars — nothing at the database level
 * would catch a value the app doesn't name. An unrecognised one clears the
 * column instead of storing a word no surface can label; that is also how the
 * sheet's "Not set" option arrives, since a Radix select can't carry an empty
 * value.
 *
 * `source_detail` is not here on purpose: which batch a row was imported in is
 * provenance, like `source`, and is not something you fix by typing over it.
 */
export async function saveClientFacts(id: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const language = value("language")
  const fitTier = value("fitTier")
  const websiteGrade = value("websiteGrade")

  // A count, so it is read as one: anything that isn't a non-negative whole
  // number is "nobody has looked", not a zero somebody meant.
  const rawReviews = value("reviewCount")
  const reviews = rawReviews === null ? null : Number.parseInt(rawReviews, 10)
  const reviewCount =
    reviews === null || Number.isNaN(reviews) || reviews < 0 ? null : reviews

  await updateClient(id, {
    sector: value("sector"),
    town: value("town"),
    language: language && isClientLanguage(language) ? language : null,
    hook: value("hook"),
    fitTier: fitTier && isFitTier(fitTier) ? fitTier : null,
    websiteUrl: value("websiteUrl"),
    websiteGrade:
      websiteGrade && isWebsiteGrade(websiteGrade) ? websiteGrade : null,
    reviewCount,
  })
  revalidateLead(id)
}

/** Working notes on their own, for the notes edit sheet. */
export async function saveClientNotes(id: string, formData: FormData) {
  const raw = formData.get("notes")
  const notes = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null
  await updateClient(id, { notes })
  revalidateLead(id)
}

/**
 * The deal-terms slice of the profile on its own — what the deal edit sheet
 * saves. Touches only the deal, so it can never blank a contact field the way
 * posting a partial profile form through `saveClientProfile` would.
 *
 * Every component is read only when the form actually posted it, so any subset
 * saves: a form carrying nothing but a percentage sets that percentage and
 * leaves the euros alone, and a form that posts an empty value field clears the
 * cash from a deal that still has its equity. Nothing here gates anything else
 * — a deal is whatever components it ends up with, and none of them is
 * required (see `dealComponents` in the services layer).
 */
export async function saveDealTerms(id: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const patch: ClientProfilePatch = {}

  // A cleared value field means "no cash in this deal" — which is a whole,
  // valid deal when there is equity, a commission or a swap alongside it.
  if (formData.has("value")) {
    const raw = value("value")
    patch.valueMinor = raw === null ? 0 : (parseAmountToMinor(raw) ?? 0)
  }

  if (formData.has("billingType")) {
    const raw = String(formData.get("billingType"))
    patch.billingType = isBillingType(raw) ? raw : "one_off"
  }

  // How to read the € figure. Cash is the ordinary case, so an unrecognised
  // value falls back to it — and picking cash is what retires a swap's terms.
  if (formData.has("dealType")) {
    const raw = String(formData.get("dealType"))
    patch.dealType = isDealType(raw) ? raw : "cash"
    patch.barterTerms = patch.dealType === "barter" ? value("barterTerms") : null
  } else if (formData.has("barterTerms")) {
    patch.barterTerms = value("barterTerms")
  }

  // A cleared percentage means "not part of this deal" (null, not zero — zero
  // would read as a nil cut deliberately agreed).
  if (formData.has("commission")) {
    const raw = value("commission")
    patch.commissionBps = raw === null ? null : parsePercentToBps(raw)
  }
  if (formData.has("equity")) {
    const raw = value("equity")
    patch.equityBps = raw === null ? null : parsePercentToBps(raw)
  }

  const updated = await updateClient(id, patch)
  const stripe = getStripe()
  if (stripe && updated) await pushClientToStripe(stripe, updated)
  revalidateLead(id)
}

/** Add a lead or a client by hand — the meetup contact, the word-of-mouth
 * introduction, the client who was already paying before this dashboard
 * existed. One row per person either way; `status` is the only thing that says
 * which of the two you just typed in. Everything except the name is optional
 * and can be filled in later on the profile. */
export async function addClient(formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const name = value("name")
  if (!name) throw new Error("A lead needs a name.")

  // The form offers "Lead" and "Active client", which post "lead" and "active"
  // — but the action is the authority, so anything unrecognised falls back to a
  // new lead rather than reaching the insert.
  const rawStatus = value("status") ?? "lead"
  const status = isClientStatus(rawStatus) ? rawStatus : "lead"

  const rawBilling = value("billingType") ?? "one_off"
  const billingType = isBillingType(rawBilling) ? rawBilling : "one_off"

  // Whether the figure below is money or a swap. The one deal term worth asking
  // for this early: everything else (commission, equity, what's being exchanged)
  // distorts no total if it waits for the profile, but a barter figure filed as
  // cash overstates the pipeline from the moment it's typed.
  const rawDealType = value("dealType") ?? "cash"
  const dealType = isDealType(rawDealType) ? rawDealType : "cash"

  // Typed in major units ("1500", "2,500.00"); no figure means zero, same as a
  // profile whose value has never been set.
  const rawValue = value("value")
  const valueMinor = rawValue === null ? 0 : (parseAmountToMinor(rawValue) ?? 0)

  await createClientManually({
    name,
    email: value("email"),
    phone: value("phone"),
    company: value("company"),
    intakeMessage: value("intakeMessage"),
    notes: value("notes"),
    status,
    valueMinor,
    billingType,
    dealType,
  })
  revalidateLeadLists()
}

// Create (or adopt) and link a Stripe customer for this lead on demand — the
// same resolution the invoice flow uses, exposed as an explicit action so the
// owner can pre-link someone before billing them.
export async function linkClientToStripe(id: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured in this environment.")
  const client = await getClient(id)
  if (!client) throw new Error("That lead no longer exists.")
  await ensureStripeCustomer(stripe, client)
  revalidateLead(id)
}

// ---- The touch log and the next step ----------------------------------------
// The two writes the lead engine runs on. Logging a touch is the ten-second
// gesture the whole flow is built around — two taps, a note if there is time —
// and what comes back from it is the cadence's suggestion for what happens
// next, which the sheet prefills.
//
// Nothing here refuses a save for a missing next action. That is the gentle
// invariant (Jamie's decision 7): dismissing the suggestion is a real answer,
// and what notices the gap afterwards is a read — the crack-finder queries in
// the services layer — not a required field.

/** What the log sheet gets back so it can prefill the next step. The dates
 *  cross as ISO strings, because a server action's return value is serialized
 *  and the sheet's date field wants the `YYYY-MM-DD` slice anyway. */
export type NextStepSuggestion = {
  kind: CadenceSuggestion["kind"]
  step: number | null
  steps: number
  channel: string | null
  action: string
  dueAt: string
  /** Set only when the cadence is spent: park them, waking on this date. */
  wakeAt: string | null
}

/** Returned rather than thrown for the reason the form actions are: Next
 *  redacts server-action exceptions in production, and this call's whole point
 *  is the value it carries back. */
export type LogTouchResult =
  | { ok: true; suggestion: NextStepSuggestion | null }
  | { ok: false; message: string }

/**
 * Record a touch and work out what happens next.
 *
 * The suggestion is computed here rather than in the browser because it reads
 * the history — including the row this call just wrote — and because the
 * cadence is a model rule, not a rendering one. It is only ever a suggestion:
 * this action never writes `next_action` itself, which is what makes
 * dismissing it free.
 */
export async function logTouchAction(
  clientId: string,
  formData: FormData
): Promise<LogTouchResult> {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const channel = value("channel")
  const outcome = value("outcome")
  // Both are closed vocabularies stored as plain varchars, so this is the only
  // thing standing between a mistyped form and a word no surface can label.
  if (!channel || !isTouchChannel(channel)) {
    return { ok: false, message: "Pick a channel for that touch." }
  }
  if (!outcome || !isTouchOutcome(outcome)) {
    return { ok: false, message: "Pick what came of it." }
  }
  const rawDirection = value("direction") ?? "out"
  const direction = isTouchDirection(rawDirection) ? rawDirection : "out"

  try {
    const client = await getClient(clientId)
    if (!client) return { ok: false, message: "That lead no longer exists." }

    await logTouch({
      clientId,
      channel,
      direction,
      outcome,
      note: value("note"),
      // Set only by the draft panel, which logs the message it just handed
      // over. Capped rather than trusted: the field arrives from a textarea
      // Jamie can type into, and the column is unbounded text.
      draftMd: value("draftMd")?.slice(0, DRAFT_LIMIT) ?? null,
      model: value("model")?.slice(0, 80) ?? null,
    })
    revalidateLead(clientId)

    // Read the history back rather than appending to what the browser sent:
    // the suggestion depends on how many times this lead has been reached out
    // to in total, which only the table knows.
    const history = await listTouchesForClient(clientId)
    const suggestion = suggestNextTouch(client, history)
    return { ok: true, suggestion: suggestion ? serialize(suggestion) : null }
  } catch (err) {
    console.error("[touches] log failed:", err)
    return { ok: false, message: "Couldn't log that touch." }
  }
}

function serialize(suggestion: CadenceSuggestion): NextStepSuggestion {
  return {
    kind: suggestion.kind,
    step: suggestion.step,
    steps: suggestion.steps,
    channel: suggestion.channel,
    action: suggestion.action,
    dueAt: suggestion.dueAt.toISOString(),
    wakeAt: suggestion.park?.wakeAt.toISOString() ?? null,
  }
}

/**
 * Set what happens next — the suggestion accepted, edited, or decided from
 * scratch on the masthead.
 *
 * A `park` flag turns the same submission into the other decision the cadence
 * can reach: nurture them, waking on the date in the field. It is one action
 * because it is one gesture — the sheet that offers "set this next step" is
 * the sheet that offers "park them" when the cadence is spent, and they are
 * mutually exclusive answers to the same question.
 *
 * An empty action clears the next step, which is how dismissing works.
 */
export async function saveNextAction(clientId: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const dueRaw = value("dueDate")
  let dueAt: Date | null = null
  if (dueRaw !== null) {
    const parsed = new Date(dueRaw)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Enter a valid date, or leave it empty.")
    }
    dueAt = parsed
  }

  if (formData.get("park") === "1") {
    // Parking needs a date to wake on — without one the row would sleep
    // forever, which is the thing `nurture` was invented not to be. Ninety days
    // is the cadence's own answer, so an empty field falls back to it rather
    // than refusing the gesture.
    await parkClient(clientId, dueAt ?? addDays(new Date(), 90))
    revalidateLead(clientId)
    return
  }

  const action = value("action")
  await setClientNextAction(clientId, action ? { action, dueAt } : null)
  revalidateLead(clientId)
}

/** Dismiss the next step. Its own call so the masthead's "Clear" is one tap
 *  rather than a form posted empty. */
export async function clearNextAction(clientId: string) {
  await setClientNextAction(clientId, null)
  revalidateLead(clientId)
}

// ---- Wakes ------------------------------------------------------------------
// The two answers a woken nurture row can be given from the feed. Both are one
// tap, and neither opens anything: the whole value of the wakes section is that
// a parked relationship whose date has come is decided in the time it takes to
// read the name, or it silently becomes a parked relationship nobody decides
// about — which is what `nurture` was invented not to be.

/** What a re-promoted row is told to do. Deliberately not a cadence step: the
 *  cadence is spent (that is why they were parked), and ninety days on, the
 *  honest instruction is to open the conversation again rather than to send
 *  rung six of a template that already ran out. */
const WAKE_ACTION = "Get back in touch"

/**
 * Pick a parked relationship back up: onto `prospect`, with a fresh next
 * action due today.
 *
 * Two writes rather than one call because they are two facts — where they sit
 * and what is owed — and `setClientStatus` is what clears the wake date on the
 * way out, since a date to come back is not about a row that has come back.
 */
export async function wakeProspect(id: string) {
  await setClientStatus(id, "prospect")
  await setClientNextAction(id, { action: WAKE_ACTION, dueAt: new Date() })
  revalidateLead(id)
}

/** "Not this quarter either." Pushes the wake out by the cadence's own ninety
 *  days and leaves everything else alone — the row stays parked, and stays out
 *  of every queue until the new date comes. */
export async function pushWake(id: string) {
  await setClientWakeAt(id, addDays(new Date(), NURTURE_WAKE_DAYS))
  revalidateLead(id)
}

function addDays(from: Date, days: number): Date {
  const at = new Date(from.getTime())
  at.setDate(at.getDate() + days)
  return at
}

// ---- Drafting ---------------------------------------------------------------
// AI comes back to the dashboard here, and on the other side of the standing
// rule from where it was when the 2026-08 reversal removed it: this composes,
// and a human sends. There is no Resend in this app, no auto-send path, no
// document ceremony and no provenance table — a draft is a string, it is
// handed over per channel, and if it is worth keeping it rides along on the
// touch that was logged. Disposable by design.
//
// A server action rather than an API route, because that is what it is: one
// screen calling one function with an id. No new HTTP surface exists on the
// admin app (Jamie's decision 8), and none is added here.

/** How long a draft may be, in and out. Four sentences is a few hundred
 *  characters; this is the ceiling that stops a pasted essay reaching either
 *  the model or the column. */
const DRAFT_LIMIT = 4000

export type GenerateDraftResult =
  | { ok: true; draft: string; model: string }
  | { ok: false; message: string }

/**
 * Write one message for this lead, on this channel, at this rung of the
 * cadence.
 *
 * Returned rather than thrown, like every other action whose result a sheet has
 * to render: Next redacts server-action exceptions in production, and the value
 * is the whole point of the call.
 *
 * Grounding is everything on the row plus the history — assembled by
 * `buildDraftPrompt` in @jamie-nisbet/services, which is where the voice lives
 * so that a script drafting from a terminal sounds like this screen does.
 *
 * Two refusals, both before the Gateway is touched:
 *
 *   - **A closed channel.** Somebody who opted out gets no draft, not just no
 *     send button — the app must not be able to produce the message at all.
 *     `.icm/docs/lia-cold-outreach.md` § 4 names this as sequence 5's job.
 *   - **No Gateway.** Unconfigured degrades to a stated absence, the same way
 *     Stripe and GitHub do, rather than to a failing button.
 */
export async function generateTouchDraft(
  clientId: string,
  kind: string,
  channel: string
): Promise<GenerateDraftResult> {
  if (!isDraftKind(kind)) {
    return { ok: false, message: "Pick which message this is." }
  }
  if (!isDraftChannel(channel)) {
    return { ok: false, message: "Pick a channel to write for." }
  }
  if (!isGatewayConfigured()) {
    return {
      ok: false,
      message: "Drafting isn't configured — the Gateway key is missing.",
    }
  }

  try {
    const client = await getClient(clientId)
    if (!client) return { ok: false, message: "That lead no longer exists." }

    const closed = await isChannelClosed(client, channel)
    if (closed) {
      return {
        ok: false,
        message: "They opted out on this channel — nothing goes out here.",
      }
    }

    const history = await listTouchesForClient(clientId)
    const { system, prompt } = buildDraftPrompt({
      lead: client,
      kind,
      channel,
      history,
    })

    const model = draftModelFor(client.language)
    const { text } = await generateText({
      // A bare "provider/model" string is a Vercel AI Gateway model — see
      // lib/ai.ts, which is the one place either id is written down.
      model,
      system,
      prompt,
      maxOutputTokens: DRAFT_MAX_OUTPUT_TOKENS,
      // One retry, not three. This is a phone waiting on a sheet, and a
      // second failure is worth saying out loud rather than sitting through.
      maxRetries: 1,
    })

    const draft = text.trim()
    if (draft === "") {
      return { ok: false, message: "The model came back empty. Try again." }
    }
    return { ok: true, draft: draft.slice(0, DRAFT_LIMIT), model }
  } catch (err) {
    console.error("[drafts] generate failed:", err)
    return { ok: false, message: "Couldn't write that one. Try again." }
  }
}

/** Whether this lead's door on that channel has been closed. WhatsApp follows
 *  the number rather than the column — their own line when they have one, the
 *  phone number otherwise — which is the same rule every wa.me link in the app
 *  already follows. */
async function isChannelClosed(
  client: {
    email: string | null
    phone: string | null
    whatsapp: string | null
    instagram: string | null
  },
  channel: DraftChannel
): Promise<boolean> {
  switch (channel) {
    case "email":
      return isSuppressed("email", client.email)
    case "whatsapp":
      return isSuppressed("phone", client.whatsapp ?? client.phone)
    case "instagram":
      return isSuppressed("instagram", client.instagram)
  }
}

// ---- Opt-outs ---------------------------------------------------------------
// The one gesture on this page that can't be taken back, and the legal floor
// under everything the lead engine does. Somebody said "take me off your list",
// so every channel closes at once, the relationship ends, and the reason goes
// into the record — see `suppressClient` in the services layer, which is where
// all four of those writes actually happen so the operator scripts get the
// same behaviour without repeating them.
//
// The suppression is keyed to the contact points, not to this lead, which is
// what makes it survive an archive, a delete, a retention purge and the next
// import of the same business.

/** What was closed, ready to be read back to the user — the kinds already
 *  turned into their labels, since nothing on the client side holds this
 *  vocabulary. */
export type SuppressResult =
  | { ok: true; closed: string[] }
  | { ok: false; message: string }

/**
 * Record an opt-out for this lead and end the relationship.
 *
 * Returned rather than thrown, like the other actions whose result the sheet
 * has to render: Next redacts server-action exceptions in production, and what
 * comes back here is the confirmation — which channels are now closed.
 *
 * A lead with no contact details on file is still suppressed as far as the
 * ladder goes (they asked, so the relationship is over) but nothing goes into
 * the table, because there is no contact point to key it to. The result says
 * so rather than reporting a success that closed nothing.
 */
export async function suppressClientContacts(
  clientId: string,
  formData: FormData
): Promise<SuppressResult> {
  const raw = formData.get("reason")
  const reason = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null

  try {
    const result = await suppressClient(clientId, reason)
    if (!result) return { ok: false, message: "That lead no longer exists." }
    revalidateLead(clientId)
    return {
      ok: true,
      closed: [
        ...new Set(result.points.map((point) => suppressionKindLabel(point.kind))),
      ],
    }
  } catch (err) {
    console.error("[suppressions] suppress failed:", err)
    return { ok: false, message: "Couldn't record that opt-out." }
  }
}

// ---- Delivery repo ---------------------------------------------------------
// Once a lead becomes a customer, their work lives in its own repo. Connect an
// existing one or spin up a fresh one from the profile; the pointer is stored
// on the lead so the dashboard always knows where the delivery work lives.

// The candidate list for the "connect existing" picker, and what GitHub said
// if it couldn't be read. An empty list when GitHub is unconfigured is a
// stated absence the UI reads as "creation only"; an empty list because the
// call *failed* is a different thing, and the picker says which rather than
// presenting a rate-limited account as one with no repos.
export async function listConnectableRepos(): Promise<RepoListing> {
  return listAccessibleRepos()
}

// A sensible default repo name for a new client repo: a lowercase snake_case
// slug derived from the lead's name.
export async function suggestedRepoName(id: string): Promise<string> {
  const client = await getClient(id)
  return clientSlug(client?.name ?? "client")
}

// Connect an existing repo ("owner/name"). Validated against GitHub so we never
// store a dangling pointer, and the resolved default branch is cached alongside.
export async function connectClientRepo(id: string, fullName: string) {
  const trimmed = fullName.trim()
  if (!/^[^/\s]+\/[^/\s]+$/.test(trimmed)) {
    throw new Error('Enter the repo as "owner/name".')
  }
  const repo = await getRepo(trimmed)
  if (!repo) {
    throw new Error(
      "That repo doesn't exist or isn't visible to the configured GitHub token."
    )
  }
  await setClientRepo(id, {
    githubRepo: repo.fullName,
    githubDefaultBranch: repo.defaultBranch,
  })
  revalidateLead(id)
}

export type CreateClientRepoResult = {
  repo: RepoSummary
  /**
   * Null when the baseline landed. A sentence to put on screen otherwise —
   * the repo is created and connected either way, so this is a warning about
   * the seeding, never a failure of the create.
   *
   * Returned rather than thrown for the same reason `sendFormToClient` returns
   * its errors: Next redacts server-action exceptions in production, and the
   * detail is the whole value of the message.
   */
  scaffoldError: string | null
}

// Create a fresh delivery repo for this client and connect it in one step.
// Private by default; the created repo's actual full name (owner may differ from
// the token account via GITHUB_REPO_OWNER) and branch are what we store.
//
// A new repo is then seeded with the estate's baseline — `.icm/` so it shows up
// on the tickets board (empty, not absent), plus the canonical root rails — and
// so passes `icm-check.sh` from minute one rather than waiting for someone to
// hand-create the folders. Its Layer 0 and `.claude/` are deliberately left to
// `/project` adoption and `icm-check.sh --fix`; `lib/icm-scaffold.ts` says why.
export async function createClientRepo(
  id: string,
  input: { name: string; description?: string; isPrivate?: boolean }
): Promise<CreateClientRepoResult> {
  if (!isGithubConfigured()) {
    throw new Error("GitHub is not configured in this environment.")
  }
  const name = input.name.trim()
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(
      "Repo name may only contain letters, numbers, and . _ - characters."
    )
  }
  const repo = await createRepo({
    name,
    description: input.description?.trim() || null,
    private: input.isPrivate ?? true,
  })
  // Store the pointer *before* seeding. From here on the repo exists on GitHub,
  // and a scaffold that fails must never cost the lead its link to it — the
  // baseline can be seeded later by hand or by `icm-check.sh --fix`.
  await setClientRepo(id, {
    githubRepo: repo.fullName,
    githubDefaultBranch: repo.defaultBranch,
  })
  const scaffold = await scaffoldIcmBaseline(repo.fullName)
  if (scaffold.error) {
    console.error("[repo] ICM scaffold failed:", scaffold.error)
  }
  revalidateLead(id)
  return {
    repo,
    scaffoldError: scaffold.error
      ? `${repo.fullName} was created and connected, but its baseline didn't land: ${scaffold.error}. Seed it by hand or with icm-check.sh --fix.`
      : null,
  }
}

// Drop the pointer (the repo itself is untouched on GitHub).
export async function disconnectClientRepo(id: string) {
  await setClientRepo(id, null)
  revalidateLead(id)
}

// ---- Customer questionnaires ------------------------------------------------
// Publish a markdown questionnaire from `.icm/onboarding/` as a one-off link for
// this lead. The link is *handed over*, never sent from here: per the estate's
// "no outbound action without review" rule the dashboard's job ends at offering
// the URL — to a share sheet, a clipboard, a mail draft or a QR code — and a
// human writes and sends the message around it.

/** Returned rather than thrown: Next redacts server-action exceptions in
 * production, and "project-intake.md is a select with no options" is exactly
 * the sentence that has to survive the trip to the browser to be useful.
 *
 * The success case carries the published link back with it. That is what lets
 * the picker turn straight into the share surface: without the token and its
 * URL the browser would have to go looking for the row it just created. The
 * URL is resolved here because only the server knows which portfolio it
 * points at. */
export type SendFormResult =
  | { ok: true; link: { id: string; title: string; url: string } }
  | { ok: false; message: string }

/**
 * Parse the chosen questionnaire **now** and freeze the result onto the new
 * link row. That snapshot is the whole trick: the customer answers the questions
 * as they were worded at this moment, so editing the markdown afterwards can
 * never reinterpret answers that have already come back.
 *
 * A parse failure names the file and the problem, and nothing is inserted — so
 * a malformed questionnaire is never sent to anybody.
 *
 * `formId` is resolved against this lead's own library — the house forms plus
 * their connected delivery repo's — so it can only ever name a questionnaire
 * this lead's picker actually offered.
 */
export async function sendFormToClient(
  clientId: string,
  formId: string
): Promise<SendFormResult> {
  try {
    const client = await getClient(clientId)
    if (!client) return { ok: false, message: "That lead no longer exists." }

    const snapshot = await loadOnboardingForm(client.githubRepo, formId)
    // `formSlug` stays the bare filename it has always been; which repo it came
    // out of rides along in the snapshot.
    const link = await createFormLink({
      clientId,
      formSlug: snapshot.slug,
      formSnapshot: snapshot,
    })
    revalidateLead(clientId)
    return {
      ok: true,
      link: { id: link.id, title: snapshot.title, url: formLinkUrl(link.id) },
    }
  } catch (err) {
    console.error("[forms] send failed:", err)
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Couldn't send that questionnaire.",
    }
  }
}

/** Drop a link — sent to the wrong person, or superseded by a newer send. Takes
 * any answers with it, which is why the button asks first. */
export async function removeFormLink(id: string, clientId: string) {
  await deleteFormLink(id)
  revalidateLead(clientId)
}

/** Same returned-not-thrown shape as `SendFormResult`, for the same reason. */
export type WriteFormResult = { ok: boolean; message: string }

/**
 * Close the questionnaire loop: render a completed link's answers to markdown
 * and commit them into the client's delivery repo as
 * `.icm/docs/form-<slug>-<YYYY-MM-DD>.md` — provenance a session working in
 * that repo can read. Neon stays the record; the file is a rendered copy.
 *
 * Never overwrites: if the dated path is taken (the same form written twice,
 * or re-completed the same day), the write walks to `-2`, `-3`, … instead.
 */
export async function writeFormAnswersToRepo(
  linkId: string,
  clientId: string
): Promise<WriteFormResult> {
  const client = await getClient(clientId)
  if (!client) return { ok: false, message: "That lead no longer exists." }
  if (!client.githubRepo) {
    return {
      ok: false,
      message: "No delivery repo connected — connect one on this profile first.",
    }
  }

  const link = await getFormLink(linkId)
  if (!link || link.clientId !== clientId) {
    return { ok: false, message: "That form link no longer exists." }
  }
  if (!link.completedAt) {
    return { ok: false, message: "This form hasn't been answered yet." }
  }

  const markdown = renderFormAnswersMarkdown(link)
  const base = `.icm/docs/form-${link.formSlug}-${link.completedAt
    .toISOString()
    .slice(0, 10)}`

  for (let attempt = 1; attempt <= 5; attempt++) {
    const path = attempt === 1 ? `${base}.md` : `${base}-${attempt}.md`
    const result = await commitRepoFile(
      client.githubRepo,
      path,
      markdown,
      `Record questionnaire answers: ${link.formSlug}`
    )
    if (result.outcome === "created") {
      return { ok: true, message: `Committed ${path} to ${client.githubRepo}.` }
    }
    if (result.outcome === "failed") {
      return { ok: false, message: result.error }
    }
  }
  return {
    ok: false,
    message: "Five copies of this form are already in the repo for that date.",
  }
}

// ---- Archive / delete -------------------------------------------------------

export async function archiveClient(id: string, archived: boolean) {
  await setClientArchived(id, archived)
  revalidateLead(id)
}

export async function removeClient(id: string) {
  await deleteClient(id)
  revalidateLeadLists()
}

// ---- Todos ------------------------------------------------------------------
// The working list on the leads screen. A todo can hang off a lead, in which
// case it also shows on that lead's profile.

export async function addTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("A todo needs a title.")

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  let dueDate: Date | null = null
  if (dueRaw !== "") {
    const parsed = new Date(dueRaw)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Enter a valid due date, or leave it empty.")
    }
    dueDate = parsed
  }

  const clientId = String(formData.get("clientId") ?? "").trim() || null

  await createTask({ title, dueDate, clientId })
  revalidateLeadLists()
  if (clientId) revalidatePath(`/leads/${clientId}`)
}

/** Attach a todo to a lead, or detach it (null). Both the lead it left and the
 * one it joined list this todo, so every lead page is refreshed rather than
 * reading the row back to work out which two moved. */
export async function setTaskClientAction(id: string, clientId: string | null) {
  await setTaskClient(id, clientId)
  revalidateLeadLists()
  revalidatePath("/leads/[id]", "page")
}

export async function setTaskCompletedAction(id: string, completed: boolean) {
  const task = await setTaskCompleted(id, completed)
  revalidateLeadLists()
  if (task?.clientId) revalidatePath(`/leads/${task.clientId}`)
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id)
  revalidateLeadLists()
}

// ---- Compliance calendar ------------------------------------------------------

export async function addComplianceDateAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("An obligation needs a title.")

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = new Date(dueRaw)
  if (dueRaw === "" || Number.isNaN(dueDate.getTime())) {
    throw new Error("A compliance obligation needs a valid due date.")
  }

  const recurrenceRaw = String(formData.get("recurrence") ?? "none")
  const recurrence = isComplianceRecurrence(recurrenceRaw)
    ? recurrenceRaw
    : "none"

  // Per the legal/tax standing rule, notes should carry source + as-of date;
  // decision-support only either way.
  const notes = String(formData.get("notes") ?? "").trim() || null

  await createComplianceDate({ title, notes, dueDate, recurrence })
  revalidateLeadLists()
}

/** Completing a recurring obligation re-arms the next occurrence (handled in
 * the query layer). */
export async function completeComplianceDateAction(id: string) {
  await completeComplianceDate(id)
  revalidateLeadLists()
}

export async function deleteComplianceDateAction(id: string) {
  await deleteComplianceDate(id)
  revalidateLeadLists()
}
