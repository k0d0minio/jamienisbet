# Work tracking across the estate — breakdown & proposal

*2026-08-11 · decision-support for Jamie. Companion to [README.md](README.md) (estate audit).*

> **Decided & implemented 2026-08-11** — Jamie ruled: folder is **`.icm/intake/`** (not
> `ISSUES/`), the spec is **estate-wide** ([TICKETS-SPEC.md](TICKETS-SPEC.md)),
> **sustentus is deferred entirely**, and **write actions are not a priority**. The
> sections below are the original analysis; where they conflict with the spec, the spec
> wins.

The problem: client deals and big-picture deliverables are handled by the admin
dashboard, but day-to-day engineering work inside each repo has no system. You need
tickets that live as markdown inside each repo (readable by you and by Claude), carry a
pasteable **prompt**, and roll up into one screen you can act on from your phone.

---

## 1. What exists today (research summary)

| Where | What it does | Verdict |
|---|---|---|
| `jamienisbet/websites/admin-dashboard` | Mobile-first PWA on Vercel (Neon `biz.*`): leads, business todos, compliance dates, Stripe. Already has a `GITHUB_TOKEN`, `lib/github.ts`, and a `github_repo` pointer per client. Deals/deliverables tables were deliberately dropped (migration `0013_simplify_to_leads`). | **The natural home for the board.** It is already the one screen on your phone. |
| `remi-ai/ISSUES/` | 39 tickets `REMI-NNN-slug.md`: H1 title, two-column metadata table (Type / Priority / Size / Depends on / Sources), Problem, Required steps, acceptance criteria, **Agent prompt** section. `README.md` index groups them into phases. | **You already invented the ticket format.** It just isn't standardised or aggregated. |
| `sustentus-v2/pipeline/intake/` | Work items are stubs cut by the scope stage; `new-run.sh` consumes them, `_done/` archives them. Machine-integrated with runs, gates, PRs. | Its own system, and authoritative — don't replace it; adapt to it (§4). |
| `agorasim/workspaces/` | Work = a questionnaire flowing through stage folders. No ticket files. | Needs an `ISSUES/` folder for ad-hoc work. |
| `berceo`, `kau-american-bbq`, `vinecliff` | No CLAUDE.md, no tickets. Work arrives as one big instruction doc (`REBRAND-INSTRUCTIONS.md`) or nothing. | Greenfield — seed `ISSUES/` directly. |

All active repos are on GitHub (`k0d0minio/*`, `sustentus/*`). No repo uses YAML
frontmatter anywhere — the estate's native metadata style is the markdown table.

## 2. Proposed system — three small pieces, no new tools

**Repos own the tickets. The admin app reads them. Nothing syncs.**
This respects both standing doctrines: *the folder tree is the orchestration* (tickets are
files, status is folders), and the admin app's *one-store rule* (Neon holds business
state; engineering state stays in git and is read through, never mirrored).

### Piece 1 — the ticket standard: `ISSUES/` in every active repo

Generalise the remi-ai pattern. Per repo: an `ISSUES/` folder, tickets named
`<PREFIX>-NNN-slug.md` (REMI, SUS, AGORA, BERC, KAU, VINE…), done tickets moved to
`ISSUES/_done/` (the sustentus `_done/` convention — folder move *is* the status change,
no field to forget).

```markdown
# KAU-003 · Fix mobile nav overflow on menu page

| | |
|---|---|
| Status | ready |
| Type | bug |
| Priority | P1 |
| Size | S |
| Client | KAU American BBQ |

## Problem
The nav wraps off-screen below 380px …

## Acceptance
- [ ] Nav usable at 320px
- [ ] CI green

## Prompt

Fix the mobile nav overflow on the menu page. The nav lives in
app/components/nav.tsx … Open a PR on a claude/ branch; do not run
local checks — CI is the source of truth.
```

Contract (keep it this small):
- **Required:** H1 `# <ID> · <title>`, `Status` row, `Priority` row, a `## Prompt` section.
- **Status vocabulary:** `ready` → `today` → `in-progress` → `blocked`; **done = move the
  file to `_done/`**. You flag tomorrow's work by flipping `ready` → `today`.
- **Prompt rule:** everything under `## Prompt` must stand alone when pasted into a fresh
  Claude session at the repo root (it can reference the ticket file itself — Claude will
  read it).
- Everything else (Type, Size, Depends-on, Sources, acceptance detail) is optional and
  free-form, exactly like remi-ai today. remi-ai only needs a `Status` row added to
  conform; its `## Agent prompt` heading is accepted as an alias.

### Piece 2 — the board: a `/tickets` screen in the admin dashboard

One new page in `websites/admin-dashboard`:

