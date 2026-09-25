# Stub: Scripts that make the AI interface a full operator

- feature-slug: import-and-scripts
- sequence: 4 of 8
- depends-on: prospect-rungs-and-facts, suppression-and-provenance
- priority: P1
- size: M

## What this is

Jamie's decision 8: Claude Code / opencode operate the leads system through repo
scripts against the DB — no new HTTP surface. This stub is that toolbox, and the
door the 85+ pool walks in through.

Scripts (location the session's call — likely `packages/services/scripts/`, run via
`DATABASE_URL`; every script prints what it did and supports `--dry-run`):

- **`leads-import`** — CSV or JSON in, `biz.clients` rows out as `prospect`:
  maps the pool's shape (company, sector, town, website, phone, email, language,
  hook, tier), normalizes phone/whatsapp to E.164, dedupes against existing rows by
  normalized name + town (report, don't overwrite), **skips suppressed contacts**,
  stamps `source: import` + `source_detail`. The 2026-07-23 PDF is converted to
  CSV/JSON by the session that runs the first import — conversion is an AI-interface
  task, not repo code.
- **`leads-queue`** — today's due outreach (the same crack-finder queries the feed
  uses), tier-sorted, with contact details and the hook — the "work the pool from a
  terminal" view.
- **`leads-log`** — log a touch (client, channel, outcome, note) and set/accept the
  suggested next action, one command.
- **`leads-crack`** — the weekly reconcile: no-next-action, overdue, rotting, wakes
  due.
- **`leads-purge`** — the 12-month retention rule from sequence 3.

Notes: scripts import from the `@jamie-nisbet/services` barrel — no duplicated SQL.
Read-mostly, small, boring; they are the estate's "never build an orchestrator" rule
applied to sales — the scripts report and record, Jamie decides and sends.

Gate (read, never tick):

- [ ] Jamie: run the first real `leads-import` (not `--dry-run`) against production
      `DATABASE_URL` once the dry run reads clean.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/import-and-scripts.md` in the jamienisbet repo. Build the
operator scripts (`leads-import` with dedupe/E.164/suppression-check/provenance,
`leads-queue`, `leads-log`, `leads-crack`, `leads-purge`) on top of the
`@jamie-nisbet/services` layer, each with `--dry-run`. Do not run anything against
production; leave the gate in this stub unticked.

CI is the source of truth — don't run builds locally. Work on a `claude/` branch,
push, open a PR, and `git mv` this stub to `.icm/intake/lead-engine/_done/` in that
PR.
