# Tasks: retire-app-tier

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] `packages/ui/app.css`, `packages/ui/tokens/app.css` and `packages/ui/src/components/app/` no longer exist; `packages/ui/src/index.ts` exports no app-tier component; `packages/ui/package.json` has no `./app.css` export, no `app.css` in `files` and no `check:css:app` step.
- [x] A search of `websites/`, `packages/` and `.claude/` finds no import of an app-tier component, of `@jamie-nisbet/ui/app.css` or of `tokens/app.css`; no `app-tier` class; no `var(--app-…)`; no `app-*` utility (`bg-app-`, `text-app-`, `font-app`, `shadow-app-`, `rounded-app-`, `min-h-app-`); and no `material-thin|regular|thick` or `spring-sheet|header|press|pop` name. `components/app-screen.tsx` and `components/app-menu.tsx` no longer exist.
- [x] `DeskField`, `DeskInput`, `DeskTextarea` and `DeskSelect` (with its parts) are exported from `@jamie-nisbet/ui`. Each control is 32px tall at the desk and at least 44px on touch, and sets 16px text on touch. Focus draws inside the control. A field shows its label, hint and error, and sets `aria-describedby` / `aria-invalid` as `AppField` did.
- [x] Every form and edit sheet in the admin uses the desk controls and still works as it does today: login, the lead's contact, facts and deal sheets, next step, touch log, reply paste, draft (with its segmented switch), enrich, opt-out, repo link, send form, share form link, new lead, the board keys sheet, and Money's invoice and payment-link forms and invoice actions.
- [x] Login, not-found, `(app)/error.tsx`, `(app)/leads/[id]/error.tsx` and every `loading.tsx` render on the desk tier, with a flat header, desk rows or skeletons and Hanken Grotesk text. None of them shows a large or collapsing title.
- [x] `<body>` carries `desk-tier` and not `app-tier`. `app/globals.css` imports `styles.css` and `desk.css` only. UI text on every admin screen, login and not-found included, sets in Hanken Grotesk, with figures, dates and slugs in IBM Plex Mono.
- [x] `/money`, opened by its URL, renders on the desk tier with the same figures, invoices, payment links and actions as before. It is still absent from the rail, the tab bar, the palette and the Inbox. No Stripe or Money server code changed.
- [x] Sheets and dialogs open and close without a slide or spring at every width. On the phone, a sheet with detents follows a drag, settles on a detent with no spring, dismisses on a release far enough below its smallest detent, and takes its tallest detent when the keyboard opens. `sheet.tsx` reads no app-tier token.
- [x] Pull-to-refresh still refreshes the page on the phone, with its indicator on desk tokens and no spring. Toasts render flat on desk tokens and clear the tab bar on the phone.
- [x] The PWA manifest's `theme_color` / `background_color` and the viewport theme colours equal the desk canvas in light and in dark.
- [x] `notes.md` records the sweep audit as one line per screen × width (1280px, 390px) × theme (light, dark), for Work, Inbox, Leads, lead profile, Money, login, not-found, an error screen and a loading screen. Every line reads `pass` after Build's fixes: no hard-coded colour outside the PWA colour declarations, no hover-only affordance, and no touch target under 44×44px.
- [x] `packages/ui/BRAND.md` and `.claude/skills/design-dna/SKILL.md` describe two tiers, marketing and desk. Neither has an app-tier section, checklist line or "retiring" note. BRAND.md § Desk tier lists the desk form controls.
- [x] `packages/ui/README.md`, `packages/ui/SKILL.md` and `websites/admin-dashboard/README.md` no longer mention `app.css`, the app-tier components or the app tier.
- [x] No file under `websites/portfolio/` or `websites/sellers-site/` changes.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Queue

- [x] Desk form controls and a sheet without the spring — packages/ui (bcf3283)
- [x] Every admin screen and form on the desk tier — websites/admin-dashboard (4c23d40)
- [x] Delete the app tier — packages/ui (b23c6a4)
- [x] Docs: two tiers — BRAND.md, design-dna, READMEs (6e54d38)
- [x] Sweep audit + fixes (dialog close target, action-row labels, Money masthead, fields on the row step) — notes.md
