# Suggestions — making this repo a genuinely valuable business product

Ideas to turn the skeleton into a compounding asset. Ordered roughly by leverage. Each is a
proposal, not a decision — pick what fits. Many can become their own ICM stage or workspace later.

## 1. Lead generation & the local-affiliate program
- **Per-seller referral codes + first-contact logging.** Give each local friend a unique code and
  log every introduction the moment it happens (in `shared/clients/`). This makes the 10% payout
  unambiguous and stops two friends from claiming the same customer.
- **Productise the landing-page offer.** A fixed scope, a fixed starting price, and a one-sentence
  pitch your friends can deliver without understanding the tech. Keep their job to *warm intros
  only* — you quote and close — to protect margin and brand.
- **A seller starter-kit.** One-pager, before/after examples, price sheet, and brand assets, all
  generated from `_config/brand/`. Lives in `lead-generation/03_affiliate_program/`.
- **Reciprocal partner referrals.** Local accountants, print shops, co-working spaces and web
  agencies already serve your ideal customer. Trade referrals with them — zero ad spend, high trust.
- **Testimonial & case-study engine.** After each delivery, capture a short result + quote into
  `shared/knowledge/case-studies/`. Word-of-mouth is your only channel today; this makes it
  repeatable and feeds proposals, the portfolio site, and outreach.

## 2. Proposals & negotiation (your flagship)
- **Win/loss log that feeds the playbook.** Record why each deal closed or died. Periodically fold
  the lessons back into `proposals/references/` — this is ICM's "fix the source, not the output"
  principle, and it makes the negotiation coach measurably better over time.
- **Always present tiered options (good / better / best).** Anchoring with three options reliably
  lifts the average deal size; bake it into the quote stage as a default.
- **A value-based pricing calculator.** A reference doc that estimates the client's upside so you
  price against *their* value, not your hours. Pairs with the deal-analysis stage.

## 3. Daily operations & automation (high convenience payoff)
- **Morning brief + weekly review.** You already have `tracker/` for the daily run; add a Friday
  "weekly review" routine that scans the pipeline, overdue invoices, and stalled projects.
- **Connect the tools you already have.** This environment exposes Gmail, Google Calendar, Stripe,
  Linear, Supabase and more via MCP. Candidate automations: invoice-paid detection (Stripe →
  `finance/`), deadline reminders (compliance calendar → Calendar), proposal follow-ups (Gmail).
  Keep these as *local scripts/MCP calls* per ICM — the AI only does the parts that need judgment.
- **Invoice chaser.** A scheduled routine that flags receivables older than N days and drafts a
  polite, on-brand reminder for your approval.

## 4. Brand & websites
- **Design tokens shared by sites *and* documents.** Define colour/type/spacing once in
  `_config/brand/visual/` and have both the websites and the proposal/invoice templates resolve
  from it, so a single "brand refresh" updates everything.
- **Portfolio as a living artifact.** Auto-suggest portfolio entries from completed projects so the
  site stays current without manual effort.

## 5. Financial resilience
- **Automatic tax-reserve split.** Each time income is recorded, set aside the IVA/IRS/Segurança
  Social estimate into a "reserved" figure so a tax bill is never a surprise. (Decision-support —
  confirm the rates with your *contabilista*.)
- **Separate business bank account from day one** to keep bookkeeping and the future entity clean.

## 6. Keeping the ICM system healthy as it grows
- **Standardise the client slug.** Use the same lowercase slug for a client across
  `shared/clients/`, `projects/`, `websites/clients/`, and proposal `output/` so an agent can trace
  one client end-to-end. Document it in `_config/conventions/`.
- **`_` prefix = template / non-executing.** `_template-workspace`, `_template-project`,
  `_template-site` should never be treated as live. State this convention explicitly.
- **Date-stamp legal & tax reference notes** with their source, so staleness is visible as
  Portuguese law changes.
- **Provenance markers (ICM future direction).** When stages start producing real content, have each
  output cite the source instruction/reference that produced it, so you can trace a wrong sentence
  back to the file that caused it.
- **`Verify` steps in stage contracts.** Use the contract's Verify section to cross-check a stage's
  output against earlier stages before the human review gate — catches drift early.

## 7. Things worth deciding early
- **Engage a *contabilista certificado* before registering the entity.** Several `legal-and-tax`
  stages assume you'll hand artifacts to one; the cost is usually small and the tax savings real.
- **Have a lawyer review the contract template once.** Then every generated contract inherits a
  vetted base.
- **A simple metrics dashboard** (pipeline value, win rate, monthly revenue, utilisation) assembled
  from the workspaces — so the "is this worth my time?" question has data behind it.
