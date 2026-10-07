# Stub: The dashboard reads the relationship record's frontmatter and writes a changed field back over the Contents API

- feature-slug: deal-record-read-write-git
- scope: deal-record-in-git
- sequence: 1 of 4
- depends-on: none
- priority: P1
- complexity: high
- found-by: icm-board restructure · 2026-10-07 (D49)
- sources: icm-board `workspaces/deals/README.md` § The relationship record (the schema and the validator's rules) · `_system/contracts/CLIENTS.md` § Who writes the record · `websites/admin-dashboard/lib/deals.ts` (`dashFields`, `readDealFolder`, `dealBadge`, `STAGE_NAMES`) · `packages/services/src/queries/clients.ts` (`clientStatuses`)
- touches: `websites/admin-dashboard/lib/deals.ts` · `websites/admin-dashboard/app/(app)/leads/[id]/page.tsx` · `websites/admin-dashboard/app/(app)/actions.ts` · `components/lead-facts-card.tsx` · `components/deal-board.tsx` · the `GITHUB_TOKEN`'s scope (contents: write on `k0d0minio/icm-board`)

## Problem

`lib/deals.ts` parses `- key: value` dash-fields that no longer exist: every `DEAL.md` in icm-board
now opens with YAML frontmatter (D49), the engagements table lost its shape and outcome columns,
and the rung, the next action, the deadlines, the money and the paper dates are in that
frontmatter — not on the Neon row. The profile shows a rung the file now owns, and the badge
(`dealBadge`) compares two homes of one fact that no longer both exist.

## Proposed change

- Parse the frontmatter (a small YAML subset: scalars, `deadlines:` and `invoices:` as lists of
  flow maps, quoted values) into a typed `DealRecord`; keep the old dash-field parser as the
  fallback for a folder not yet migrated, say which was read.
- The profile shows the record's fields beside the row — rung, next action and its date, the
  deadlines, `signed_at`, `work_started_at`, `value`/`billing_type`/`deal_type`/`support` — and
  the stage from the engagement folder on the renumbered line (`STAGE_NAMES`: 03 offer · 04
  agreement · 05 onboarding · 06 kickoff · 07 handover, old names mapped to the same positions).
- A change made on the profile — the rung moved, a next action typed, a date set — is **one
  commit to icm-board `main`** through the Contents API (`PUT /repos/k0d0minio/icm-board/contents/
  workspaces/deals/<repo>/DEAL.md` with the file's current `sha`; message `Deal: <repo> — <field>
  from the dashboard`), the frontmatter rewritten field by field with every other byte of the
  file preserved; a `sha` mismatch is a retry after a fresh read, never an overwrite.
- `status` on the Neon row stops being written for a relationship (`lead` and up): the row keeps
  the pool rungs (`prospect`, `nurture`) and the contact details; moving a pool row to `discussing`
  creates the folder's record when it does not exist (the `/client` stage's shape) — or says the
  folder is missing and does nothing.
- Retire `dealBadge` and the ConvertFlow gaps (CLIENTS.md no longer has them); `validate-deal.sh`'s
  rules are the dashboard's validation too (vocabularies, ISO dates, never an email or phone into
  the file).

## Acceptance criteria (rough)

- [ ] Every migrated folder's record renders on its profile; a pre-migration folder falls back and says so
- [ ] Moving a rung on the profile lands as one `Deal:` commit on icm-board `main`; a second save after a concurrent edit re-reads and retries once
- [ ] No contact detail reaches the file; `validate-deal.sh --all` in icm-board stays clean after a dashboard write
- [ ] CI green
