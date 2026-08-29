# Stub: A deal is components, not a price

- feature-slug: composable-deal-terms
- sequence: 2 of 5
- depends-on: none
- priority: P1
- size: M

## What this is

Today a deal is a euro figure with decorations: `dealType` is `cash | barter`,
equity/commission are bps add-ons, and everything that judges deal-completeness
checks `valueMinor > 0` — so an equity-based engagement is nagged for a monetary
input that makes no sense. The model becomes **composable terms**: a deal is any
combination of

- **cash** — `valueMinor` + `billingType` (one-off or monthly),
- **equity** — `equityBps`,
- **commission** — `commissionBps`,
- **barter** — `barterTerms` (+ the in-kind reading of the value figure),

and it is *set* when at least one component exists. No component is ever required.

Model work (`packages/services`):

- A `dealComponents(client)` / `hasDeal(client)` helper in the services layer
  becomes the one place that answers "what is this deal made of" — the profile,
  list row, badges and totals all read it instead of each re-deriving from
  `valueMinor`. Whether `dealType` survives as "how to read the € figure"
  (cash vs in-kind) or becomes an explicit flag is the session's call; the
  requirement is only that no component gates another.
- `saveDealTerms` (dashboard `actions.ts`) accepts any subset, including clearing
  the value entirely on a deal that has equity.

Figures and totals:

- Masthead totals (`leads/page.tsx` `totals()`) stay **cash-only**: "In play" and
  "Per month" count invoiceable euros, "In kind" keeps barter. Equity/commission
  never fold into a euro total.
- **Headline figure**: on the list row and the profile masthead, a deal with cash
  shows the € as today; a deal with *no* cash shows its strongest non-cash
  component as the figure — `12% equity`, `8.5% comm` — instead of nothing (mono,
  as all figures). `valueLabel` in `lib/leads.ts` and the profile's
  `figure`/`figureLabel` are the two call sites.
- `DealBadges` keeps riding the rows; it no longer needs to carry what the
  headline now says twice — trim overlap rather than stacking both.

This stub removes the *model's* money requirement. The `conversionGaps()` "no deal
value" badge and the convert flow's value-gated step live in the profile and die
with it in `profile-person-work-tabs`; here they are only kept compiling (gap
logic should read `hasDeal`, not `valueMinor > 0`).

## Prompt

Read `.icm/intake/client-deal-ux/breakdown.md` and
`.icm/intake/client-deal-ux/composable-deal-terms.md` in the jamienisbet repo.
Make the deal model composable: cash value, equity %, commission % and barter are
independent components, a deal is set when any one exists, and nothing requires a
euro figure. Keep masthead totals cash-only (barter stays "in kind"); give
equity/commission-only deals their percentage as the headline figure on the leads
list row and the profile masthead.

Follow the `design-dna` skill. CI is the source of truth — don't run builds
locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub to
`.icm/intake/client-deal-ux/_done/` in that PR.
