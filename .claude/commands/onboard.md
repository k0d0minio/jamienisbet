---
description: Adopt a won lead's delivery repo — seed .icm, confirm the prefix, bridge discovery docs into first tickets
allowed-tools: Bash(_system/icm-check.sh:*), Bash(/home/jamie-nisbet/Apps/_system/icm-check.sh:*), Bash(gh repo clone:*), Bash(git -C:*), Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion
---

# /onboard <repo-name> — from "lead says yes" to first tickets

Work from the Apps root. The full conversion checklist: `_system/PROCESS.md` §3.
Argument: the repo name (e.g. `casey-hebbel`) or the client's name — resolve it with
Jamie if ambiguous.

## 0. Preconditions — the dashboard goes first

The delivery repo is **born on the dashboard** (`createClientRepo` on the lead profile —
it creates the GitHub repo under `k0d0minio/` and sets `github_repo` on the client row
in one act, which is what puts the repo on the Tickets board). If the repo doesn't
exist on GitHub yet, **stop** and print exactly that step. Never create client repos
with `gh repo create` here.

## 1. Adopt

If the repo isn't already at `projects/<name>` locally, clone it:
`gh repo clone k0d0minio/<name> projects/<name>`.

## 2. Seed + prefix

Run `_system/icm-check.sh --fix` and report what it created for this repo (it only
fills gaps, never overwrites). Then confirm the ticket prefix with Jamie:

- If the intake README's prefix was auto-derived, propose a better one where the
  derivation is poor (e.g. two-letter or ambiguous prefixes).
- A confirmed prefix gets registered in **both** `_system/TICKETS-SPEC.md` (prefix list)
  and `_system/icm-check.sh` (`prefix_for` map), and corrected in the repo's
  `.icm/intake/README.md` if it changed. Prefixes are short, unique estate-wide, never
  reused.

## 3. Gather what's known

Read everything in the repo's `.icm/docs/` (client emails, proposals, discovery
reports, questionnaires, form answers) plus `README`/`CLAUDE.md`. If the repo has
commit history, spawn the `ticket-scout` agent on it and use its report. If discovery
artifacts are thin, say so — the first ticket may be a discovery ticket (interview
script or questionnaire, house patterns in `_system/PROCESS.md` §2), not build work.

## 4. Bridge — cut the first tickets

Interview Jamie on scope (deliverable, deadline, what "done" looks like, what's
unknown), then cut the first tickets per `_system/TICKETS-SPEC.md`:

- 3–8 tickets, each independently deliverable, sized honestly.
- Acceptance criteria cite the client's own words from `.icm/docs/` where possible
  (the collabimmo pattern — provenance beats prose).
- Real unknowns become an explicit discovery/decision ticket, not fake certainty.
- Numbering starts at `<PREFIX>-001` unless tickets already exist.

## 5. Hand back

Leave everything **uncommitted** for Jamie's review unless he says push (ticket-only
commits to `main` are the allowed shape). Then print the remaining dashboard steps as
a checklist: tap **Work started** · fill deal terms (value, billing, cash/barter) ·
link Stripe · send the intake form if not sent. If the repo has no `CLAUDE.md`, offer
to draft a thin Layer-0 (identity + routing to `.icm/intake/`, house style ~30–90
lines).
