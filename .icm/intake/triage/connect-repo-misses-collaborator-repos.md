# Stub: "Connect an existing repo" can't reach repos Jamie was invited to

- lane: bug
- found-by: Jamie, connecting a client's repo from a lead's profile (2026-09-23)
- priority: P1
- size: S
- sources: `websites/admin-dashboard/lib/github.ts` (`listAccessibleRepos`, `getRepo`), `websites/admin-dashboard/app/(app)/actions.ts` (`connectClientRepo`), `websites/admin-dashboard/components/client-repo-link.tsx` (`ConnectExisting`)

## What this is

The profile's repo sheet only offers — and in practice only accepts — repos Jamie
*owns*. A repo a client created and invited him to as a collaborator (or one in a
client's org) never shows up, so a client who hosts their own code can't be
connected.

There are two layers to it, and both have to be fixed for the flow to work:

1. **The suggestions are owner-only by design.** `listAccessibleRepos()` calls
   `/user/repos?...&affiliation=owner`. Its doc comment says that's deliberate
   ("not every org repo he can merely read"), but it also drops
   `collaborator` repos, which are exactly the client-hosted case. The datalist
   in `ConnectExisting` is therefore missing them.

2. **Typing `owner/name` by hand still fails** — `connectClientRepo` validates
   with `getRepo()` (`GET /repos/{owner}/{name}`), which returns null when the
   token can't see the repo. Likely causes, to confirm in this order:
   - **The invitation is still pending.** A collaborator invite grants nothing
     until accepted on github.com (or via `PATCH /user/repository_invitations/{id}`).
   - **`GITHUB_TOKEN` is a fine-grained PAT.** A fine-grained token is bound to
     one resource owner (`k0d0minio`), so it *cannot* reach repos owned by another
     user even when Jamie is a collaborator; for another org it needs that org to
     approve the token. A classic PAT with `repo` scope sees every repo the
     account can see. Check which kind is set on the admin-dashboard Vercel
     project (don't read or print its value).
   - **A classic PAT against an org with SSO / PAT restrictions** — needs the
     token authorised for that org.

The token question is config, not code, and is Jamie's call — the fix below
should make the dashboard *say* which of these it hit rather than the current
catch-all "doesn't exist or isn't visible to the configured GitHub token".

Out of scope: the Tickets board's owner sweep (`fetchOwnedRepos` in
`lib/tickets.ts`) has the same `affiliation=owner` filter, but a connected repo
is already pinned onto the board via its client row, so it doesn't need changing
for this.

## Prompt

In this repo, fix the admin dashboard's "Connect an existing repo" flow so a
GitHub repo Jamie was invited to as a collaborator (owned by a client's account
or org) can be connected. Read `.icm/intake/triage/connect-repo-misses-collaborator-repos.md`
first for the diagnosis. Then:

1. In `websites/admin-dashboard/lib/github.ts`, widen `listAccessibleRepos()` to
   `affiliation=owner,collaborator` (keep `organization_member` out unless there's
   a reason — the original intent was to avoid every org repo he can merely read)
   and update its doc comment. Consider following the `Link` header past 100.
2. Make `getRepo()` distinguish its failures (404 vs 403, and the fine-grained
   token / SSO messages GitHub returns) so `connectClientRepo` in
   `app/(app)/actions.ts` can return a specific message — e.g. "accept the
   invitation first" when `GET /user/repository_invitations` lists that repo, or
   "the token can't reach repos owned by <owner> — a fine-grained token is
   limited to one owner". Return the message rather than throwing it where
   production would redact it (see how `CreateClientRepoResult` handles this).
3. Update the "Delivery repo" section of `websites/admin-dashboard/README.md`
   with the token requirement for collaborator repos.

Follow `.claude/skills/design-dna/` for any copy on screen. Don't run
build/lint/typecheck locally — push on a `claude/` branch, open a PR, and read CI.
`git mv` this stub to `.icm/intake/triage/_done/` in the same PR.
