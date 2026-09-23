# Stub: Form controls are still sized for a mouse

- lane: tweak
- feature-slug: app-tier-form-controls
- sequence: found during native-polish-sweep (8 of 8)
- depends-on: app-tier-foundations
- priority: P2
- size: M

## What this is

Every screen in the admin now sets in the app tier — its own type scale, its
own radii, grouped slabs, materials. Every *field* in it does not. `Input`,
`Textarea`, `Label` and `SelectTrigger` are the marketing tier's:
`h-9`, `rounded-sm` (5px), `text-base md:text-sm`, a `shadow-xs`, and a focus
ring drawn for a page rather than for a slab. They are 44px on a phone only
because `app/globals.css` lifts the floor for coarse pointers — a patch over
the symptom, and one that leaves the *desktop* reading of every sheet at 36px
inside 16px-radius chrome.

It shows most in the sheets, which is where nearly all the app's typing
happens: add a lead, add a todo, the profile's contact / deal / notes edits,
Money's two create forms. A 5px field in a 24px sheet is the last thing on
those screens that still reads as a website form.

The polish sweep restyled `/login` and deliberately did **not** touch its
field, because giving one screen its own input would have made login the odd
screen out again, just differently. This is that decision's other half.

The shape of the answer is a package question, not a screen one: either an
app-tier variant on the existing primitives (a `data-tier` or a `size="app"`
that reads `--app-radius-control`, `--app-text-body`, `--app-touch-min`), or
app-tier siblings in `src/components/app/` the way `GroupedRow` sits beside
the shadcn primitives. Whichever it is, it changes the look of every form in
the admin at once, so it needs its own pass over all of them rather than
riding along with a screen.

Worth settling at the same time: whether the coarse-pointer floor in
`app/globals.css` can then go away, since a control that sizes itself
correctly does not need a media query to rescue it.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and this stub in the
`jamienisbet` repo. Give the app tier its own form controls: `Input`,
`Textarea`, `Label` and `Select` currently render on the marketing tier's
36px/5px geometry inside app-tier sheets and slabs, and are only finger-sized
because `websites/admin-dashboard/app/globals.css` lifts the floor for coarse
pointers. Decide between an app-tier variant on the existing primitives and
app-tier siblings in `packages/ui/src/components/app/`, then convert every
form in the admin — login, add a lead, add a todo, the profile's contact /
deal / notes sheets, Money's invoice and payment-link forms — and work out
whether the coarse-pointer floor can be retired with them.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, and
verify every form on the Vercel preview at phone, tablet and desk widths in
both colour modes — including the on-screen keyboard's interaction with the
sheet detents. `git mv` this stub to `.icm/intake/triage/_done/` when done.
