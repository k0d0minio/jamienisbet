# Plan: retire-app-tier

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Desk form controls: `packages/ui`.** Add `components/desk/field.tsx` (`DeskField`,
   `DeskInput`, `DeskTextarea`, and `useFieldWiring` moved over from `app/field.tsx`) and
   `components/desk/select.tsx` (`DeskSelect` and its parts, on the same Radix base as
   `AppSelect`). Keep the `App*` prop shapes and add the styles to `desk.css` / `tokens/desk.css`
   as `desk-*` names. Export them from `src/index.ts`. Apply the `Omit` rule for native attribute
   names from `_shared/project-rules.md`. Done when `packages/ui` typechecks with the app tier
   still in place.
2. **`Sheet` off the spring: `packages/ui/src/components/ui/sheet.tsx`.** Replace
   `--duration-sheet` / `--spring-sheet` with desk tokens, or remove the transition. Opening and
   closing do not slide. Detents stay: the drag follows the finger, and a release or tap settles
   at once. The keyboard rule is unchanged. Done when `sheet.tsx` names no app-tier token.
3. **Forms and sheets in the admin.** Swap every `App*` field, select and textarea, every
   `Grouped*` part (→ `Record*`) and the app `SegmentedControl` (→ `DeskSegmentedControl`) in
   the lead sheets, next-step pane, touch log, reply, draft, draft handoff, enrich, opt-out, repo
   link, send and share form, new lead (`client-create-form.tsx`), board keys sheet and login
   form. Done when none of those files imports an app-tier component.
4. **The screens outside the four, and the shell.** Replace `app-screen.tsx` with a flat desk
   page header, and `app-menu.tsx` with `DeskMenu` or a `RecordRow` sheet. Update their callers:
   Work on the phone, the Inbox list, the lead profile, and the leads page and its loading
   screen. Port login, not-found, both `error.tsx` screens and every `loading.tsx`. Port
   pull-to-refresh, `swipe-row.tsx`, `chip.tsx`, `loading-line.tsx`, `board-refresh.tsx`,
   `channel-picker.tsx`, `deal-badges.tsx`, `command-palette.tsx`, `client-stripe-link.tsx` and
   every other file on an `app-*` utility to desk tokens. On `<body>`, swap `app-tier` for
   `desk-tier`, and move the `globals.css` plumbing and the PWA colours onto desk tokens. Done
   when a search of `websites/admin-dashboard` for any spec criterion 2 pattern returns nothing
   outside Money.
5. **Money: a mechanical port.** Port `money/page.tsx`, `money/loading.tsx`,
   `invoice-actions.tsx`, `invoice-create-form.tsx`, `payment-link-actions.tsx` and
   `payment-link-create-form.tsx`. `GlanceRow` becomes a mono figure row, `Grouped*` becomes
   `Record*`, and `App*` becomes `Desk*`. Leave `lib/stripe.ts`, `lib/money.ts` and
   `money/actions.ts` alone. Done when the whole repo passes the criterion 2 search.
6. **Delete the tier.** Delete `app.css`, `tokens/app.css`, `src/components/app/` and the index
   block. Remove the `package.json` export, the `files` entry and `check:css:app`, the
   `text-app-*` group in `lib/utils.ts`, and the "beside app.css" comments in `desk.css` /
   `tokens/desk.css`. Done when CI's lint, typecheck and build pass on the flipped head.
7. **Docs.** Update `BRAND.md` (two tiers, desk form controls listed), `design-dna/SKILL.md`,
   `packages/ui/README.md`, `packages/ui/SKILL.md` and `websites/admin-dashboard/README.md`.
   Done when a search of those five files for "app tier", `app.css` and `App*` names returns
   nothing.
8. **Sweep audit.** On the preview, check every screen in the spec's list at 1280px and 390px,
   in light and dark, for hard-coded colour, hover-only affordances and touch targets under
   44px. Fix what it finds, and write the screen × width × theme table in `notes.md`. Done when
   every line reads `pass`.

## Risks

- **Sheet regressions on iOS.** Removing the spring can break the detent height transition, or
  the keyboard-inset jump. Signal: a sheet opens at the wrong height, or a focused field ends up
  under the keyboard, in the preview on the iPhone. Keep the detent logic and change only its
  timing.
- **Type metrics shift.** Moving login, not-found, error and loading from the system stack to
  Hanken Grotesk changes their line heights. Signal: truncation or overlap in the audit at
  390px.
- **Tailwind purge after the deletion.** A leftover `text-app-*` class in a template string
  would fail silently, with no build error, and render unstyled. That is why pass 6's search
  covers template strings too: a `rg` for the prefixes, not only the import names.
- **Scale.** About 40 files are touched. Commit per pass so a resume sees where the port
  stopped.
