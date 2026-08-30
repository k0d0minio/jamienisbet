# Stub: Deal, notes and todos edit where they sit

- feature-slug: edit-in-place
- sequence: 4 of 5
- depends-on: profile-person-work-tabs
- priority: P1
- size: M

## What this is

Every change on the profile currently goes through a bottom sheet: the deal is one
big form behind "Edit deal", notes behind "Write a note", a todo behind an add
sheet. The direction (Jamie's, 2026-08-29) is **edit in place** — tap the thing
itself and it becomes editable where it sits. Sheets survive only where a phone
keyboard genuinely needs the whole screen.

- **Deal** (`lead-deal-card.tsx`) — one row per component (cash, equity,
  commission, barter), each editable on its own: tap the row, change that one
  term, done. Components not yet part of the deal offer themselves quietly (an
  "add a term" affordance), rather than a form that always shows every field.
  This is where the composable model becomes tangible: an equity deal is one row
  saying `12%`, and no € field ever appears uninvited.
- **Notes** (`lead-notes-card.tsx`) — the note text itself is the editor: tap into
  it, type, save on blur/explicit action. On a phone the medium-detent sheet may
  stay as the focused editor; on desk the sheet indirection goes.
- **Todos** (`lead-todos.tsx`) — an always-present quick-add input in the group
  (type, enter, added) instead of a sheet; ticking and deleting stay as they are
  (already optimistic and good).

Per-component saves post through the same scoped server actions (`saveDealTerms`
accepting subsets, `saveClientNotes`, `addTaskAction`) — optimistic where the
pattern already exists, toast-and-rollback on failure, matching the app tier's
existing feel (springs, haptics, 44px targets).

## Prompt

Read `.icm/intake/client-deal-ux/breakdown.md` and
`.icm/intake/client-deal-ux/edit-in-place.md` in the jamienisbet repo. Make deal,
notes and todos on the lead profile editable in place: deal terms as individually
editable component rows (add/edit/clear one term at a time), notes as an inline
editor, todos with an always-present quick-add input. Keep sheets only where the
phone keyboard needs the screen.

Follow the `design-dna` skill. Verify on the Vercel preview at phone and desk
widths, both colour modes. CI is the source of truth — don't run builds locally.
Work on a `claude/` branch, push, open a PR, and `git mv` this stub to
`.icm/intake/client-deal-ux/_done/` in that PR.
