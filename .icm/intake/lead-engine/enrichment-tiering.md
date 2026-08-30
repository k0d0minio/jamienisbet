# Stub: Facts fetched, tiers derived, hooks refreshed

- feature-slug: enrichment-tiering
- sequence: 7 of 8
- depends-on: prospect-rungs-and-facts, ai-gateway-drafts
- priority: P2
- size: M

## What this is

The grounding that keeps drafts from being slop, and the ordering that keeps the
queue honest. The pool's PDF shipped with hand-researched hooks; this keeps them
alive as the pool grows and goes stale.

- **Enrichment** — for a lead with a `website_url`: fetch the site server-side, have
  the gateway model extract facts (does it take bookings online? last-touched feel?
  language? social links? contact channels?) and propose a `website_grade`. No
  Google-reviews scraping — `review_count` stays hand-entered until a Places API is
  ever worth its key (it is not, at this scale). Leads with no website keep
  `website_grade: none/social-only` from import.
- **Tier** — `fit_tier` is derived in a **pure function** in `packages/services`
  from stored facts only (website grade, sector weight, town proximity band,
  review presence): re-tiering is a re-run, never a migration, and "why is this
  A-tier" always has a readable answer. AI proposes facts; the function decides the
  tier. Session's call on the exact weights; the breakdown's research note is the
  starting point (a web consultant's strongest signal is a bad-or-missing website).
- **Hook refresh** — alongside the grade, the model may propose an updated hook;
  the existing hook is never overwritten silently — proposals sit next to the
  current value for one-tap accept.
- **Surfaces**: an Enrich action on the lead profile (per-lead, shows what changed
  before saving) and a `leads-enrich` batch script beside sequence 4's toolbox
  (`--dry-run`, rate-limited, skips recently-enriched rows).

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/enrichment-tiering.md` in the jamienisbet repo. Build
website-fetch enrichment through the AI Gateway (facts + website_grade + proposed
hook, never silently overwriting), the pure tier-derivation function in
`packages/services`, the per-lead Enrich action with a review-before-save state, and
the `leads-enrich` batch script with `--dry-run`.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub
to `.icm/intake/lead-engine/_done/` in that PR.
