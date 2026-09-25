# Build notes: retire-app-tier

- commits: bcf3283 desk form controls + sheet without the spring · 4c23d40 every admin screen and form on the desk tier · b23c6a4 delete the app tier from packages/ui · 6e54d38 docs, two tiers · (this commit) audit fixes and notes
- ci: see status.md — the draft owes nothing; the full gate settles after the ready flip

## What changed

- `packages/ui/src/components/desk/field.tsx`, `select.tsx` (new): `DeskField` / `DeskLabel` / `DeskInput` / `DeskTextarea` and `DeskSelect` with its parts — prop-compatible with the `App*` set, on the row step (32px desk, 44px touch), 16px value text on touch, focus inside the control, the same ARIA wiring. `DeskSegmentedControl` options take a `title` (the draft's closed doors).
- `packages/ui/src/components/ui/sheet.tsx`: no slide and no spring. The zoom-and-fade entrance is off (`animate-none`), and a detented sheet takes its detent at once on release — the drag still follows the finger, a far release still dismisses, the keyboard still takes the tallest detent.
- `packages/ui/src/components/ui/dialog.tsx`: the close ✕ grows to a 44px target under a coarse pointer (audit fix — it was 16px in every sheet).
- `packages/ui/src/components/desk/record.tsx`: an interactive row with no value (an action row) sets its label at full strength instead of the muted key colour (audit fix — ported action rows read as disabled).
- `packages/ui`: `app.css`, `tokens/app.css`, `src/components/app/` deleted; the index block, the `./app.css` export, `files` entry and `check:css:app` step, and the `app-*` groups of the class-merge config removed.
- `websites/admin-dashboard`: every `App*` control → `Desk*`, `Grouped*` → `Record*`, the app `SegmentedControl` → `DeskSegmentedControl` (draft, new lead, touch direction), every `app-*` / `material-*` / `spring-*` utility → its desk token. `app-screen.tsx` → `desk-screen.tsx` (a flat sticky title bar — no large title), `app-menu.tsx` → `account-menu.tsx`, `money-figures.tsx` (new) replaces `GlanceRow`. `<body>` carries `desk-tier`; `globals.css` links `styles.css` + `desk.css` only; view transitions are a 120ms cross-fade; the pre-paint script no longer probes for blur. Work's phone skeleton was rewritten to the current phone layout (it still drew the old chip rail). `BoardRefresh` lost its app-tier branch; the unused `Chip` was removed.
- `app/globals.css`: toasts on the desk tier through a `.desk-tier`-scoped rule (the shared `toast.tsx` is untouched).
- Docs: `BRAND.md`, `design-dna`, `packages/ui/README.md` + `SKILL.md`, the admin README describe two tiers.
- Not changed: Stripe and Money server code (`lib/stripe.ts`, `lib/money.ts`, `money/actions.ts`), the portfolio, the sellers site.

## Sweep audit

How it was run: the admin on `next dev` in the session, signed in with a local password and **no data credentials** (no `DATABASE_URL`, Stripe key or GitHub token), driven by Playwright at 1280×800 (fine pointer) and 390×844 (touch, `pointer: coarse` confirmed), in light and dark. Each screen therefore renders its designed not-configured or error state; the shell, bars, sheets, fields and skeletons are the real ones. Per screen × width × theme it checked: `<body>` is `desk-tier` with Hanken Grotesk computed; no element carries an app-tier class; on touch no visible interactive element is under 44×44px; and a screenshot was read by eye. A static pass over the admin's TSX/CSS found no hard-coded colour outside the PWA colour declarations (`manifest.ts`, `app/layout.tsx` viewport) and no hover-only affordance. Two sheets were opened (new lead, account menu) at 390 in both themes: every field, segment and button measured 44px.

- **Work** — / — at 1280 the three panes' "GitHub isn't configured" state; at 390 the phone title bar and the same state
- **Inbox** — /inbox — both groups' not-configured and database-error lines
- **Leads** — /leads — 1280 the table view with filters and the database banner; 390 the DeskScreen bar, filters, banner, empty state and floating add
- **Lead profile** — /leads/<id> — renders its own error boundary (no database), desk bar and DeskButton
- **Money** — /money — DeskScreen bar and the "Stripe isn't configured" record
- **Login** — /login — lockup, flat panel, DeskField + DeskInput
- **Not-found** — /no-such-screen — DeskScreen bar, record block, action row
- **Error screen** — (app)/leads/[id]/error.tsx, reached through a missing database
- **Loading screen** — every loading.tsx (Work, Leads, Money, Inbox, lead) mounted on a temporary route

Fixed on the way: the sheet close ✕ (16px → 44px on touch), action rows reading muted, Money's figures sitting tight on the Invoices header (masthead `pb-3`).

| Screen | Width | Theme | Result |
| --- | --- | --- | --- |
| Work | 1280 | light | pass |
| Work | 1280 | dark | pass |
| Work | 390 | light | pass |
| Work | 390 | dark | pass |
| Inbox | 1280 | light | pass |
| Inbox | 1280 | dark | pass |
| Inbox | 390 | light | pass |
| Inbox | 390 | dark | pass |
| Leads | 1280 | light | pass |
| Leads | 1280 | dark | pass |
| Leads | 390 | light | pass |
| Leads | 390 | dark | pass |
| Lead profile | 1280 | light | pass |
| Lead profile | 1280 | dark | pass |
| Lead profile | 390 | light | pass |
| Lead profile | 390 | dark | pass |
| Money | 1280 | light | pass |
| Money | 1280 | dark | pass |
| Money | 390 | light | pass |
| Money | 390 | dark | pass |
| Login | 1280 | light | pass |
| Login | 1280 | dark | pass |
| Login | 390 | light | pass |
| Login | 390 | dark | pass |
| Not-found | 1280 | light | pass |
| Not-found | 1280 | dark | pass |
| Not-found | 390 | light | pass |
| Not-found | 390 | dark | pass |
| Error screen | 1280 | light | pass |
| Error screen | 1280 | dark | pass |
| Error screen | 390 | light | pass |
| Error screen | 390 | dark | pass |
| Loading screen | 1280 | light | pass |
| Loading screen | 1280 | dark | pass |
| Loading screen | 390 | light | pass |
| Loading screen | 390 | dark | pass |

## Acceptance criteria status

- [x] app tier files gone; index, package.json export/files/lint step gone — b23c6a4.
- [x] residual search of `websites/`, `packages/`, `.claude/` clean (only history under `.icm/` and `decisions.md` mention it); `app-screen.tsx` / `app-menu.tsx` gone.
- [x] desk form controls exported; 32px desk / 44px touch, 16px touch text, focus inside, ARIA wiring as AppField.
- [x] every form and edit sheet on the desk controls — a mechanical swap, no behaviour change; the new-lead and account sheets were opened in the session. The rest are for the preview smoke (they need data).
- [x] login, not-found, both error screens, every loading.tsx on the desk tier, no large title.
- [x] `<body class="desk-tier">`, globals links styles.css + desk.css only, Hanken Grotesk computed on every screen.
- [x] `/money` on the desk tier, still absent from rail, tab bar, palette and Inbox; no Stripe/Money server code changed. Its populated state (figures, invoices, links) needs Stripe — preview smoke.
- [x] sheets without slide or spring; detent logic unchanged apart from timing. The drag itself needs a finger — preview smoke on the iPhone.
- [x] pull-to-refresh: desk tokens, a 100ms eased settle, no spring. Toasts: a desk-scoped rule in `globals.css` makes the card a flat desk panel (surface, hairline, 8px, ui step, the float shadow) with a 120ms fade and no rise; the Toaster's bar offset is unchanged. No toast was raised in the session (every action that raises one needs data) — preview smoke.
- [x] PWA colours equal `--bg` (= `--desk-canvas`): #FFFEFA / #1E1E1E.
- [x] audit table above, every line pass.
- [x] BRAND.md and design-dna: two tiers; § Desk tier lists the form controls.
- [x] packages/ui README + SKILL.md and the admin README: no app tier.
- [x] no file under `websites/portfolio/` or `websites/sellers-site/` changed.
- [ ] CI lint / typecheck / build and the admin preview — settles on the post-flip head.

## Notes for Release

- Typecheck was not run locally (the repo's rule); the first verdict on the ~40-file swap is the post-flip gate. Places worth a look if it is red: the JSX generic on the draft's door control (`<DeskSegmentedControl<DraftChannelValue | "">`), and `DeskSegmentedControl`'s inferred `T` in the touch-direction and new-lead switches.
- `vt-app-header` / `vt-app-tabs` / `vt-app-rail` are view-transition names, not app-tier utilities, and were kept.
- `RecordRow` now sets an action row's label at full strength — this also brightens action rows on the screens earlier runs built (lead profile), which is the intended reading.
- The populated states (real leads, the board, gates, Money with Stripe, dragging a detent on an iPhone) could not be rendered in the session and are the operator's smoke on the preview.
