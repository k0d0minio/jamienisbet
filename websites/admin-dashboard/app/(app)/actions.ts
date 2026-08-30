"use server"

import { revalidatePath } from "next/cache"

import {
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
  isClientStatus,
  isComplianceRecurrence,
  isDealType,
  setClientArchived,
  setClientRepo,
  setClientStatus,
  setClientWorkStarted,
  setTaskClient,
  setTaskCompleted,
  touchClient,
  updateClient,
  type ClientProfilePatch,
} from "@jamie-nisbet/services"

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
 * them. Touches nothing about the deal, so the contact edit sheet on a lead's
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
  }
  // `name` is NOT NULL — an emptied field leaves the existing name untouched.
  const name = value("name")
  if (name !== null) patch.name = name

  const updated = await updateClient(id, patch)
  const stripe = getStripe()
  if (stripe && updated) await pushClientToStripe(stripe, updated)
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
   * Null when the `.icm/` baseline landed. A sentence to put on screen
   * otherwise — the repo is created and connected either way, so this is a
   * warning about the seeding, never a failure of the create.
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
// A new repo is then seeded with the estate's `.icm/` baseline, so it shows up
// on the tickets board (empty, not absent) and passes `icm-check.sh` from
// minute one rather than waiting for someone to hand-create the folder.
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
      ? `${repo.fullName} was created and connected, but its .icm/ baseline didn't land: ${scaffold.error}. Seed it by hand or with icm-check.sh --fix.`
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
