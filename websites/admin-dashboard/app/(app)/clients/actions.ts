"use server"

import { revalidatePath } from "next/cache"

import {
  clientStatuses,
  deleteClient,
  getClient,
  setClientArchived,
  setClientRepo,
  setClientStatus,
  updateClient,
  type ClientProfilePatch,
  type ClientStatus,
} from "@jamie-nisbet/services"

import { ensureStripeCustomer, pushClientToStripe } from "@/lib/clients-stripe"
import { getStripe } from "@/lib/stripe"
import {
  createRepo,
  getRepo,
  isGithubConfigured,
  listAccessibleRepos,
  type RepoSummary,
} from "@/lib/github"
import { clientSlug } from "@/lib/repo-sync"

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

// ---- Delivery repo ---------------------------------------------------------
// When a client comes in, Jamie either points them at an existing repo or spins
// up a fresh one. Once connected, the pipeline's AI runs load a snapshot of it
// (see lib/deal-context.ts), so suggestions are grounded in the real codebase.

// The candidate list for the "connect existing" picker. Returns [] when GitHub
// is unconfigured, which the UI reads as "creation only".
export async function listConnectableRepos(): Promise<RepoSummary[]> {
  return listAccessibleRepos()
}

// A sensible default repo name for a new client repo: their slug, matching the
// convention new-client.sh / repo-sync already use for the business record.
export async function suggestedRepoName(id: string): Promise<string> {
  const client = await getClient(id)
  return clientSlug(client?.name ?? "client")
}

// Connect an existing repo ("owner/name") to this client. Validated against
// GitHub so we never store a dangling pointer, and the resolved default branch
// is cached alongside for the AI snapshot.
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
  revalidateClient(id)
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
  revalidateClient(id)
  return repo
}

// Drop the pointer (the repo itself is untouched on GitHub). The AI runs simply
// stop loading its snapshot.
export async function disconnectClientRepo(id: string) {
  await setClientRepo(id, null)
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
