# Spec: Retire the app tier and finish the sweep

- slug: retire-app-tier
- personas: operator
- touches: packages/ui/app.css, packages/ui/tokens/app.css, packages/ui/src/components/app, packages/ui/src/components/desk, packages/ui/src/components/ui/sheet.tsx, packages/ui/src/index.ts, packages/ui/src/lib/utils.ts, packages/ui/package.json, packages/ui/desk.css, packages/ui/tokens/desk.css, packages/ui/BRAND.md, packages/ui/README.md, packages/ui/SKILL.md, .claude/skills/design-dna/SKILL.md, websites/admin-dashboard/app, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: complex

## Problem

The redesign moved the admin to a desk tool that works on the phone too (D-1), flat and
monochrome (D-3), set in Hanken Grotesk (D-4). Work, the Inbox, Leads and the lead profile are
now on the desk tier, but the app tier is still loaded under all of them. `<body>` still carries
`app-tier`, and `globals.css` still imports `app.css`. Around 28 admin files still import
app-tier components. Every edit sheet's form fields are among them (`AppField`, `AppInput`,
`AppSelect`, `AppTextarea`), along with login, not-found, the error and loading screens, the
phone's menu (`components/app-menu.tsx`), the old masthead (`components/app-screen.tsx`) and
dormant Money. 31 files use `app-*` utilities. `Sheet` still animates on the app tier's spring.
Until the tier is gone, the admin is two design languages with two type stacks. Every change
has to ask which tier it is on, and `packages/ui` carries about 670 lines of CSS and 12
components that no new work may use. This run finishes the operator cockpit's move: one tier,
with less to think about on every screen after it.

## Proposed change

**One admin, one tier.** Every screen and piece of chrome still on the app tier moves to the
desk tier. The app tier is then deleted from `packages/ui` and from the docs, which leaves two
tiers: marketing and desk. The move is mechanical. No screen gains or loses behaviour, and the
only visible change is the look. The marketing tier is untouched (D-22).

**New desk form controls.** The desk tier gets its own form controls in
`packages/ui/src/components/desk/`: `DeskField` (label, hint, error, and the ARIA wiring
between them), `DeskInput`, `DeskTextarea`, and `DeskSelect` with its parts. They are
prop-compatible with the `App*` set they replace, so each call site is a rename. They follow
the desk tier's rules. They are flat, with a hairline border and no fill beyond the desk field
token. A control is 32px tall at the desk and at least 44px on touch (`pointer: coarse`). Text
is 14px at the desk and 16px on touch, so iOS does not zoom a focused field. Focus draws inside
the control. The error state is a muted destructive hairline plus the message, never a tinted
field. Every admin form uses them: login, the lead's contact, facts and deal sheets, next step,
the touch log, reply paste, draft, enrich, opt-out, repo link, send and share form, new lead,
and Money's invoice and payment-link forms. BRAND.md § Desk tier lists them among the
primitives.

**Every other app-tier piece has a desk replacement.**

- `GroupedList` / `GroupedSection` / `GroupedRow` / `GroupedBlock` / `GroupedDisclosure` →
  `RecordSection` / `RecordRow` / `RecordBlock` / `RecordDisclosure`, which are
  prop-compatible.
- `SegmentedControl` / `SegmentedItem` → `DeskSegmentedControl`.
- `GlanceRow` / `GlanceFigure` (Money only) → a plain row of mono figures on desk tokens.
- `LargeTitleHeader`, and the `components/app-screen.tsx` masthead built on it → a flat desk
  page header (56px, title and mono meta, trailing actions, like `PaneHeader`). No collapsing
  large title.
- `components/app-menu.tsx` (the phone's menu, used by Work on the phone, the Inbox list and
  the lead profile) → `DeskMenu`, or a sheet of `RecordRow`s where it lists destinations. Both
  admin files named `app-*` are gone when the run ends.
- Every `app-*` utility (`bg-app-*`, `text-app-*`, `font-app`, `shadow-app-*`,
  `rounded-app-*`, `min-h-app-touch` and the rest) and every `material-*` / `spring-*` name →
  the desk token or utility for the same job. `min-h-app-touch` becomes the desk tier's 44px
  touch floor.

