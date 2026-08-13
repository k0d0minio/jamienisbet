# Estate ticket spec — `.icm/intake/`

*System-wide standard. Canonical copy lives here in `_system`; each repo
carries a self-contained micro-copy in `.icm/intake/README.md` so cloud sessions that
only see the repo still have the contract. Proposal background:
[WORK-TRACKING.md](WORK-TRACKING.md).*

Tickets are markdown files inside each repo. Repos own their tickets; the admin
dashboard (`jamienisbet/websites/admin-dashboard` → `/tickets`) only reads and displays
them. Tickets are never created or edited from the dashboard.

## Layout

```
.icm/
  intake/
    README.md            ← micro-copy of this contract
    <PREFIX>-NNN-slug.md ← one open ticket per file
    _done/               ← finished tickets are git mv'd here
```

- **Sustentus-v2 is exempt** — its `pipeline/intake/` is authoritative and untouched.
- Prefixes: `REMI`, `AGORA`, `BERC`, `KAU`, `VINE`, `JN` (jamienisbet), `BARZ` (barzinho),
  `BTM` (boystomenretreat), `COLL` (collabimmo), `CASEY` (casey-hebbel), `CAFE`
  (cafe-jardim), `MESSY` (messy-play), `DND` (dungeons-dragons); new repos pick a short
  unique prefix. Repos seeded
  by `icm-check.sh --fix` carry an auto-derived prefix in their intake README — confirm
  it (and register it here + in `icm-check.sh`'s map) before cutting the first ticket.
- `NNN` is zero-padded and never reused, even for dropped tickets.

## Ticket format

```markdown
# KAU-003 · Fix mobile nav overflow on menu page

| | |
|---|---|
| Status | ready |
| Type | bug |
| Priority | P1 |
| Size | S |

## Problem
The nav wraps off-screen below 380px …

## Acceptance
- [ ] Nav usable at 320px
- [ ] CI green

## Prompt

Fix the mobile nav overflow on the menu page. The nav lives in
app/components/nav.tsx. Read .icm/intake/KAU-003-mobile-nav-overflow.md
for full context. Open a PR on a claude/ branch; do not run local
checks — CI is the source of truth.
```

## Contract

**Required:**

- H1: `# <ID> · <title>`
- `Priority` row: `P0` (urgent) · `P1` (next) · `P2` (whenever)
- `## Prompt` section — everything under it must stand alone when pasted into a fresh
  Claude session at the repo root. It may (should) tell the session to read the ticket
  file itself. `## Agent prompt` is an accepted alias (remi-ai legacy).

**Status:**

- Vocabulary: `ready` → `today` → `in-progress` → `blocked`.
- A missing `Status` row means `ready` — legacy tickets need no edit.
- **Done is not a status**: `git mv` the file into `_done/`. The folder move is the
  state change; there is no field to forget.
- `today` is the pick-up flag: flip 2–3 tickets to `today` the evening before (the
  `/plan` command's job), and the board's Today group is tomorrow's worklist. **Hard cap:
  3 `today` tickets across the whole estate** — a diluted flag is no flag.

**Optional, free-form:** `Type`, `Size`, `Depends on`, `Sources`, `Client`, acceptance
detail, any other rows or sections. The board displays what it finds and never requires
them.

## Working rules

- The Claude session that picks a ticket up flips `Status` in its PR, and moves the file
  to `_done/` in the PR that finishes the work.
- Cutting new tickets is part of ending any session: "cut what's left into
  `.icm/intake/`."
- The board reads `main` via the GitHub API — a ticket exists once it's pushed.
- No write actions from the dashboard (deliberate; revisit only if the manual flow
  chafes).
