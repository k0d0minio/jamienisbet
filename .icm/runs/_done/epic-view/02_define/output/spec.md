# Spec: The epic view, with its breakdown

- slug: epic-view
- personas: operator
- touches: websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components
- complexity: standard

## Problem

On the Tickets board (`/tickets` in the admin dashboard) a batch's pane is still the placeholder
the `master-detail-shell` run (#158) left: a `Meter` and the retired sheet's three launchers. The
one document that explains an epic — its `breakdown.md`, with what was understood, the decisions
and the build order — is skipped outright by `lib/tickets.ts`, so the board shows *how far* an
epic has got but never *what it is for* or *what order it runs in*. On a phone the batch is two
screens of the same stubs: list level 1, then a summary row that pushes a view listing actions
over it. This is stub 4 of the `tickets-master-detail` epic (breakdown decisions 3 and 8): it
reads the breakdown and turns the placeholder into the epic's real detail view, serving the
operator's goal of an estate glance that answers "what is this batch and what's next" in one
place.

## Proposed change

**The read (`lib/tickets.ts`).** The per-repo tree walk stops skipping
`.icm/intake/<epic>/breakdown.md`: it records its blob SHA beside the stubs and reads it through
the existing `fetchBlob` — by SHA, on the month clock (`BLOB_REVALIDATE_SECONDS`),
`force-cache`, carrying the board tag, under the concurrency cap — in the same `Promise.all` as
the stub reads. No extra tree call, no path read. The raw markdown is attached to the epic's
`Batch` as `breakdown: string | null` and flows through `readBoard()` to the client unrendered,
like ticket bodies. It is `null` when the file is absent or its blob read fails (the same
treatment a failed stub read gets today), and always `null` for Triage, Backlog and In flight.
An epic folder whose breakdown exists but which has no open stubs still does not render (no
batch is built from a breakdown alone). The file's header comment is updated so the CONTENT
clock names breakdowns alongside ticket bodies; every cache invariant it states is unchanged.

**The view** (desktop: the pane, when `?b=` selects a batch; phone: list level 1 itself). One
component renders every batch kind, top to bottom:

1. **Title** — `batch.title`, unchanged (humanized slug, "Triage", "Backlog", "In flight").
2. **Summary line** — repo slug (mono) · `N of M` done (epics with a plan) · open count
   ("N open", or "N in flight" for runs) — what the pane subtitle carries today.
3. **`Meter`** — epics with a plan only.
4. **Action row** —
   - **Copy next**: the `CopySplitButton` a ticket uses, fed the batch's next ticket
     (`batch.next`): its pick-up and every launch target behind the chevron, labelled
     "Copy next", with the next stub's title shown as the row's description. Absent when the
     batch has no next ticket with a pick-up.
   - **Recut this batch**: epics only, `recutLaunches` as today (the tinted `CopyLaunchRow` and
     its footer line).
   - **Open on GitHub**: the batch folder (`batch.htmlUrl`; "the runs" for In flight).
5. **Stub list** — the batch's tickets as level-1 rows (the same `BoardTicketRow`: sequence,
   status dot, title, priority, swipes, active highlight); tapping one selects that ticket
   (`?t=`), exactly as the list column does.
6. **Breakdown** (epics) — the breakdown rendered with the board's `Markdown` component (the
   dynamically imported one ticket bodies use, so it is rendered only when the view is open),
   whole except its leading `# ` title line (the view's title stands in for it); its dash-line
   header and `## Build order` stay in. An epic whose breakdown is `null` shows one quiet
   footnote instead: "No breakdown.md in this epic." Triage, Backlog and In flight show nothing
   here.

**Desktop (`lg`+)** keeps level 1 in the list column and puts the view in the pane in the order
above (the stub list appears in both — as the stub says).

**Phone (below `lg`)** — the view *is* list level 1: under the "‹ <repo>" back row come the
title, summary line and `Meter`, then the **stub list**, then the action row and the breakdown
below it. The shell's interim summary row and the `pane=1` flag are retired: `?b=` alone opens
level 1 on every viewport, a batch is never a pushed view, and a cold link still carrying
`pane=1` opens level 1 and drops the flag with `replaceState`. The same layout serves Triage,
Backlog and In flight (without Recut and breakdown). Back from a ticket opened here returns to
this level 1 with its scroll kept, as today.

Invariants that must survive untouched: the cache header's rules (`force-cache`, no
`dynamic = "force-dynamic"`, the three clocks, the concurrency cap), launcher URL shapes and
prompts, the `?t=` / `?b=` / `?r=` / `?repo=` keys and their fallbacks, stub 1's refresh,
on-return re-read and "as of" stamp, and the read-only contract.

