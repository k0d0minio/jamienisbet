# Chore: dependency-advisories-high-critical

- invariant: no user-facing behaviour changes; the transitive-dependency versions the workspace
  resolves differ, all patch/minor bumps within the range each consuming package already declares.
- change: `next` bumped `^16.2.9` → `^16.3.6` in `packages/app-shell`, `websites/admin-dashboard`,
  `websites/portfolio`, `websites/sellers-site` (clears the 2 critical advisories plus the `sharp`
  and `postcss`/`nanoid` high advisories bundled under it); `eslint` bumped `^9.39.4` → `^9.39.5`
  in the three websites (clears the `@eslint/eslintrc` → `js-yaml` high advisory); `tailwindcss` /
  `@tailwindcss/postcss` bumped `^4.3.1` → `^4.3.3` in the three websites (clears the remaining
  `postcss` / `nanoid` high advisories on that separate resolution). Root `package.json` gained a
  `pnpm.overrides` block for three transitive packages neither direct bump reaches: `js-yaml@3`
  (gray-matter's own dependency, pinned to an old `js-yaml` — overridden to `^3.15.2`, staying on
  the v3 API gray-matter expects), `brace-expansion@1` / `brace-expansion@5` (two independent
  resolutions under eslint's `minimatch` chains — overridden to `^1.1.18` / `^5.0.9`), and
  `browserslist` (pinned old by `@babel/helper-compilation-targets`, a dev dependency three levels
  under next's bundled `styled-jsx` — overridden to `^4.28.7`).
- rollback: revert the `package.json` / `pnpm-lock.yaml` changes; each bump and override is a
  patch/minor version within the range the consuming package already allowed, so there is no data
  or schema to unwind.
- verify: `pnpm audit --audit-level=high` on this branch — 40 advisories (13 moderate, 25 high,
  2 critical) before, 4 advisories (4 moderate, 0 high, 0 critical) after. `pnpm typecheck` and
  `pnpm lint` both pass across the workspace (checked locally before the push, ahead of the CI
  read the contract otherwise rests on).
- The `next` bump to `16.3.6` regressed `websites/portfolio`'s `/[locale]/opengraph-image` route:
  Next 16.3's `next/og` renderer now rejects a non-intrinsic (custom-component) element nested
  inside an `<svg>`, and `LogoFull`/`LogoMarkSolid` (`packages/ui/src/components/brand/logo.tsx`)
  nested a `Frame` component there. Fixed by calling `Frame` as a plain function
  (`{Frame({ ink })}`) so its `<path>`/`<rect>` land as direct `<svg>` children instead of behind
  a component boundary — same rendered output, no visible change, browser rendering unaffected.
  This is this branch's own regression (introduced by its own `next` bump), so the fix belongs in
  this PR rather than a separate ticket.
- learned: none — no new rule; the stub itself was already the artifact of the last run's
  retrospective.
