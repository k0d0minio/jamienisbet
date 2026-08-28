# JN-035 · Mobile feel pass — the app answers your thumb

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | M |

## Problem

The ergonomics are already deliberate (swipe rows, sheets, safe areas, 44px floors) but
the *feedback loop* isn't: server actions give no acknowledgement until the page
re-renders, live reads block on a blank screen, sheet forms fight the keyboard, and
navigation between list and profile hard-cuts. On a phone that gap is the whole feel of
the app.

## Build

In `websites/admin-dashboard`, applying JN-030's primitives (depends on that ticket):

- **Optimistic updates** on the high-frequency actions — mark touched, status change,
  todo tick, work started — via `useOptimistic`/`useTransition`: the row updates the
  instant the thumb lifts, reconciles on the server response, toast on failure with the
  state rolled back.
- **Skeletons on live reads** — Tickets and Money (GitHub/Stripe round-trips) render
  layout-true skeletons via `loading.tsx` instead of a blank wait; pull-to-refresh
  shows the spinner in its pull indicator.
- **Toasts for irreversible/off-screen outcomes** — archive/restore, delete, invoice
  raised, link copied. Quiet, above the tab bar, per JN-030.
- **Keyboard-aware sheets** — focused inputs scroll into view above the keyboard
  (visualViewport / `interactive-widget` handling), correct `inputMode`/
  `autocomplete`/`enterKeyHint` on every field (tel, email, decimal for value), submit
  reachable without dismissing the keyboard.
- **View transitions** — list → lead profile and back animate with the View
  Transitions API where supported (Next has first-class support); fall back to the
  hard cut. Fades + small translations only, honouring `prefers-reduced-motion`.
- **Haptics, sparingly** — a single light `navigator.vibrate` tick on swipe-commit
  actions (mark touched, archive) where the platform supports it; never on mere taps.

## Acceptance

- [ ] Mark touched / status / todo tick reflect instantly and reconcile; failures roll back with a toast
- [ ] Tickets and Money show skeletons, never a blank screen, on cold navigation
- [ ] Sheet forms usable with the keyboard up on iOS Safari standalone
- [ ] Transitions and haptics respect reduced-motion / unsupported platforms silently
- [ ] CI green

## Prompt

Do a mobile feel pass on the admin dashboard. Read
.icm/intake/JN-035-mobile-feel-pass.md for full context. Requires JN-030's primitives
(skeleton, spinner, toast, pending-button) in @jamie-nisbet/ui — check they exist
first. Implement optimistic updates on high-frequency lead/todo actions, loading.tsx
skeletons for Tickets and Money, toasts for off-screen outcomes, keyboard-aware bottom
sheets with correct input modes, View Transitions between list and lead profile, and a
single haptic tick on swipe-commits. Open a PR on a claude/ branch; do not run local
checks — CI is the source of truth.
