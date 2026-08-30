# Stub: The profile in two tabs

- feature-slug: profile-person-work-tabs
- sequence: 3 of 5
- depends-on: status-ladder-past-clients, composable-deal-terms
- priority: P1
- size: L

## What this is

The lead profile (`app/(app)/leads/[id]/page.tsx`) is nine grouped sections down a
page — data-rich, not navigable. It becomes **two segments under the identity
header**:

- **Person** — the record: status (+ last worked), contact, deal, the folded intake
  row, danger zone.
- **Work** — the working surface: notes, todos, forms.

The header stays the masthead it is (name, company · status, headline figure from
`composable-deal-terms`) and gains **two status icons: GitHub and Stripe**. Each is
a small glyph in an active or inactive state — connected: tinted, tap opens the
repo / Stripe customer; not connected: dimmed, tap opens the existing
`ClientRepoLink` / `ClientStripeLink` control in a sheet to link one. That is the
entire delivery/billing surface: the **Delivery & billing section dies**, including
the default-branch row and the "Set up" sheet wrapper (the two link controls
themselves survive — the icons and the create-invoice path still need them).

**The convert flow dies with it.** `convert-flow.tsx`, `lead-convert-row.tsx`,
`conversionGaps()` and the header gap badges all go. Changing status to Active
client *is* conversion; an inactive icon is the only reminder that plumbing is
missing. Nothing warns, walks, or blocks.

**Intake demotes** to a single folded row at the foot of the Person tab — the
existing `GroupedDisclosure` from `lead-intake.tsx` without its own section
header. Danger zone stays last on Person, in red, away from the segment control.

Mechanics: the segment choice should survive within a visit (URL param or state —
session's call) and the two-column desktop layout gives way to whatever the tab
content wants; each tab is short enough to be one column. Deal, notes, todos and
forms move over as the components they are today — their interaction rework is
`edit-in-place` and `form-sharing`, not this stub.

## Prompt

Read `.icm/intake/client-deal-ux/breakdown.md` and
`.icm/intake/client-deal-ux/profile-person-work-tabs.md` in the jamienisbet repo.
Restructure the lead profile into two segments — Person (status, contact, deal,
folded intake, danger zone) and Work (notes, todos, forms) — with GitHub and
Stripe reduced to active/inactive status icons in the identity header (tap: open
when linked, link when not). Remove the convert walkthrough, the "Finish
conversion" row and the conversion gap badges entirely: status is conversion.

Follow the `design-dna` skill. Verify on the Vercel preview at phone and desk
widths, both colour modes. CI is the source of truth — don't run builds locally.
Work on a `claude/` branch, push, open a PR, and `git mv` this stub to
`.icm/intake/client-deal-ux/_done/` in that PR.
