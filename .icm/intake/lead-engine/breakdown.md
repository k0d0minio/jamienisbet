# Lead engine — breakdown

- epic: lead-engine
- cut: 2026-08-30, interrogation of Jamie (two rounds), analysis of the 2026-07-23
  Mafra/Lisbon prospect list, and outside research on solo-operator lead handling
- scope: `websites/admin-dashboard` + `packages/services` (the `biz.*` model) + repo
  scripts. The Vercel AI Gateway enters the stack; Resend does not enter the dashboard.

## What was understood

- **An 85+ cold-prospect pool exists and the app cannot hold it.** The 2026-07-23
  prospect list (Mafra/Ericeira/greater Lisbon SMBs) carries a consistent profile per
  lead — company, sector, town, website or contact channel, phone, email, outreach
  language (EN/PT) and a per-lead pain-point hook — grouped in sector clusters with a
  priority tiering. `biz.clients` has none of those fields, no bulk entry (three doors,
  all one-at-a-time), and the leads list loads every row unpaginated — imported as-is,
  the pool would drown the real leads and the staleness nag.
- **There is no memory of contact.** One overwritten `last_touched_at` timestamp is the
  entire outreach record; the old `touches` table died in migration `0013`. No channel,
  no outcome, no history — so no cadence, no follow-up discipline, and no answer to
  "what happened with this one".
- **AI was deliberately removed once already.** The 2026-08 reversal
  (`.icm/docs/decisions.md`) retired the three-step AI deal pipeline, versioned
  documents, `generations` provenance and draft-outreach composition — fourteen screens
  became four. What returns here must be leaner than what died: disposable drafts
  grounded on lead facts, no document ceremony, no pipeline.
- **The research is unambiguous about the shape.** Task-driven beats kanban for a solo
  operator: the working invariant is *no open lead without a next action and due date*,
  and the daily surface is a capped due-today queue, not a board (the Pipedrive
  activity / Close smart-view pattern). Cold local SMB cadence is ~5 touches over ~3
  weeks across channels — for Mafra that includes phone, walk-ins and WhatsApp, not
  just email. Silence after a full cadence parks the lead (+90-day wake), it doesn't
  kill it. At a few hundred leads, rule-based A/B/C fit tiers from stored facts beat
  numeric scoring. Drafting an entire campaign on a cheap gateway model costs under a
  euro; deliverability and tone die by volume and slop, not by AI per se.
- **Portugal shapes the channels.** Lei 41/2004: email to a company role address
  (geral@/info@ of an Lda/SA) is the opt-out regime; a sole trader is a natural person
  — phone/walk-in first. Opt-outs must be permanent and survive re-import; the first
  message says where the data came from.
- **The standing rule held.** "No outbound action without review; outreach email is
  composed and sent by a human" was re-confirmed, not relaxed. The app composes, logs
  and hands off — it never transmits outreach.

## Decisions (all Jamie's, 2026-08-30)

1. **Prospects join `biz.clients`.** One row per relationship from cold import to
   paying client — the table's own doctrine. The ladder gains a pre-lead `prospect`
   rung (imported, working the cadence, hasn't engaged) and a parked `nurture` rung
   with a wake date. Prospects stay out of the open-lead views and the staleness nag
   until they engage.
2. **Drafts only; a human sends.** The app generates and stores drafts and hands them
   off per channel (mailto:, wa.me click-to-chat, copy for Instagram); sending happens
   in Jamie's own mailbox/apps. The standing rule survives verbatim.
3. **All four AI features ship, via the Vercel AI Gateway** on cheap models
   (gpt-5-nano class; a stronger model for PT-PT drafting is the session's call):
   first-touch drafts, follow-up drafts grounded on touch history, enrichment + tier
   suggestion, and reply triage. Nothing auto-sends; a Gateway budget is the tripwire.
4. **Five channels are first-class touches**: email, phone, walk-in, Instagram DM, and
   WhatsApp as a main entry point (click-to-chat with the draft prefilled).
5. **The daily queue lives in the Needs you feed** — due-today outreach joins the
   feed, capped (~10, matching the estate ritual), overdue first then tier.
6. **Import is a repo script**, run through Claude Code / opencode against the DB. No
   import UI; the AI interface is the bulk-operations surface (decision 8).
7. **Enforcement is gentle.** Completing a touch suggests the next cadence step
   prefilled; crack-finder rows surface leads with no next action. Nothing blocks a
   save.
8. **AI interfaces operate via repo scripts + `DATABASE_URL`** — no new HTTP surface
   on the admin app.

## Build order

1. `prospect-rungs-and-facts` — the ladder grows `prospect` and `nurture`; the lead
   row learns the profile the pool needs (sector, town, language, hook, tier,
   presence facts, WhatsApp/Instagram handles, provenance); every status consumer
   re-audited.
2. `touch-log-next-action` — `biz.touches` returns leaner; `next_action` +
   `next_action_due` on the lead; cadence suggestions and crack-finder queries.
3. `suppression-and-provenance` — the permanent opt-out table, honored everywhere;
   retention rule; the one-page LIA.
4. `import-and-scripts` — the seeding script (dedupe, E.164, provenance, suppression
   check) plus the operator scripts that make Claude Code a full client of the system.
5. `ai-gateway-drafts` — the Gateway wired into the dashboard; grounded first-touch
   and follow-up drafts with per-channel handoff.
6. `outreach-queue-home` — the Needs you feed becomes the daily cockpit: due-today
   queue, nurture wakes, crack-finder rows.
7. `enrichment-tiering` — website facts fetched and graded; A/B/C tier derived in a
   pure function; hook refreshed.
8. `reply-triage` — paste a reply; AI proposes outcome, stage move and next action
   for one-tap accept.

1 is the foundation; 2 depends on it. 3 is independent and must land before 4 (import
respects suppressions from day one). 5 and 6 both build on 2 and make the system
workable daily — the app is coherent after 6. 7 and 8 sharpen grounding and speed and
can trail.

## Sources

- The pool: `~/Downloads/02-Business-Development/2026-07-23-cold-outreach-prospect-list-mafra-lisbon.pdf`
- Activity-based selling / deal rotting: https://www.pipedrive.com/en/blog/stop-losing-best-leads
- Crack-finder views: https://close.com/blog/crm-automation-prevent-lost-leads
- Cadence data: https://www.unifygtm.com/explore/how-many-follow-ups-cold-email ·
  https://www.fyxer.com/blog/cold-outreach-sales-cadence
- Vercel AI Gateway: https://vercel.com/docs/ai-gateway ·
  https://vercel.com/docs/ai-gateway/pricing (no token markup; budgets)
- Portugal ePrivacy: Lei 41/2004 (legal-person opt-out regime) · CNPD Diretriz 2022/1
  (natural persons need consent) — https://www.anacom.pt/render.jsp?categoryId=275862
