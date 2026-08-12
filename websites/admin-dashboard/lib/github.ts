import "server-only"

// The dashboard's direct line to GitHub for the *client delivery repo* — each
// client's OWN external repository: connecting an existing one and creating a
// fresh one.
//
// A Personal Access Token needs `repo` scope (read+write on private repos) to
// list, create, and read; a fine-grained token needs Contents+Metadata read and
// Administration write (repo creation). With the token unset every function
// degrades gracefully: reads return null/empty, and the connect/create actions
// surface a clear "not configured" error rather than throwing opaquely.

const API = "https://api.github.com"

/** Lowercase snake_case derivation of a client name — used to suggest a
 * delivery-repo name from the client's legal name. */
export function clientSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "client"
  )
}

function token(): string | undefined {
  return process.env.GITHUB_TOKEN
}

/** True when the dashboard can talk to GitHub at all. Mirrors the Stripe/AI
 * "configured?" checks the rest of the admin uses to hide unavailable UI. */
export function isGithubConfigured(): boolean {
  return Boolean(token())
}

/** The account new client repos are created under. Defaults to the token's own
 * account; set GITHUB_REPO_OWNER to a different user or an organisation to home
 * client repos there instead. */
export function repoOwnerOverride(): string | undefined {
  return process.env.GITHUB_REPO_OWNER || undefined
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

async function gh(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
    // These calls are always live — never let Next cache a repo listing/read.
    cache: "no-store",
  })
}

/** A repo as the connect picker and the connected-state UI need it. */
export type RepoSummary = {
  fullName: string
  description: string | null
  private: boolean
  defaultBranch: string
  htmlUrl: string
  pushedAt: string | null
}

function toSummary(r: {
  full_name: string
  description: string | null
  private: boolean
  default_branch: string
  html_url: string
  pushed_at: string | null
}): RepoSummary {
  return {
    fullName: r.full_name,
    description: r.description,
    private: r.private,
    defaultBranch: r.default_branch,
    htmlUrl: r.html_url,
    pushedAt: r.pushed_at,
  }
}

/**
 * Repos the token can administer, most-recently-pushed first — the candidate
 * list for "connect an existing repo". `affiliation=owner` keeps it to repos
 * Jamie owns (not every org repo he can merely read). Best-effort: returns []
 * when GitHub is unconfigured or the call fails, so the picker just shows empty.
 */
export async function listAccessibleRepos(): Promise<RepoSummary[]> {
  if (!isGithubConfigured()) return []
  try {
    const res = await gh(
      "/user/repos?per_page=100&sort=pushed&affiliation=owner"
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Parameters<typeof toSummary>[0][]
    return rows.map(toSummary)
  } catch {
    return []
  }
}

/** Look up one repo by "owner/name". Returns its summary, or null when it
 * doesn't exist / isn't visible to the token (used to validate a connect). */
export async function getRepo(fullName: string): Promise<RepoSummary | null> {
  if (!isGithubConfigured()) return null
  try {
    const res = await gh(`/repos/${fullName}`)
    if (!res.ok) return null
    return toSummary((await res.json()) as Parameters<typeof toSummary>[0])
  } catch {
    return null
  }
}

/**
 * Create a fresh delivery repo for a client and return its summary. Homed under
 * GITHUB_REPO_OWNER (as an org) when set, otherwise the token's own account.
 * Private by default — a client's delivery work is not public. Throws with the
 * GitHub error message on failure (name taken, bad scope, …) so the action can
 * show it.
 */
export async function createRepo(input: {
  name: string
  description?: string | null
  private?: boolean
}): Promise<RepoSummary> {
  if (!isGithubConfigured()) {
    throw new Error("GitHub is not configured in this environment.")
  }
  const owner = repoOwnerOverride()
  const path = owner ? `/orgs/${owner}/repos` : "/user/repos"
  const res = await gh(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? undefined,
      private: input.private ?? true,
      auto_init: true, // an initialised repo has a default branch to snapshot
    }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string; errors?: { message?: string }[] }
      | null
    const detail =
      body?.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
      body?.message ||
      `HTTP ${res.status}`
    throw new Error(`GitHub could not create the repo: ${detail}`)
  }
  return toSummary((await res.json()) as Parameters<typeof toSummary>[0])
}

