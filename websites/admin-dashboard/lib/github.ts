import "server-only"

// The dashboard's direct line to GitHub for the *client delivery repo* — each
// client's OWN external repository: connecting an existing one and creating a
// fresh one.
//
// A Personal Access Token needs `repo` scope (read+write on private repos) to
// list, create, and read; a fine-grained token needs Contents+Metadata read and
// Administration write (repo creation). A fine-grained token only reaches repos
// under the one account it was created for, so connecting a repo a client owns
// and invited Jamie to needs the classic token. With the token unset every function
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

/** A repo listing, and what GitHub said when it couldn't be read.
 *
 * The failure is part of the answer rather than an empty list, because the two
 * are not the same fact and callers act on them differently. A rate-limited
 * token and an account that owns nothing return the same `[]`, and reading the
 * first as the second is how the tickets board's 403 outage presented itself:
 * the roster had quietly collapsed before a single read of a repo ran, so a
 * spent limit looked like an estate whose repos were broken. */
export type RepoListing = { repos: RepoSummary[]; error: string | null }

/** How many pages of 100 a repo listing will follow — a runaway guard, not a
 * budget: the estate is a few dozen repos. */
const MAX_LISTING_PAGES = 10

/** The `rel="next"` page of a paginated GitHub response, as a path for `gh()`,
 * or null on the last page. */
function nextPage(res: Response): string | null {
  const next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)
  return next ? next[1].replace(API, "") : null
}

/**
 * Repos the account can connect, most-recently-pushed first — the candidate
 * list for "connect an existing repo". `affiliation=owner,collaborator`: the
 * repos Jamie owns, plus the ones a client created under their own account or
 * org and invited him to — the client-hosted case, and the reason the picker
 * exists. `organization_member` stays out, so it is still not every org repo he
 * can merely read. An invitation that hasn't been accepted grants nothing, so
 * its repo only appears once it has been. Unconfigured is a stated absence
 * rather than a failure: no token, no listing, no error to report.
 */
export async function listAccessibleRepos(): Promise<RepoListing> {
  if (!isGithubConfigured()) return { repos: [], error: null }
  const repos: RepoSummary[] = []
  try {
    let path: string | null =
      "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator"
    for (let page = 0; path && page < MAX_LISTING_PAGES; page++) {
      const res = await gh(path)
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string
        } | null
        return {
          repos: [],
          error: body?.message
            ? `GitHub returned HTTP ${res.status} — ${body.message}`
            : `GitHub returned HTTP ${res.status}`,
        }
      }
      const rows = (await res.json()) as Parameters<typeof toSummary>[0][]
      repos.push(...rows.map(toSummary))
      path = nextPage(res)
    }
    return { repos, error: null }
  } catch (err) {
    return {
      repos: [],
      error: err instanceof Error ? err.message : "network error",
    }
  }
}

/** One repo read by "owner/name": its summary, or a sentence saying why the
 * token couldn't have it. The sentence is the point — "not visible" alone
 * doesn't say which of four different fixes is needed. */
export type RepoLookup =
  | { repo: RepoSummary; error: null }
  | { repo: null; error: string }

/** Look up one repo by "owner/name". Returns its summary, or null when it
 * doesn't exist / isn't visible to the token. `lookupRepo` is the variant that
 * says which, for the connect flow where the reason is what's needed. */
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
 * Look up one repo by "owner/name" and, when the token can't have it, work out
 * why. GitHub answers a repo the token can't see with the same 404 it gives one
 * that doesn't exist, so the 404 is followed by two cheap reads that tell the
 * usual causes apart:
 *
 *   - **A pending invitation.** A collaborator invite grants nothing until it
 *     is accepted, and `/user/repository_invitations` lists the ones waiting.
 *   - **A fine-grained token.** It is bound to one resource owner, so it can't
 *     reach a repo another user owns even when Jamie is a collaborator on it.
 *     Told apart by its `github_pat_` prefix — the value itself is never read
 *     further, logged, or returned.
 *
 * A 403 is the org refusing the token (SAML SSO, or a PAT policy), and GitHub's
 * own message already says which.
 */
export async function lookupRepo(fullName: string): Promise<RepoLookup> {
  if (!isGithubConfigured()) {
    return { repo: null, error: "GitHub is not configured in this environment." }
  }
  try {
    const res = await gh(`/repos/${fullName}`)
    if (res.ok) {
      return {
        repo: toSummary((await res.json()) as Parameters<typeof toSummary>[0]),
        error: null,
      }
    }
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    const owner = fullName.split("/")[0]
    if (res.status === 403 && res.headers.get("x-github-sso")) {
      return {
        repo: null,
        error: `${owner} enforces single sign-on, and the GitHub token isn't authorised for it. Authorise the token for ${owner} on github.com, then connect again.`,
      }
    }
    if (res.status === 403) {
      return {
        repo: null,
        error: body?.message
          ? `GitHub refused the token for ${fullName}: ${body.message}`
          : `GitHub refused the token for ${fullName} (HTTP 403).`,
      }
    }
    if (res.status !== 404) {
      return {
        repo: null,
        error: body?.message
          ? `GitHub returned HTTP ${res.status} for ${fullName}: ${body.message}`
          : `GitHub returned HTTP ${res.status} for ${fullName}.`,
      }
    }
    return { repo: null, error: await explainNotFound(fullName) }
  } catch (err) {
    return {
      repo: null,
      error: `Couldn't reach GitHub: ${err instanceof Error ? err.message : "network error"}.`,
    }
  }
}

