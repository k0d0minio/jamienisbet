# Failures: desk-tier

The run's retrospective — what cost a turn, and the rule that would have prevented it. Two
files share this job and split it cleanly: `error.log` (in the stage's `output/`) is the ledger
of errors a **tool** reported, written verbatim at the moment of the fix with its `- resolved:`
and `- rule:` lines, which `retrospective.sh` reads and counts across runs; **this file** is
what the run as a whole learned — a wrong assumption, a STOP, a skipped step, a gate that
blocked, a plan that had to be rewritten — which no tool ever logged. On close-out the
`## Learned rules` bullets below are copied into `_shared/project-rules.md` → Learned rules
(`run-pack.sh <slug> --sync-rules`, called by `close-out.sh`, the same shape as
`retrospective.sh --apply`), so the next run in this repo starts with them. Keep the rules
general; keep the retrospectives specific; never restate an `error.log` entry here.

## Retrospectives

### 2026-09-25 — the release review found nine in-ticket defects that no check could see

- what happened: `/code-review high` at Release reported a header row sized as a body row, a sticky header whose hairline scrolled away, arrow keys that raced a URL-backed value, a segmented control with no tab stop, `DeskButton asChild` dropping `disabled`, a title that could not truncate, a toolbar shorter than a touch control, unsized leading icons, and colour aliases that ignored a nested `[data-theme]`.
- why: the primitives have no rendering surface until `shell-rail-palette` (D-23), so the Vercel previews only proved that nothing else changed; the typecheck and the CSS compile are blind to layout and interaction.
- fixed by: `fix: desk-tier — review findings`, on the branch before the merge.

## Learned rules

- In `packages/ui`, a table with a sticky header uses `border-separate border-spacing-0` and draws its hairlines on the cells: under `border-collapse` the borders belong to the table and scroll away beneath a sticky `<th>`.
- A `packages/ui` token that aliases a themed token with `var()` is declared on `:root, [data-theme]`, not `:root` alone — it resolves where it is declared, so a nested theme subtree would otherwise keep the root's colours.
