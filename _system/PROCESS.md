# The process — lead to delivered work

*Estate-wide operating process. Companions: [TICKETS-SPEC.md](TICKETS-SPEC.md) (the
ticket contract) · [README.md](README.md) (estate audit) · the `/plan`, `/onboard`,
`/wrap`, `/groom` commands in `Apps/.claude/commands/` that drive it.*

**The spine:**

```
lead (dashboard) → discovery (.icm/docs/ in the client repo) → won
  → /onboard (adopt repo, seed .icm, first tickets)
  → /plan (priorities + today flags — tickets ARE the plan)
  → deliver (copy prompt → claude/ branch → PR → CI → merge; ticket → _done/)
  → delivered (dashboard status + final invoice)
```

Deliverables are deliberately **freeform** — documents, codebases, features, mockups all
travel the same road; what *done* means lives in each ticket's Acceptance section, not in
a per-type playbook.

## 1 · Lead arrives — the dashboard owns it

Three doors into Neon `biz.clients`: the portfolio contact form, the sellers-site
referral form, and manual add. The only pipeline is the status ladder
`new → contacted → qualified → proposed → won → delivered → lost`. Keep
`last_touched_at` honest — the Leads screen sorts longest-waiting first and flags stale
at 7 days.

## 2 · Discovery — before committing to scope

- **Create the delivery repo early** (once a lead is `qualified`/`proposed` and real
  enough to discover). Creation happens **from the dashboard** (`createClientRepo` — it
  sets `github_repo` on the client row in the same act, which is also what puts the repo
  on the Tickets board). Never create client repos by hand or via `gh` here.
- **Everything the client says lands verbatim in `.icm/docs/`** — the collabimmo pattern:
  `customer-request.md` in the client's own words, untranslated. Provenance beats prose.
- Interview and assessment artifacts follow the existing house patterns, pick per deal:
  an assessment `REPORT.md` + `QUESTIONS.md` with stable IDs and `[BLOCKER]` tags
  (berceo), a `DISCOVERY-PROMPT.md` interview script (messy-play), or a proposal doc.
  All of it lives in the client repo's `.icm/docs/`.
- Send the intake questionnaire from the dashboard (Forms card on the lead profile).
  Answers land in Neon `biz.form_links`; JN-008 makes the dashboard write them back into
  the client repo as `.icm/docs/form-*.md` so sessions can read them. Until it ships,
  paste answers into `.icm/docs/` by hand when they matter for scoping.

## 3 · Won → `/onboard`

The conversion checklist, driven by the `/onboard` command from the Apps root:

1. Repo exists (dashboard-created) and `github_repo` is connected — else stop and do
   that first.
2. Clone/adopt it locally under `projects/`, seed the `.icm`/`.claude` baseline
   (`icm-check.sh --fix`), confirm the ticket prefix (short, unique, never reused —
   registered in [TICKETS-SPEC.md](TICKETS-SPEC.md)).
3. Bridge discovery → delivery: read `.icm/docs/`, interview Jamie, cut the first
   tickets. Real unknowns become a discovery ticket, not fake certainty.
4. Finish on the dashboard: tap **Work started**, fill deal terms, link Stripe, send the
   intake form if not sent.

## 4 · Plan — tickets ARE the plan

There is no sprint field, no plan file, no backlog doc. **A week's plan is the Priority
rows; a day's plan is `Status: today` on at most 3 tickets across the whole estate.**

- **Evening (`/plan`):** review the estate board, reprioritize, cut/kill tickets, clear
  stale `today` flags, flip tomorrow's ≤3. The command ends by committing **ticket-only
  changes** to each repo's `main` and pushing — the board reads `main`, so pushing *is*
  publishing the plan.
- **Morning (phone):** admin PWA → Tickets → Today group → **Copy prompt** → paste into
  a Claude session. The session reads the ticket in-repo and does the work.

## 5 · Deliver

- `claude/` branch → PR → **CI is the source of truth** → merge. Same mechanic for a
  document as for a feature.
- The session that picks a ticket up flips `Status: in-progress` in its PR; the PR that
  finishes the work `git mv`s the ticket to `_done/`. **Done is a folder, not a field.**
- **Every working session ends with `/wrap`:** finished tickets moved, leftovers cut as
  new tickets, stale `today` flags cleared. Cutting tickets is part of stopping.

## 6 · Delivered

Dashboard: status → `delivered`, final invoice from Money (drafts first — finalizing is
a separate deliberate click). The repo's intake folder should be empty or hold only P2s
kept on purpose.

## Hygiene — `/groom`

Run weekly-ish. It reads `_system/ticket-hygiene.sh` and fixes with judgment:
merged-but-still-open tickets → `_done/`; `today` dilution (>3) → trimmed; active repos
with empty intake → tickets cut from recent context; the prefix registry kept current.
The SessionStart hook prints the Today group whenever a session opens at the Apps root.

## Rules that keep it honest

- The board is **read-only**; tickets change where the work happens.
- **≤3 `today` estate-wide**, flipped the evening before. A diluted flag is no flag.
- Never a loose `TODO.md`/`BACKLOG.md` — leftovers become tickets.
- Ticket-only commits go straight to `main` (planning is data); everything else goes
  through a PR.
- **sustentus-v2 is exempt** — its `pipeline/` is authoritative for intake, runs, and
  gates. Gates everywhere are human checkboxes: read, never tick.

---

*Process doc, not doctrine — where this conflicts with a repo's own contracts, the repo
wins.*
