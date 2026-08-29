# Stub: A sheet on a desktop is 1080px wide

- feature-slug: sheet-width-desktop
- sequence: found during money-native (6 of 8)
- depends-on: app-tier-foundations
- priority: P3
- size: S

## What this is

`SheetContent` caps itself at `sm:max-w-lg` from `sm` up, meaning to be a
centred dialog around 512px. It isn't: Tailwind v4 resolves `max-w-lg` through
`--container-lg`, and `packages/ui/tokens/spacing.css` sets that to **1080px**
as a *page* container width. So every sheet in the admin — the lead profile's
edit sheets, the todo sheet, add-a-lead, and now Money's action and create
sheets — opens 1080px wide on a laptop, with a short action list and its values
pushed to opposite edges of the screen.

Pre-existing, and estate-wide rather than one screen's: the fix is one line in
`packages/ui/src/components/ui/sheet.tsx` (an explicit width rather than a
container-scale alias), but it changes the geometry of every sheet in the app at
once, so it needs its own pass over the lead profile, the todos and the create
flows rather than riding along with a screen rebuild.

Worth deciding at the same time: whether the marketing tier's `Dialog` has the
same problem (it carries the same `sm:max-w-lg`), and whether `--container-*`
should stay in the same namespace Tailwind reads its `max-w-*` scale from at
all — a page-width token silently redefining a utility is the kind of collision
that will happen again.

Found on the phone-first path, so it has never been visible on the surface this
app is designed for; it is only ever wrong on a laptop.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and this stub in the
`jamienisbet` repo. Give `SheetContent` a real desktop width instead of
`sm:max-w-lg`, which resolves through the brand's 1080px `--container-lg` and
makes every sheet in the admin a near-full-width dialog on a laptop. Decide
whether `Dialog` needs the same, and whether the `--container-*` tokens should
move out of Tailwind's `max-w-*` namespace.

Follow the amended `design-dna` skill. Verify every sheet in the admin on the
Vercel preview — lead profile edits, todos, add a lead, Money's action and
create sheets — at phone, tablet and desk widths, both colour modes. Work on a
`claude/` branch, push, and `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/` when done.