## Acceptance criteria

- [ ] For every epic with an open stub and a `breakdown.md` on the default branch, the epic view
      shows that breakdown rendered as markdown, without its `# ` title line and with its
      `## Build order` present.
- [ ] The breakdown is read by blob SHA through `fetchBlob` from the tree the board already
      fetches: a cold board read makes no more tree calls than before, and one extra blob read
      per epic breakdown; a warm board with unchanged breakdowns makes no breakdown request.
- [ ] An epic with no `breakdown.md` (or whose breakdown blob read fails) renders its view with
      the footnote "No breakdown.md in this epic." and the board shows no read error for it;
      Triage, Backlog and In flight views show no breakdown and no footnote.
- [ ] At `lg`+ selecting a batch fills the pane with, in order: title, summary line
      (repo · `N of M` done where planned · open or in-flight count), `Meter` (planned epics),
      the action row, the stub list, then the breakdown (epics).
- [ ] Copy next is the same split button a ticket carries: it copies exactly the next ticket's
      pick-up, its chevron lists the same launch targets as that ticket's own button, and its
      row names the next stub's title; it is absent when there is no next pick-up.
- [ ] Recut this batch appears on epics only and copies/opens what it does today; Open on GitHub
      opens the batch folder (the runs folder for In flight).
- [ ] Tapping a stub in the view's list selects that ticket (`?t=`) and shows the ticket view,
      with the same row look, active highlight and swipes as list level 1.
- [ ] Below `lg`, `?b=<repo>/<batch>` shows level 1 as: back row, title, summary line, `Meter`,
      the stub list, then the action row and (epics) the breakdown; no summary row and no pushed
      batch view exist any more.
- [ ] A cold load of `/tickets?b=<repo>/<batch>&pane=1` opens that level 1 and the URL loses
      `pane=1`; no code path writes `pane=1`.
- [ ] Back from a ticket opened from phone level 1 returns to that level 1 with its scroll
      position kept; browser back/forward still step through selections.
- [ ] `lib/tickets.ts` still carries no `dynamic = "force-dynamic"` on any board route, every new
      fetch goes through `gh()`/`fetchBlob` (force-cache, board tag, concurrency cap), and its
      header comment names breakdowns under the CONTENT clock.
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, on an epic
      with a breakdown, one without, and a Triage batch.
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Out of scope

- The redesigned ticket view (stub 3, `ticket-view`) — the ticket pane stays today's
  `TicketDetail`.
- The repo view and the estate overview (stub 5, `repo-and-estate-views`).
- Keyboard navigation (stub 6, `keyboard-nav`).
- Deriving the epic's title from the breakdown's H1 — titles stay the humanized slug everywhere.
- Linking stub slugs inside the rendered breakdown to their tickets.
- Showing breakdowns of `_done/` epics, or an epic whose stubs are all done — `_done/` is never
  fetched and an empty batch never renders.
- Any change to launcher URL shapes or prompts, the URL keys, or the refresh behaviour.

## Open questions

- none — the phone layout (epic view *is* level 1; the shell's summary row and `pane=1` retire),
  the Triage / Backlog / In flight views sharing the same layout minus Recut and breakdown, the
  stripped `# ` title line, the missing-breakdown footnote and a failed blob read reading as
  `null` are Define's technical calls from the stub and breakdown; no `scope.md` exists for this
  epic (it was cut from the breakdown's interrogation directly).

Context budget: Define read `use-board-params.ts`'s header, `board-views.tsx`, the level-1
`BatchList` and pane wiring in `tickets-board.tsx`, the `Batch` type, tree walk and batch
assembly in `lib/tickets.ts`, and the shell's shipped spec, to reconcile the stub's phone layout
with the shell's interim summary row.