- Server-side, fetch `ISSUES/*.md` from a configured repo list via the GitHub contents
  API (token already provisioned), parse the H1 + metadata table (~40 lines of parsing —
  the format is deliberately trivial), cache with `revalidate: 60`.
- Render grouped **Today / In progress / Blocked / Ready**, then by repo. Where a repo
  matches a `biz.clients.github_repo`, link ticket → client profile, so big-picture
  (deal) and in-repo (ticket) views join automatically.
- Each ticket row expands to the full markdown; one thumb-sized **Copy prompt** button
  copies the `## Prompt` body. Your phone flow: open PWA → tap ticket → copy → paste
  into a Claude session (Claude mobile app, claude.ai/code, or the repo's cloud session).
- Repo list: start as a constant in the app (six entries); promote to a DB table only if
  it ever churns.
- **v1 is read-only.** Status changes happen where the work happens — the Claude session
  that picks a ticket up flips `Status` and later `git mv`s it to `_done/` as part of its
  PR. (A v2 "mark done" button that commits the move via the GitHub API is a small,
  optional upgrade — see §5.)

### Piece 3 — the daily flow

1. **Evening (laptop or phone):** glance at the board; pick tomorrow by editing 2–3
   tickets to `Status: today` (v1: a 30-second commit from any Claude session or the
   GitHub mobile editor; v2: one tap).
2. **Morning (phone):** open the PWA → Today column → copy prompt → paste into Claude.
   The session reads the ticket in-repo, does the work, updates the ticket status in the
   same PR.
3. **Writing tickets costs nothing:** at the end of any working session, tell Claude
   "cut what's left into ISSUES/" — the format is already in-repo and self-describing.

## 3. Alternatives considered (and why not)

- **GitHub Issues + the GitHub mobile app** — closest off-the-shelf fit, free, and the
  mobile app is decent. Rejected as primary: issues aren't files in the repo (weaker for
  Claude context, invisible to `grep`, a second source of truth), and cross-repo views on
  mobile are clumsy. It remains the sane fallback if you ever want zero build effort.
- **Static aggregator page (cron script → generated markdown/HTML in `_system`)** — no
  app changes, but it's stale between runs, needs somewhere to host, and is a scheduled
  orchestrator of exactly the kind the doctrine avoids. The admin app reading live is
  strictly better and already deployed behind auth.
- **Mirroring tickets into Neon** — breaks the one-store rule in reverse (engineering
  state duplicated into the business store) and creates a sync problem. Read-through has
  no sync problem by construction.
- **Linear / Jira / Notion** — ruled out by you; nothing here needs them.

## 4. The sustentus question

sustentus-v2's `pipeline/intake/` stubs *are* its tickets, and the repo owns its pipeline
semantics — an `ISSUES/` folder there would compete with the intake contract. Two clean
options:

- **(a) Adapter (recommended eventually):** the board grows a second small parser for
  stub format (`# Stub:` + dash-list) and shows intake stubs as `ready` tickets whose
  generated prompt is "run `/pipeline new` on `pipeline/intake/<scope>/<stub>.md`".
  Runs in `pipeline/runs/` surface as `in-progress`.
- **(b) Defer:** leave sustentus off the board in v1; its pipeline already answers
  "what do I pick up next" internally.

Either is fine; (b) first, (a) when the board proves itself.

## 5. Build plan

| Phase | Work | Effort |
|---|---|---|
| 1 | Write the ticket spec as `_config/conventions/tickets.md` in jamienisbet (or `_system/TICKETS-SPEC.md` here if you'd rather keep it estate-level); seed `ISSUES/` with 2–3 real tickets each in berceo, kau-american-bbq, vinecliff, agorasim; add `Status` rows to remi-ai's open tickets. | one session |
| 2 | Build `/tickets` in admin-dashboard: repo-list constant, GitHub fetch + parser, grouped mobile view, Copy-prompt button. | one session |
| 3 (opt.) | Write actions from the phone: "mark today" / "mark done" buttons that commit the edit / `git mv` via the GitHub API. | small |
| 4 (opt.) | sustentus stub adapter (§4a). | small |

## 6. Open decisions for you

1. **Folder name:** keep remi-ai's `ISSUES/` estate-wide (recommended — it's already
   live), or rename to `tickets/`? Renaming touches 39 remi-ai files for zero gain.
2. **Where the spec lives:** jamienisbet `_config/conventions/` (it's your factory) or
   `_system/` (estate-level). Recommendation: jamienisbet, with a pointer from here.
3. **sustentus:** defer (§4b) or adapt (§4a) in v1?
4. **Phase-3 write actions:** worth it, or is editing via a Claude session enough? (Doable
   either way; read-only v1 ships faster.)

---

*Decision-support only. Nothing here supersedes a repo's own contracts — the repo owns
its pipeline semantics.*
