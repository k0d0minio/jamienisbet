import "server-only"

import type { Document } from "@jamie-nisbet/services"
import { isDocumentKind, stageSpecs } from "@jamie-nisbet/icm"

// Repo sync-back: on approval, commit the artifact into the client's folder
// (shared/clients/<slug>/documents/) so the git repo stays the canonical
// business record. This is the ONE dashboard action that writes outside the
// database, and it only ever fires AFTER the human review gate — an approved
// document is by definition a human-reviewed output, so the outbound boundary
// (_config/conventions/scripts-and-integrations.md) holds.

/** Same derivation scripts/new-client.sh uses: lowercase snake_case. */
export function clientSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "client"
  )
}

export function isRepoSyncConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO)
}

/**
 * Commit an approved document to the repo via the GitHub contents API.
 * Returns the repo path written, or null when sync isn't configured (approval
 * still stands — sync is best-effort by design). Throws on API failure so the
 * caller can log it without blocking the approval.
 */
export async function syncDocumentToRepo(
  doc: Document,
  clientName: string
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  if (!token || !repo || !isDocumentKind(doc.kind)) return null

  const path = stageSpecs[doc.kind].syncPathTemplate
    .replace("{slug}", clientSlug(clientName))
    .replace("{version}", String(doc.version))
  const content = doc.contentHtml ?? doc.contentMd ?? ""

  const api = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }

  // An existing file needs its blob sha to be updated.
  let sha: string | undefined
  const head = await fetch(api, { headers })
  if (head.ok) {
    const existing = (await head.json()) as { sha?: string }
    sha = existing.sha
  }

  const res = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `sync: approved ${doc.kind} v${doc.version} for ${clientSlug(clientName)} (admin dashboard)`,
      content: Buffer.from(content, "utf8").toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub sync failed (${res.status}): ${body.slice(0, 300)}`)
  }
  return path
}
