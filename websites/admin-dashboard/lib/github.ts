import "server-only"

// The dashboard's direct line to GitHub for the *client delivery repo* — each
// client's OWN external repository: connecting an existing one, creating a fresh
// one, and pulling a compact snapshot of it into the pipeline's AI context so
// pitches and proposals are grounded in the actual codebase.
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

// ---------------------------------------------------------------------------
// Repo snapshot — the Layer-4 working material the AI runs read. Bounded on
// purpose: a compact, current picture (what it is, its shape, its stack) rather
// than the whole tree, so it grounds suggestions without blowing the context.

const README_LIMIT = 8_000
const MAX_TREE_ENTRIES = 300

async function fetchReadme(fullName: string): Promise<string | null> {
  try {
    const res = await gh(`/repos/${fullName}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json" },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.length > README_LIMIT
      ? `${text.slice(0, README_LIMIT)}\n\n…(README truncated)`
      : text
  } catch {
    return null
  }
}

async function fetchLanguages(fullName: string): Promise<string[]> {
  try {
    const res = await gh(`/repos/${fullName}/languages`)
    if (!res.ok) return []
    // Keyed by language, valued by bytes — ordered most-used first.
    const langs = (await res.json()) as Record<string, number>
    return Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
  } catch {
    return []
  }
}

async function fetchTree(
  fullName: string,
  branch: string
): Promise<{ paths: string[]; truncated: boolean } | null> {
  try {
    const res = await gh(
      `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      tree?: { path: string; type: string }[]
      truncated?: boolean
    }
    const files = (data.tree ?? [])
      .filter((n) => n.type === "blob")
      .map((n) => n.path)
    const truncated = Boolean(data.truncated) || files.length > MAX_TREE_ENTRIES
    return { paths: files.slice(0, MAX_TREE_ENTRIES), truncated }
  } catch {
    return null
  }
}

/**
 * A compact markdown snapshot of a client's repo for the AI context. Pass the
 * cached default branch (from the client row) to skip a metadata round-trip;
 * omit it and the branch is resolved live. Returns null when GitHub is
 * unconfigured or the repo can't be read — the caller treats the snapshot as
 * best-effort enrichment, never a hard dependency of a generation.
 */
export async function getRepoSnapshot(
  fullName: string,
  defaultBranch?: string | null
): Promise<string | null> {
  if (!isGithubConfigured()) return null

  const meta = defaultBranch ? null : await getRepo(fullName)
  const branch = defaultBranch ?? meta?.defaultBranch
  if (!branch) return null

  const [readme, languages, tree] = await Promise.all([
    fetchReadme(fullName),
    fetchLanguages(fullName),
    fetchTree(fullName, branch),
  ])

  // Nothing readable at all → treat as no snapshot rather than an empty header.
  if (!readme && languages.length === 0 && !tree) return null

  const sections: string[] = [
    `## Client delivery repository — \`${fullName}\``,
    "The client's existing codebase (GitHub). Ground your analysis and " +
      "suggestions in what actually exists here — its stack, structure, and " +
      "current state — rather than assuming a greenfield build.",
    `- Default branch: \`${branch}\``,
  ]
  if (meta?.description) sections.push(`- Description: ${meta.description}`)
  if (languages.length > 0) {
    sections.push(`- Languages: ${languages.join(", ")}`)
  }

  if (tree) {
    const list = tree.paths.map((p) => `- ${p}`).join("\n")
    sections.push(
      `### File tree${tree.truncated ? " (truncated)" : ""}\n\n${list}`
    )
  }

  if (readme) {
    sections.push(`### README\n\n${readme}`)
  }

  return sections.join("\n\n")
}
