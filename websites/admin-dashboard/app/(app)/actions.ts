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
import { loadOnboardingForm } from "@/lib/onboarding"
import { parseAmountToMinor } from "@/lib/money"
import { parsePercentToBps } from "@/lib/percent"
import { getStripe } from "@/lib/stripe"
import {
  clientSlug,
  commitRepoFile,
  createRepo,
  getRepo,
  isGithubConfigured,
  listAccessibleRepos,
  type RepoSummary,
} from "@/lib/github"

// The leads list lives at "/" and a lead's profile at "/leads/<id>" — an edit in
// either place has to refresh both.
function revalidateLead(id: string) {
  revalidatePath("/")
  revalidatePath(`/leads/${id}`)
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
 * The deal-terms slice of the profile on its own — what the Convert flow's
 * third step and the deal edit sheet save. Touches only the deal, so it can
 * never blank a contact field the way posting a partial profile form through
 * `saveClientProfile` would. Commission and equity are read only when the form
 * posted them — the Convert flow's shorter form doesn't carry those fields and
 * must not null them out.
 */
export async function saveDealTerms(id: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const patch: ClientProfilePatch = {}

  const rawValue = value("value")
  patch.valueMinor = rawValue === null ? 0 : (parseAmountToMinor(rawValue) ?? 0)

  const rawBilling = String(formData.get("billingType") ?? "one_off")
  patch.billingType = isBillingType(rawBilling) ? rawBilling : "one_off"

  const rawDealType = String(formData.get("dealType") ?? "cash")
  patch.dealType = isDealType(rawDealType) ? rawDealType : "cash"
  patch.barterTerms = patch.dealType === "barter" ? value("barterTerms") : null

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

/** Add a lead or a customer by hand — the meetup contact, the word-of-mouth
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

  // The form offers "Lead" and "Customer", which post "new" and "won" — but the
  // action is the authority, so anything unrecognised falls back to a new lead
  // rather than reaching the insert.
  const rawStatus = value("status") ?? "new"
  const status = isClientStatus(rawStatus) ? rawStatus : "new"

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
  revalidatePath("/")
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

// The candidate list for the "connect existing" picker. Returns [] when GitHub
// is unconfigured, which the UI reads as "creation only".
export async function listConnectableRepos(): Promise<RepoSummary[]> {
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

// Create a fresh delivery repo for this client and connect it in one step.
// Private by default; the created repo's actual full name (owner may differ from
// the token account via GITHUB_REPO_OWNER) and branch are what we store.
export async function createClientRepo(
  id: string,
  input: { name: string; description?: string; isPrivate?: boolean }
) {
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
  await setClientRepo(id, {
    githubRepo: repo.fullName,
    githubDefaultBranch: repo.defaultBranch,
  })
  revalidateLead(id)
  return repo
}

// Drop the pointer (the repo itself is untouched on GitHub).
export async function disconnectClientRepo(id: string) {
  await setClientRepo(id, null)
  revalidateLead(id)
}

// ---- Customer questionnaires ------------------------------------------------
// Publish a markdown questionnaire from `.icm/onboarding/` as a one-off link for
// this lead. The link is *copied*, never sent from here: per the estate's "no
// outbound action without review" rule the dashboard's job ends at putting a URL
// on the clipboard, and a human writes the email around it.

/** Returned rather than thrown: Next redacts server-action exceptions in
 * production, and "project-intake.md is a select with no options" is exactly
 * the sentence that has to survive the trip to the browser to be useful. */
export type SendFormResult = { ok: true } | { ok: false; message: string }

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
    await createFormLink({
      clientId,
      formSlug: snapshot.slug,
      formSnapshot: snapshot,
    })
    revalidateLead(clientId)
    return { ok: true }
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
  revalidatePath("/")
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
  revalidatePath("/")
  if (clientId) revalidatePath(`/leads/${clientId}`)
}

/** Attach a todo to a lead, or detach it (null). Both the lead it left and the
 * one it joined list this todo, so every lead page is refreshed rather than
 * reading the row back to work out which two moved. */
export async function setTaskClientAction(id: string, clientId: string | null) {
  await setTaskClient(id, clientId)
  revalidatePath("/")
  revalidatePath("/leads/[id]", "page")
}

export async function setTaskCompletedAction(id: string, completed: boolean) {
  const task = await setTaskCompleted(id, completed)
  revalidatePath("/")
  if (task?.clientId) revalidatePath(`/leads/${task.clientId}`)
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id)
  revalidatePath("/")
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
  revalidatePath("/")
}

/** Completing a recurring obligation re-arms the next occurrence (handled in
 * the query layer). */
export async function completeComplianceDateAction(id: string) {
  await completeComplianceDate(id)
  revalidatePath("/")
}

export async function deleteComplianceDateAction(id: string) {
  await deleteComplianceDate(id)
  revalidatePath("/")
}
