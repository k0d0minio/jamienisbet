# Stub: The public form route writes answers/<form>.md with a per-link token, no session

- feature-slug: form-route-writes-answers-token
- scope: deal-record-in-git
- sequence: 4 of 4
- depends-on: deal-record-read-write-git
- priority: P2
- complexity: medium
- found-by: icm-board restructure · 2026-10-07 (D49)
- sources: `websites/admin-dashboard/lib/form-markdown.ts` (today's snapshot writer) · `components/form-links.tsx` · icm-board `workspaces/sell/references/forms/README.md` · `workspaces/deals/README.md` § Who reads and writes the record
- touches: `websites/admin-dashboard/lib/form-markdown.ts` · the public form route · `packages/services` (`biz.form_links`) · `lib/github.ts`

## Problem

The Forms card sends a questionnaire; the answers come back into Neon (`biz.form_links`) and are
snapshotted into the deal folder's `answers/<form>.md` by the dashboard — a write that today
needs a signed-in session. A client answering at midnight waits for Jamie to open the dashboard
before the `/client` stage can read the snapshot.

## Proposed change

- The form link carries a per-link token (already the Forms card's shape); the public route
  that receives the answers verifies it and, on completion, writes `answers/<form>.md` into the
  engagement folder over the Contents API with the dashboard's own GitHub token — one commit,
  `Deal: <repo> — answers/<form>.md from the form`, the immutable provenance-stamped snapshot
  the deal contract allows — without any session.
- The write is the only thing the token can do: a second submission with the same token is
  refused (the snapshot is immutable); the token never writes a record field.
- Neon stays the record of the link and the raw answers (one home per fact).

## Acceptance criteria (rough)

- [ ] A completed form lands in icm-board within a minute, with the provenance line, and never twice
- [ ] A forged or reused token writes nothing and says nothing useful
- [ ] CI green
