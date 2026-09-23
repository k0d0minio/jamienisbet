# Chore: bump-next-audited-deps

- invariant: behaviour unchanged; only dependency versions differ — `pnpm audit --audit-level=high`
  goes from 40 advisories (13 moderate, 25 high, 2 critical) to 4 (all moderate, out of scope).
- change:
  - `websites/*/package.json`, `packages/app-shell/package.json`: `next` `^16.2.9` → `^16.3.6`
    (clears the 2 critical Next.js RCEs — GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4 — and 2 high
    Next.js advisories; carries its pinned `postcss`, `sharp` and `nanoid` up to patched versions
    as a side effect, since none of the three are direct deps here).
  - `websites/*/package.json`: `eslint-config-next` `^16.2.9` → `^16.3.6` (kept in step with `next`
    per the stub).
  - `websites/*/package.json`: `@tailwindcss/postcss`, `tailwindcss` `^4.3.1` → `^4.3.3` (the
    remaining unpatched `postcss` 8.5.15 was pinned by this direct dep, not by `next`).
  - root `package.json`: added `pnpm.overrides` for the four deps no direct bump reaches —
    `browserslist` (`^4.28.7`, via `eslint-plugin-react-hooks > @babel/core > ...`),
    `gray-matter>js-yaml` (`^3.15.2` — scoped to gray-matter's branch only: gray-matter calls
    `js-yaml`'s v3-only `safeLoad`, so a blanket `js-yaml` override to v4 would break it),
    `@eslint/eslintrc>js-yaml` (`^4.3.2` — eslint's own branch, independently vulnerable in the
    4.x line), `minimatch@3>brace-expansion` / `minimatch@10>brace-expansion` (`^1.1.16` /
    `^5.0.7` — two unrelated minimatch major lines each pull their own vulnerable
    `brace-expansion`).
  - `pnpm-lock.yaml` regenerated with `pnpm install` (not hand-edited).
  - `packages/ui/src/components/brand/logo.tsx`: the `next` bump broke the portfolio's
    `opengraph-image` prerender (Satori: "Only intrinsic elements are supported inside `<svg>`") —
    the shared frame markup was a `Frame` custom component nested inside `<svg>`, which `next`
    16.2.9's bundled Satori tolerated and 16.3.6's does not. Replaced it with a plain function
    returning an element array, called directly (`{frame(ink)}`) instead of as a JSX component tag
    — same markup, no visual change. See `lane/output/error.log`.
- rollback: revert this PR's commit. No schema/runtime change — pure dependency-version bump plus a
  same-output structural fix, so a revert simply restores the prior (vulnerable) lockfile state.
- learned: 1 (see `lane/output/error.log` — `- rule:`).