**The screens outside the main four.** Login, not-found, both `error.tsx` screens and every
`loading.tsx` render on the desk tier. They use a flat page header and desk rows and skeletons,
set in Hanken Grotesk, with no large title, material or collapsing header. `/money` is ported
the same way (D-17: the route and the Stripe code stay, dormant). It is still reached only by
its URL, with the same figures, lists and actions. Nothing in `lib/stripe.ts`, `lib/money.ts`
or the Money server actions changes.

**The shell.**

- `<body>` carries `desk-tier` in place of `app-tier`, and admin UI text sets in Hanken
  Grotesk everywhere.
- `globals.css` imports `styles.css` and `desk.css` only, and its header comment says so. Its
  own plumbing (tab-bar geometry, touch minimums, the markdown layer) reads desk tokens.
- Pull-to-refresh keeps working on the phone. It still listens to the window scroll. Its
  indicator uses desk tokens, with no spring.
- Toasts render flat on desk tokens and stay clear of the tab bar on the phone.
- The PWA's `theme_color`, `background_color` and the viewport theme colours equal the desk
  canvas in each theme.

**Sheets.** `Sheet` (`packages/ui/src/components/ui/sheet.tsx`) stops reading any app-tier
token. Its timing values move to the desk tier's tokens, or into the component. Sheets and
dialogs open and close without a slide or spring, as `design-dna` → Motion says: desk-tier
motion is instant or a ≤120ms colour change. On the phone, sheets keep their detents. A drag
follows the finger, a release or a tap on the handle settles on a detent at once with no
spring, a release far enough below the smallest detent dismisses, and with the keyboard up the
sheet takes its tallest detent, as it does today. With `prefers-reduced-motion`, nothing moves.

**Deleting the tier.** Deleted:

- `packages/ui/app.css`, `packages/ui/tokens/app.css` and `packages/ui/src/components/app/`
  (all 12 files).
- The app-tier block of `src/index.ts`.
- The `./app.css` export, the `app.css` `files` entry and the `check:css:app` step of
  `packages/ui/package.json`.
- The `text-app-*` group in `src/lib/utils.ts`'s class-merge config.
- Any `desk.css` or `tokens/desk.css` comment that describes living beside `app.css`.

**The docs say two tiers.**

- `packages/ui/BRAND.md` describes marketing and desk. § App tier (retiring) is removed, and
  the desk tier's "until `retire-app-tier` runs" wording is gone.
- `.claude/skills/design-dna/SKILL.md` describes the same two tiers. The App tier paragraph
  and every app-tier checklist, motion, colour and type line are removed, and "Which tier am I
  on?" has two answers.
- `packages/ui/README.md`, `packages/ui/SKILL.md` and `websites/admin-dashboard/README.md` no
  longer document `app.css`, the app components or the app tier's rules. The admin README's
  appearance and touch-target notes point at the desk tier.

**The sweep audit.** When the port is done, Build audits every admin screen: Work, the Inbox,
Leads (table, board, phone rows), the lead profile, Money, login, not-found, an error screen
and a loading screen. Each is checked in both themes, at 1280px and at 390px, for three things:

1. Raw values. No hard-coded colour in admin TSX or CSS, outside the PWA colour declarations
   in `manifest.ts` and `app/layout.tsx`'s viewport.
2. Hover-only affordances. Nothing is reachable only by hover.
3. Targets under 44×44px on touch.

Build fixes what it finds and records the result in `notes.md`: one line per screen × width ×
theme, `pass` or what was fixed.

## Acceptance criteria

