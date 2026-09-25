# Breakdown: Admin cockpit redesign

- scope-slug: admin-cockpit-redesign · story: runs/admin-cockpit-redesign/01_scope/\_source/story.md
- initiative: operator cockpit / objective: less time finding work, more time launching it
- personas: operator

## What I understood

The admin was built phone-first in the iOS idiom and scaled up to the desk, and at the desk it
wastes width and hides the work. Jamie uses it for real work on both a laptop and an iPhone, and
wants a dense, flat work tool designed at the desk and compressed for the phone — same brand,
new tier. Work (the estate's tickets) becomes home: what to launch next, where each client is at,
and a reader that shows the stub, the prompt and the epic together, with Launch as the primary
act. The Inbox is rebuilt as a fast queue of gates, pull requests and lead follow-ups. Leads get a
real table, a board by deal stage and a two-column profile. Todos and compliance dates leave the
product with their tables; Money is hidden but kept.

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC) is the visual reference:
the design-system sheet, Work option A with the round-2 reader, Work on the iPhone, the Inbox,
Leads and the profile.

## Where it sits

The operator's cockpit, `websites/admin-dashboard`, and the design system in `packages/ui`. It
touches the ticket board (`lib/tickets.ts`), the lead record (`biz.clients`, `biz.touches`), the
todo and compliance tables (removed), and a new read of pull requests from GitHub. The marketing
sites are untouched.

## Build order

1. drop-todos-compliance — Drop todos and compliance dates — depends-on: none
2. desk-tier — The desk tier: tokens and primitives — depends-on: none
3. shell-rail-palette — Icon rail, command palette, and Work at home — depends-on: desk-tier
4. work-panes — Work at the desk: views, repos and the ticket list — depends-on: shell-rail-palette
5. work-reader — The ticket reader and one-click launch — depends-on: work-panes
6. work-phone — Work on the iPhone — depends-on: work-reader
7. inbox-rebuild — The Inbox as a fast queue — depends-on: shell-rail-palette, drop-todos-compliance
8. gates-read — Gates and PRs in the Inbox — depends-on: inbox-rebuild
9. leads-table-board — Leads as a table and a deal-stage board — depends-on: shell-rail-palette
10. lead-profile-columns — The lead profile in two columns — depends-on: shell-rail-palette, drop-todos-compliance
11. retire-app-tier — Retire the app tier and finish the sweep — depends-on: work-phone, gates-read, leads-table-board, lead-profile-columns

`drop-todos-compliance` leads because it changes the schema and the migrations journal, the
files every later merge would otherwise conflict on; it is independent of the design work.
`desk-tier` and then `shell-rail-palette` are the foundation: the shell owns the layouts and the
route move every screen stub merges over. After the shell the four screen tracks follow, Work
first because it is home.

This scope cuts into 11 stubs — past the splitting signal. It is kept as one batch because Jamie
asked for one redesign and every stub rests on the same tier and shell; the natural split, if
wanted, is at the shell: foundation (1–3), Work (4–6), Inbox (7–8), Leads (9–10), sweep (11).

## Parallelizable

From the `touches:` guesses, once `shell-rail-palette` is merged:

- the Work track (`work-panes` → `work-reader` → `work-phone`), the Inbox track
  (`inbox-rebuild` → `gates-read`), `leads-table-board` and `lead-profile-columns` touch
  disjoint files and can run side by side.
- `drop-todos-compliance` and `desk-tier` do not overlap and can run side by side.
- `retire-app-tier` waits for every screen stub.

## Out of scope (whole scope)

- Money: no redesign and no removal of the Stripe code — it is only hidden.
- Editing tickets from the dashboard: no status changes, reordering or new stubs.
- Dragging cards between deal stages.
- Any Google Tasks integration.
- Launching several tickets at once, or new launch targets.
- Push or email notifications.
- The portfolio and the sellers site.