/** Why a repo came back 404 — see `lookupRepo`. Each probe is best-effort: a
 * probe that fails just falls through to the next, and the last answer is the
 * plain one. */
async function explainNotFound(fullName: string): Promise<string> {
  const wanted = fullName.toLowerCase()
  const owner = fullName.split("/")[0]

  try {
    const res = await gh("/user/repository_invitations?per_page=100")
    if (res.ok) {
      const invites = (await res.json()) as {
        html_url?: string
        repository?: { full_name?: string }
      }[]
      const invite = invites.find(
        (i) => i.repository?.full_name?.toLowerCase() === wanted
      )
      if (invite) {
        return `There's an invitation to ${fullName} waiting to be accepted — accept it on GitHub${invite.html_url ? ` (${invite.html_url})` : ""}, then connect again.`
      }
    }
  } catch {
    // Unanswered — fall through to the token check.
  }

  if (token()?.startsWith("github_pat_")) {
    let login: string | null = null
    try {
      const res = await gh("/user")
      if (res.ok) login = ((await res.json()) as { login?: string }).login ?? null
    } catch {
      // Unanswered — the message below doesn't need the login.
    }
    if (login && login.toLowerCase() === owner.toLowerCase()) {
      return `The GitHub token is a fine-grained token that hasn't been given ${fullName}. Add it to the token's repository access, then connect again.`
    }
    return `The GitHub token is a fine-grained token, and those only reach repos under one account — it can't see repos owned by ${owner}. Use a classic token with repo scope to connect repos you were invited to.`
  }

  return `${fullName} doesn't exist, or the GitHub account isn't a collaborator on it. Check the name and that the invitation was accepted.`
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
// Single-file commit — how rendered copies of business state (completed
// questionnaire answers) land in a client's delivery repo. Uses the contents
// API (PUT). A classic PAT's `repo` scope covers this; a fine-grained token
// additionally needs **Contents: write** on the target repos.

export type CommitFileResult =
  | { outcome: "created"; path: string; htmlUrl: string | null }
  /** The path is already taken — nothing was written. Never overwrites. */
  | { outcome: "exists"; path: string }
  | { outcome: "failed"; path: string; error: string }

/**
 * Commit one new file. A PUT without a `sha` fails with 422 when the file
 * already exists, which comes back as "exists" — existing files are never
 * touched; the caller picks a different path if it still wants the write.
 */
export async function commitRepoFile(
  fullName: string,
  path: string,
  content: string,
  message: string
): Promise<CommitFileResult> {
  if (!isGithubConfigured()) {
    return {
      outcome: "failed",
      path,
      error: "GitHub is not configured in this environment.",
    }
  }
  try {
    const res = await gh(
      `/repos/${fullName}/contents/${encodeRepoPath(path)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: Buffer.from(content, "utf8").toString("base64"),
        }),
      }
    )
    if (res.ok) {
      const body = (await res.json().catch(() => null)) as {
        content?: { html_url?: string }
      } | null
      return {
        outcome: "created",
        path,
        htmlUrl: body?.content?.html_url ?? null,
      }
    }
    if (res.status === 422) return { outcome: "exists", path }
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    return {
      outcome: "failed",
      path,
      error: body?.message || `HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      outcome: "failed",
      path,
      error: err instanceof Error ? err.message : "network error",
    }
  }
}

// ---------------------------------------------------------------------------
// Multi-file commit — how the estate baseline lands in a freshly created client
// repo. This one goes through the git *tree* API (read the ref, build a tree,
// write a commit, move the ref) rather than the contents API, for two reasons:
//
//   - **File modes.** The contents API always writes `100644`, and the two
//     `.claude/` hooks are invoked by path from `settings.json`, so they have
//     to be committed `100755` or they are present and inert. The tree API is
//     the only way to say so.
//   - **One commit.** A dozen contents-API PUTs are a dozen commits in the
//     first minute of a repo's life; a scaffold should be one line in
//     `git log`.
//
// The never-overwrite rule survives the move. The contents API gave it for free
// (422 on a path that is already taken); here it is an explicit read of the
// repo's current tree before anything is written.

/** One file to create. Never an edit: an existing path is left alone. */
export type NewRepoFile = {
  path: string
  /** UTF-8 text. The tree API takes inline blob content, so there is no
   * separate blob call — and no binary; every canonical asset is text. */
  content: string
  /** Commit mode `100755` instead of `100644`. */
  executable?: boolean
}

export type CommitFilesResult =
  | {
      /** `unchanged` when every path was already taken — no commit was made. */
      outcome: "committed" | "unchanged"
      created: string[]
      /** Paths that already existed. Untouched, and not a failure. */
      skipped: string[]
      /** The commit on GitHub, when there was one. */
      htmlUrl: string | null
    }
  /** Nothing was written — the ref never moved, so this is all-or-nothing. */
  | { outcome: "failed"; error: string }

const encodeRepoPath = (path: string) =>
  path.split("/").map(encodeURIComponent).join("/")

/** A GitHub read whose failure is a sentence someone can act on. `what` names
 * the step, because "HTTP 404" alone doesn't say which of five calls it was. */
async function ghJson<T>(
  what: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await gh(path, init)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(
      body?.message
        ? `couldn't ${what} — GitHub returned HTTP ${res.status}: ${body.message}`
        : `couldn't ${what} — GitHub returned HTTP ${res.status}`
    )
  }
  return (await res.json()) as T
}