- [ ] `packages/ui/app.css`, `packages/ui/tokens/app.css` and `packages/ui/src/components/app/` no longer exist; `packages/ui/src/index.ts` exports no app-tier component; `packages/ui/package.json` has no `./app.css` export, no `app.css` in `files` and no `check:css:app` step.
- [ ] A search of `websites/`, `packages/` and `.claude/` finds no import of an app-tier component, of `@jamie-nisbet/ui/app.css` or of `tokens/app.css`; no `app-tier` class; no `var(--app-…)`; no `app-*` utility (`bg-app-`, `text-app-`, `font-app`, `shadow-app-`, `rounded-app-`, `min-h-app-`); and no `material-thin|regular|thick` or `spring-sheet|header|press|pop` name. `components/app-screen.tsx` and `components/app-menu.tsx` no longer exist.
- [ ] `DeskField`, `DeskInput`, `DeskTextarea` and `DeskSelect` (with its parts) are exported from `@jamie-nisbet/ui`. Each control is 32px tall at the desk and at least 44px on touch, and sets 16px text on touch. Focus draws inside the control. A field shows its label, hint and error, and sets `aria-describedby` / `aria-invalid` as `AppField` did.
- [ ] Every form and edit sheet in the admin uses the desk controls and still works as it does today: login, the lead's contact, facts and deal sheets, next step, touch log, reply paste, draft (with its segmented switch), enrich, opt-out, repo link, send form, share form link, new lead, the board keys sheet, and Money's invoice and payment-link forms and invoice actions.
- [ ] Login, not-found, `(app)/error.tsx`, `(app)/leads/[id]/error.tsx` and every `loading.tsx` render on the desk tier, with a flat header, desk rows or skeletons and Hanken Grotesk text. None of them shows a large or collapsing title.
- [ ] `<body>` carries `desk-tier` and not `app-tier`. `app/globals.css` imports `styles.css` and `desk.css` only. UI text on every admin screen, login and not-found included, sets in Hanken Grotesk, with figures, dates and slugs in IBM Plex Mono.
- [ ] `/money`, opened by its URL, renders on the desk tier with the same figures, invoices, payment links and actions as before. It is still absent from the rail, the tab bar, the palette and the Inbox. No Stripe or Money server code changed.
- [ ] Sheets and dialogs open and close without a slide or spring at every width. On the phone, a sheet with detents follows a drag, settles on a detent with no spring, dismisses on a release far enough below its smallest detent, and takes its tallest detent when the keyboard opens. `sheet.tsx` reads no app-tier token.
- [ ] Pull-to-refresh still refreshes the page on the phone, with its indicator on desk tokens and no spring. Toasts render flat on desk tokens and clear the tab bar on the phone.
- [ ] The PWA manifest's `theme_color` / `background_color` and the viewport theme colours equal the desk canvas in light and in dark.
- [ ] `notes.md` records the sweep audit as one line per screen × width (1280px, 390px) × theme (light, dark), for Work, Inbox, Leads, lead profile, Money, login, not-found, an error screen and a loading screen. Every line reads `pass` after Build's fixes: no hard-coded colour outside the PWA colour declarations, no hover-only affordance, and no touch target under 44×44px.
- [ ] `packages/ui/BRAND.md` and `.claude/skills/design-dna/SKILL.md` describe two tiers, marketing and desk. Neither has an app-tier section, checklist line or "retiring" note. BRAND.md § Desk tier lists the desk form controls.
- [ ] `packages/ui/README.md`, `packages/ui/SKILL.md` and `websites/admin-dashboard/README.md` no longer mention `app.css`, the app-tier components or the app tier.
- [ ] No file under `websites/portfolio/` or `websites/sellers-site/` changes.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Out of scope

- Reviving Money, redesigning it, or putting it back in the navigation (D-17). It is ported
  mechanically and stays dormant.
- Any behaviour change on any screen. New fields, new actions, re-ordered forms and changed
  copy all go to triage if the audit surfaces them, except a fix the audit itself requires
  (a hover-only action made visible, a target raised to 44px).
- Changing the marketing tier, `styles.css`, the brand tokens, the portfolio or the sellers
  site (D-22).
- Removing sheet detents, or reworking sheets beyond dropping the spring and the slide.
- An in-app theme toggle. Appearance still follows the system.

## Open questions

- none. Decided with the operator at Define (2026-09-25): Money is ported mechanically, so the
  app tier is deleted whole (answers scope.md's open point); forms move to new desk form
  controls rather than restyled shadcn ones; sheets keep their detents but lose the spring and
  the slide; the sweep ships as one run.
