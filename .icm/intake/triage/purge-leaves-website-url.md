# Stub: An anonymised row still names the business through `website_url`

- lane: chore
- found-by: building `lead-engine/import-and-scripts` (`leads-purge`), 2026-08-30
- priority: P2
- size: S

## What this is

§ 5 of [`.icm/docs/lia-cold-outreach.md`](../../docs/lia-cold-outreach.md) lists exactly
what the retention purge clears: name, email, phone, WhatsApp, Instagram and the hook.
`anonymiseClient` (`packages/services/src/queries/retention.ts`) implements that list,
plus `company` — on an imported business row `name` and `company` hold the same string,
so clearing one and leaving the other would anonymise nothing.

`website_url` is the one that stayed, and it is the hole. A row left reading
*restaurant · Ericeira · https://tascadobairro.pt* is not anonymous in any useful sense —
the URL names the business as squarely as the name column did. `leads-purge` reports how
many rows carry one rather than deciding, because whether a public business address is
personal data at all is a judgement about the assessment, not about the code.

The decision is Jamie's, and it is one of three:

1. Add `website_url` to § 5's list and to `anonymiseClient` — the row keeps its sector,
   town and tier, and nothing points back at the business.
2. Keep it, and say in § 5 *why* — that a company's public web address is not personal
   data, which is defensible for an `Lda` and much less so for a sole trader whose site
   is their own name.
3. Clear it only for the rows where the business is a natural person, which needs a
   column saying which those are and is probably more machinery than the question is
   worth.

`notes` and `intake_message` sit in the same drawer and were left for the same reason:
prose § 5 does not reach. They are Jamie's own words on a prospect and a form-filler's on
themselves respectively, which is why they are not obviously the same answer as the URL.

## Prompt

Read `.icm/intake/triage/purge-leaves-website-url.md` and § 5 of
`.icm/docs/lia-cold-outreach.md` in the jamienisbet repo. Decide with Jamie which of the
three options above § 5 should say, then make the document and
`packages/services/src/queries/retention.ts` (`anonymiseClient`, and the note in
`packages/services/README.md` § The operator scripts) agree with it.

CI is the source of truth — don't run builds locally. Work on a `claude/` branch, push,
open a PR, and `git mv` this stub to `.icm/intake/triage/_done/` in that PR.
