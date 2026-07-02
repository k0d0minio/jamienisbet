"use server"

import { revalidatePath } from "next/cache"

import {
  clientStatuses,
  deleteClient,
  setClientArchived,
  setClientStatus,
  updateClient,
  type ClientProfilePatch,
  type ClientStatus,
} from "@jamie-nisbet/services"

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

  await updateClient(id, patch)
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