/** The fallback for a repo whose tree GitHub truncates: a truncated listing
 * can't answer "does this path exist?", and guessing would overwrite. Only the
 * candidate paths are checked, so it stays one request per file we'd write. */
async function takenPathsIndividually(
  fullName: string,
  candidates: readonly string[]
): Promise<Set<string>> {
  const taken = new Set<string>()
  for (const path of candidates) {
    const res = await gh(
      `/repos/${fullName}/contents/${encodeRepoPath(path)}`
    )
    if (res.ok) taken.add(path)
  }
  return taken
}

/**
 * Create every file that doesn't already exist, as one commit on the repo's
 * default branch. Existing paths come back as `skipped` — they are never
 * touched, so this is safe to re-run against a repo that already has part of
 * what it's being handed.
 *
 * Never throws: like `commitRepoFile`, the failure is returned as a sentence,
 * because Next redacts server-action exceptions in production and the detail is
 * the whole value of the message.
 */
export async function commitRepoFiles(
  fullName: string,
  files: readonly NewRepoFile[],
  message: string
): Promise<CommitFilesResult> {
  if (!isGithubConfigured()) {
    return {
      outcome: "failed",
      error: "GitHub is not configured in this environment.",
    }
  }
  if (files.length === 0) {
    return { outcome: "unchanged", created: [], skipped: [], htmlUrl: null }
  }
  try {
    const repo = await getRepo(fullName)
    if (!repo) {
      return {
        outcome: "failed",
        error: `${fullName} doesn't exist or isn't visible to this token.`,
      }
    }
    const branch = encodeRepoPath(repo.defaultBranch)

    const ref = await ghJson<{ object: { sha: string } }>(
      `read ${fullName}'s ${repo.defaultBranch} branch`,
      `/repos/${fullName}/git/ref/heads/${branch}`
    )
    const parent = ref.object.sha

    // A commit SHA resolves to its own tree here, so this single read is both
    // the base tree and the set of paths already taken.
    const base = await ghJson<{
      sha: string
      tree: { path: string; type: string }[]
      truncated?: boolean
    }>(
      `read ${fullName}'s file listing`,
      `/repos/${fullName}/git/trees/${parent}?recursive=1`
    )
    const taken = base.truncated
      ? await takenPathsIndividually(
          fullName,
          files.map((f) => f.path)
        )
      : new Set(
          base.tree.filter((e) => e.type === "blob").map((e) => e.path)
        )

    const skipped = files.filter((f) => taken.has(f.path)).map((f) => f.path)
    const fresh = files.filter((f) => !taken.has(f.path))
    if (fresh.length === 0) {
      return { outcome: "unchanged", created: [], skipped, htmlUrl: null }
    }

    const json = { "Content-Type": "application/json" }
    const tree = await ghJson<{ sha: string }>(
      `build the tree for ${fullName}`,
      `/repos/${fullName}/git/trees`,
      {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          base_tree: base.sha,
          tree: fresh.map((f) => ({
            path: f.path,
            mode: f.executable ? "100755" : "100644",
            type: "blob",
            content: f.content,
          })),
        }),
      }
    )

    const commit = await ghJson<{ sha: string; html_url?: string }>(
      `commit to ${fullName}`,
      `/repos/${fullName}/git/commits`,
      {
        method: "POST",
        headers: json,
        body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }),
      }
    )

    // Until the ref moves nothing above is reachable, so a failure here leaves
    // the branch exactly as it was — dangling objects GitHub collects itself.
    await ghJson(
      `move ${fullName}'s ${repo.defaultBranch} branch`,
      `/repos/${fullName}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers: json,
        body: JSON.stringify({ sha: commit.sha }),
      }
    )

    return {
      outcome: "committed",
      created: fresh.map((f) => f.path),
      skipped,
      htmlUrl: commit.html_url ?? null,
    }
  } catch (err) {
    return {
      outcome: "failed",
      error: err instanceof Error ? err.message : "network error",
    }
  }
}
