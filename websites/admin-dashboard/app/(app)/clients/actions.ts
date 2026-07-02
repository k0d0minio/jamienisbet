"use server"

import { revalidatePath } from "next/cache"

import {
  clientStatuses,
  deleteClient,
  getClient,
  setClientArchived,
  setClientStatus,
  updateClient,
  type ClientProfilePatch,
  type ClientStatus,
} from "@jamie-nisbet/services"

import { ensureStripeCustomer, pushClientToStripe } from "@/lib/clients-stripe"
import { getStripe } from "@/lib/stripe"

// A single edit refreshes both the list and the client's own page (and the
// dashboard, which shows headline counts).
function revalidateClient(id: string) {
  revalidatePath("/clients")
  revalidatePath(`/clients/${id}`)
  revalidatePath("/")
}

export async function updateClientStatus(id: string, status: string) {
  if (!(clientStatuses as readonly string[]).includes(status)) {
    throw new Error(`Unknown client status: ${status}`)
  }
  await setClientStatus(id, status as ClientStatus)
  revalidateClient(id)
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
    budget: value("budget"),
    preferredCallTime: value("preferredCallTime"),
    notes: value("notes"),
  }

  // `name` is NOT NULL — never blank it out. If the field came back empty we
  // simply leave the existing name untouched.
  if (patch.name === undefined) delete patch.name

  const updated = await updateClient(id, patch)

  // Keep an already-linked Stripe customer in step with the edited profile.
  // Best-effort and only when linked: editing a profile never *creates* a Stripe
  // customer (that happens at first invoice, or an explicit link).
  const stripe = getStripe()
  if (stripe && updated) await pushClientToStripe(stripe, updated)

  revalidateClient(id)
}

// Create (or adopt) and link a Stripe customer for this client on demand — the
// same resolution the invoice flow uses, exposed as an explicit action so the
// owner can pre-link a client before billing them.
export async function linkClientToStripe(id: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured in this environment.")
  const client = await getClient(id)
  if (!client) throw new Error("That client no longer exists.")
  await ensureStripeCustomer(stripe, client)
  revalidateClient(id)
}

export async function archiveClient(id: string, archived: boolean) {
  await setClientArchived(id, archived)
  revalidateClient(id)
}

export async function removeClient(id: string) {
  await deleteClient(id)
  revalidatePath("/clients")
  revalidatePath("/")
}
