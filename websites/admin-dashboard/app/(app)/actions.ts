"use server"

import { revalidatePath } from "next/cache"

import {
  completeComplianceDate,
  createClientManually,
  createComplianceDate,
  createTask,
  deleteClient,
  deleteComplianceDate,
  deleteTask,
  getClient,
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
import { parseAmountToMinor } from "@/lib/money"
import { parsePercentToBps } from "@/lib/percent"
import { getStripe } from "@/lib/stripe"
import {
  clientSlug,
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

// Editable profile fields, read straight off the form. Empty strings become
// null so a cleared field doesn't persist as "".
export async function saveClientProfile(id: string, formData: FormData) {
  const value = (name: string): string | null => {
    const raw = formData.get(name)
    if (typeof raw !== "string") return null
    const trimmed = raw.trim()
    return trimmed === "" ? null : trimmed
  }

  const patch: ClientProfilePatch = {
    name: value("name") ?? undefined,
    email: value("email"),
    phone: value("phone"),
    company: value("company"),
    notes: value("notes"),
  }

  // `name` is NOT NULL — never blank it out. If the field came back empty we
  // simply leave the existing name untouched.
  if (patch.name === undefined) delete patch.name

  // What the relationship is worth, typed in major units ("1500", "2,500.00").
  // A cleared field means "no figure", which is zero rather than untouched.
  const rawValue = value("value")
  patch.valueMinor = rawValue === null ? 0 : (parseAmountToMinor(rawValue) ?? 0)

  const rawBilling = String(formData.get("billingType") ?? "one_off")
  patch.billingType = isBillingType(rawBilling) ? rawBilling : "one_off"

  // How the deal is settled. Anything unrecognised is cash — the safe reading,
  // since it keeps the figure in the pipeline total rather than silently moving
  // it out of the money you're expecting.
  const rawDealType = String(formData.get("dealType") ?? "cash")
  patch.dealType = isDealType(rawDealType) ? rawDealType : "cash"
  // The barter terms box only exists while "exchange of services" is selected,
  // so switching back to cash clears what was written for the old arrangement
  // rather than leaving it behind, invisible and still stored.
  patch.barterTerms = patch.dealType === "barter" ? value("barterTerms") : null

  // Commission and equity, typed as percentages ("8.5", "10 %"). A cleared or
  // unparseable field means "not part of this deal", which is null rather than
  // zero — zero would read on the row as a nil cut deliberately agreed.
  const percent = (name: string): number | null => {
    const raw = value(name)
    return raw === null ? null : parsePercentToBps(raw)
  }
  patch.commissionBps = percent("commission")
  patch.equityBps = percent("equity")

  const updated = await updateClient(id, patch)

  // Keep an already-linked Stripe customer in step with the edited profile.
  // Best-effort and only when linked: editing a profile never *creates* a Stripe
  // customer (that happens at first invoice, or an explicit link).
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
