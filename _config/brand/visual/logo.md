# Logo

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** The logo and its usage rules. Marks live in [`packages/ui/assets/logo/`](../../../packages/ui/assets/logo/) (mirror copies may be exported to [`../assets/`](../assets/)).

## The mark (locked 2026-06-15)

- **Primary lockup: the wordmark** "Jamie Nisbet" set in **Hanken Grotesk** (600–700). Sentence case, tight tracking. Reads as a person, not a corporation.
- **Compact mark: a typographic JN monogram** (J first, then N) in the same Hanken Grotesk — *not* an abstract symbol.
  - `mark-monogram.svg` — JN in `currentColor` (inherits text colour).
  - `mark-monogram-solid.svg` — white JN on a slate (`--blue-600`) rounded tile, for app sidebar / favicon / slide footer.
- Marketing surfaces lead with the **wordmark**; app/dense surfaces use the **solid JN tile**.
- The earlier abstract **node** and **stack** marks were explored and **dropped** at the user's request — do not reintroduce them.

## Usage rules

- Clear space ≥ the height of the "J" on all sides. Minimum width 120px (wordmark), 28px (monogram tile).
- On dark backgrounds use the on-dark wordmark and the solid tile; never recolour outside the brand palette.
- Don't stretch, rotate, add shadows/gradients, or place on a busy background without a solid chip.
- The JN order is correct — **J then N**. Never NJ.
