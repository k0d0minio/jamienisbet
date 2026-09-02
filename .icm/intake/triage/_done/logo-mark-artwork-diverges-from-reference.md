> Resolved 2026-09-02, in the admin rollout PR (#124) rather than as its own pick-up —
> and not the way the prompt below describes. Jamie's call was to stop redrawing the mark
> at all: `LogoMark`/`LogoMarkSolid` now paint the letters through an alpha mask cut from
> the reference PNGs, so there is no geometry left to re-cut. The frame stayed vector. See
> `packages/ui/src/components/brand/logo-letters.ts` and BRAND.md § Iconography.

# Stub: The shipped JN mark is not the artwork it was drawn from

- lane: bug
- found-by: rasterising the mark while re-deriving the admin's PWA icons in
  `brand-logo-rollout/admin-dashboard-rollout`, 2026-09-02
- priority: P1 — the mark is already live on every surface; the icon geometry waits on it
- size: S
- sources: `packages/ui/src/components/brand/logo.tsx` (`MarkShapes`),
  `packages/ui/assets/logo/logo-mark.svg`, `-solid.svg`,
  `websites/admin-dashboard/public/logos/2.png` and `4.png` (the reference set)

## What this is

`ui-logo-and-palette` rebuilt the mark as five geometric primitives — three bars, a
diagonal parallelogram and a diamond. Rendered side by side against the reference PNGs it
was derived from, the primitives are not a stylisation of that artwork; they are a
misreading of it. Nothing in the epic caught it because the mark had only ever been read
as source, never rasterised.

Four divergences, all in `MarkShapes` and therefore in every asset and component derived
from it:

1. **The J's foot points the wrong way.** In the reference the J terminates in a hook that
   curves left and back *up*, the way a J does. The shipped diamond is a spearhead that
   runs left to `x = 9.0` and stops — it reads as an arrow, not a letter, and it is the
   single furthest piece of ink in the artwork.
2. **The N's diagonal stops short.** It ends at roughly `(76, 63)`, partway up the
   trailing bar, where the reference runs it corner to corner into that bar's foot at
   `y ≈ 78.7`. The result is a dark notch bitten out of the N's bottom right, which at
   small sizes closes the letter into a blob.
3. **A spur at the apex.** The diagonal's top vertex clears the bars it joins, leaving a
   small tooth above the N's shoulder.
4. **The mark overflows its frame.** The reference composes the letters inside a generous
   inner margin; the shipped mark sits low and left and the J's spearhead runs into the
   frame's own stroke.

Where this still bites: `LogoMark` and `LogoMarkSolid` are the mark on every surface that
renders it live — the admin's sidebar masthead, its phone title bar and its login screen
today, and the portfolio and sellers-site chrome once stubs 3 and 4 land. The admin's
*installed* icons and favicon no longer depend on the geometry at all: they were cut
straight from the reference PNGs in the admin rollout, precisely because a hand-written
approximation of a typographic mark does not read as the logo. That is the same reason
this stub exists, and it is worth weighing when deciding how the components should render
the mark once it is re-cut.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this stub first,
then `.icm/intake/brand-logo-rollout/breakdown.md`, `packages/ui/BRAND.md` § Iconography,
and `.claude/skills/design-dna/SKILL.md`.

**Open the reference artwork first** — `websites/admin-dashboard/public/logos/2.png`
(icon form, light) and `4.png` (icon form, dark). You can see them; the shipped geometry
in `packages/ui/src/components/brand/logo.tsx` (`MarkShapes`) is what has to match them.

Re-cut the five primitives so the mark reads as the reference does: a J with a hook that
curves left and back up, an N whose diagonal runs corner to corner into the foot of its
trailing bar with no notch and no spur at the apex, and the pair composed inside the
frame's inner margin rather than crashing into it. Keep the artwork a set of filled paths
in a `0 0 100` box — that part of the rebuild was right, and `LogoMark` /
`LogoMarkSolid` and their `--logo-tile` / `--logo-ink` pair stay exactly as they are.
Mirror the change into `assets/logo/logo-mark.svg`, `logo-mark-solid.svg` and the tile in
`logo-full.svg` so the SVG sources and the component do not drift.

**Rasterise before you call it done.** That is the check this epic skipped: render the
mark at 512, 180, 48 and 32 against the reference and look at it, in both readings. A
mark that is only ever read as source is how the current geometry shipped.

No consumer measures the artwork any more, so nothing downstream needs recomputing: the
admin's installed icons and favicon are static PNGs cut from the reference set, not
derived from these paths. Check them by eye once the mark is re-cut, though — the point of
the epic is that the live components and the installed icons read as the same logo.

Run no local build/lint/typecheck — **CI is the source of truth.** Ship on a `claude/`
branch as a PR; when CI is green, close this stub with
`git mv .icm/intake/triage/logo-mark-artwork-diverges-from-reference.md
.icm/intake/triage/_done/`.
