# Bug: fix-collaborator-repos

- observed: a repo a client owns and invited Jamie to never appears in the profile's "Connect an existing repo" suggestions, typing it fails with a catch-all "doesn't exist or isn't visible", and its tickets never show on /tickets · expected: collaborator repos are suggested, connectable when the token can reach them, and say why when it can't; their tickets show on the board
- reproduction (code path): `listAccessibleRepos()` and the board's `fetchOwnedRepos()` both call `/user/repos?affiliation=owner` (one page only), so collaborator repos are excluded from the picker and the board sweep; `connectClientRepo` collapses every non-200 from `GET /repos/{owner}/{name}` into one thrown message; `fetchRepoTickets` treats a 404 tree read as "nothing to show", so a pinned repo the token can't see vanishes silently
- cause: owner-only listings, plus unreachable repos reported as absent rather than unreachable
- fix: websites/admin-dashboard/lib/github.ts: listing → `owner,collaborator`, paginated via `Link`; new `lookupRepo()` distinguishes pending invitation / fine-grained token / SSO / 403 policy / not found · app/(app)/actions.ts: `connectClientRepo` returns `ConnectClientRepoResult` instead of throwing · components/client-repo-link.tsx: shows the returned reason · lib/tickets.ts: sweep → `owner,collaborator`, paginated; a 404 tree read on a pinned repo is a named board error · README.md: token requirement for collaborator repos
- config (operator's call): a fine-grained `GITHUB_TOKEN` cannot reach repos owned by another account at all — collaborator repos need a classic PAT with `repo` scope on the admin-dashboard Vercel project; the dashboard now says which case it hit
- changelog: announce: none
- learned: none
