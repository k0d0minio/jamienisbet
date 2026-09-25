# Spec: The Inbox as a fast queue

- slug: inbox-rebuild
- personas: operator
- touches: websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/components/inbox-list.tsx, websites/admin-dashboard/components/inbox-detail.tsx, websites/admin-dashboard/components/inbox-row.tsx, websites/admin-dashboard/components/nurture-wakes.tsx, websites/admin-dashboard/components/lead-row.tsx, websites/admin-dashboard/components/swipe-row.tsx, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/lib/inbox.ts, websites/admin-dashboard/README.md
- complexity: standard

## Problem

Jamie rarely opens the Inbox (the old Needs you feed): it mixes follow-ups with Money, today's
tickets and "worth a look" counts, it is slow to act on — most rows only link away to a lead's
profile — and it is hard to scan in the app tier's tall grouped cards. Under the
`admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time finding work,
more time launching it) the Inbox stays its own screen but becomes a fast, keyboard-driven queue
(D-13) of the business attention Jamie still owes by hand (D-15), with Money and the counts gone
from it (D-17, D-18). This stub (7 of 11) builds the queue's frame and its Follow-ups group on the
desk tier and shell that `desk-tier` and `shell-rail-palette` landed; `gates-read` adds the Gates
and PRs group on top of it.

## Proposed change

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC — "Inbox" at the desk and
"Inbox on iPhone"; sample data) is the visual reference. Only its Follow-ups rows are in this
stub; its Gates and PRs rows are `gates-read`'s.

**1. What leaves.** The Money section, Today's tickets and the "worth a look" tallies (nothing
planned next, gone quiet) are removed from `/inbox`, with the Stripe and GitHub reads the page made
for them. The tallies stay reachable as the Leads filters they already are (`/leads?crack=unplanned`,
`/leads?crack=idle`) (D-18). Money's route and Stripe code stay dormant and untouched (D-17).

**2. The queue.** `/inbox` is rebuilt on the desk tier (Hanken Grotesk, mono for figures, flat,
hairlines, 32px rows at the desk, 44px under a thumb — D-3). A header reads "Inbox" and
"N waiting on you". Below it, groups — in this stub one: **Follow-ups** — each a header row with
a chevron, its label and its row count; activating the header folds or unfolds the group, and the
fold is remembered in this browser. The group holds three kinds of row, in this order:

- **Outreach due** — leads whose next step is dated today or earlier, in the crack-finder's
  order (overdue first, then fit tier), capped at 10.
- **Waiting on you** — open leads untouched for 7+ days and not already on the outreach queue,
  longest wait first, capped at 6 (the rule in `lib/inbox.ts`, unchanged).
- **Wakes** — nurture leads whose wake date has come, capped at 3.

The caps are today's (D-30). Where a kind has more than its cap, one quiet line at the end of the
group says how many more of that kind are waiting ("4 more open leads have gone quiet — see them
on Leads", linking `/leads?filter=open`; "3 more outreach steps are due"; "2 more wakes are due"),
and the next ones take the freed places when a row is cleared and the page re-reads.

A row reads: the **kind tag** in mono (`Outreach`, `Waiting on you`, `Wake`), the lead's **name**,
**who or where** (the status and segment line the rows show today), and the **age** in mono —
`today` or `Nd late` for outreach, `Nd` waited for a stale lead, `today` or `Nd` for a wake; an
overdue outreach step and every stale lead set their age in the destructive colour.

**3. The badge.** The rail's and the tab bar's Inbox badge counts exactly the rows the Inbox
shows: stale (≤6) + outreach (≤10) + wakes (≤3), from the one rule in `lib/inbox.ts` that the page
also reads (D-30 supersedes D-25's "uncapped").

**4. At the desk (from `lg`, 1024px): list and detail pane.** The list takes a fixed column; the
detail pane fills the rest (D-34). The first row is selected on load; clicking a row selects it.
The pane shows the tag and the channel, the name, the who-line and the age, the next step's text
(outreach), "Nothing is planned next." (stale) or when and why they were parked (wake), then a
facts list — last touch (channel · outcome · date) and, where there is one, the next step and its
date and the cadence rung — then the actions:

| Kind | Primary (↵) | Secondary | Also in the pane |
| --- | --- | --- | --- |
| Outreach due | Reach on the row's channel (WhatsApp, Email or Call) | Log a touch (`e`) | Tomorrow (`s`), the other channels they can be reached on, Mark touched, Open lead |
| Waiting on you | Reach on their best channel | Mark touched (`e`) | the other channels, Open lead |
| Wake | Wake (`e`) | Later · +90 days | Tomorrow (`s`), Open lead |

- **Reach** is a plain link: WhatsApp opens `wa.me` for their number, Email opens `mailto:`, Call
  opens `tel:` — empty, no AI draft (D-33). Drafting stays on the lead's profile. A lead with no
  reachable channel shows "Open lead" as the primary instead. The channel is the cadence's own
  `bestChannel` for the row, the same the feed uses today.
- **Log a touch** opens a small form in the pane with the channel pre-filled from the row, the
  outcome and an optional note, and saves through the existing `logTouchAction`. When it returns
  the cadence's suggested next step, the pane offers it: accepting it (or editing the step and
  date first) saves it through `saveNextAction`, which dates it past today and clears the row;
  dismissing leaves the step as it was and the row stays.
- **Mark touched** stamps the lead worked today (`markTouched`). On a stale lead that clears the
  row; on an outreach row it does not (the step is still due), and the row stays.
- **Tomorrow** on outreach keeps the next step's text and dates it tomorrow — a new server action
  in `app/(app)/actions.ts`, using the same day boundary the queue uses. On a wake it sets the
  wake date to tomorrow (a new action beside `pushWake`). Stale leads have no Tomorrow (D-31).
- **Wake** and **Later · +90 days** are the existing `wakeProspect` and `pushWake`. A woken lead
  gets a "Get back in touch" step due today, so after the re-read it reappears as an Outreach row
  — stated in the pane's help line.
- Nothing is sent from the Inbox: every outbound act opens WhatsApp, Mail or the phone, and a
  touch is logged by hand. The pane's foot says so in one line.

**5. Keyboard (at the desk).** `j` / `k` (and ↓ / ↑) move the selection through the visible rows,
skipping folded groups; `↵` runs the selected row's primary; `e` its done action (per the table);
`s` Tomorrow where the row has one. Keys are ignored while focus is in a text field, while the
command palette is open, and with a modifier held (so ⌘K still opens the palette). The list's
foot shows the key hints (`j k move · ↵ primary · e done · s tomorrow · ⌘K jump`).

**6. Clearing.** A row the operator clears (touched, logged with an accepted next step, tomorrow,
wake, later) leaves the list at once and the selection moves to the next row (or the previous one
at the end); the counts and the badge follow on the re-read. If the action fails, the row comes
back and a toast says what failed. When no rows are left the list shows "Nothing needs you" with
one line under it; the detail pane is then empty.

**7. On the phone (below `lg`).** The same header and group, rows at least 44px with the tag, the
name, the who-line and the age. Tapping a row opens it in place (one open at a time): the pane's
text line, then its **primary and secondary** as two full-width 44px buttons, then a line of text
buttons for the rest (Tomorrow, Mark touched, the other channels, Open lead). Outreach and stale
rows keep today's swipe gestures (D-32): swipe right marks the lead touched, swipe left reveals the
reach tray. Wake rows carry no swipe. Everything works one-handed at a 390px width.

**8. States.** A loading skeleton in the new shape replaces the current one. A failed Neon read
shows an error line in place of the group, never "Nothing needs you".

## Acceptance criteria

- [ ] `/inbox` shows one group, "Follow-ups", with its row count in the header; activating the header folds and unfolds it, and the fold survives a reload in the same browser.
- [ ] No Money row, no Today's tickets and no "worth a look" tally appears on `/inbox`, and the page makes no Stripe or GitHub request; `/leads?crack=unplanned` and `/leads?crack=idle` still filter Leads.
- [ ] The group lists outreach due (≤10, overdue first then fit tier), then open leads untouched 7+ days that are not on today's outreach queue (≤6, longest first), then nurture wakes whose date has come (≤3); each kind past its cap ends with a line naming how many more are waiting.
- [ ] Each row shows its kind tag in mono, the lead's name, the who-line and the age; overdue outreach and stale ages render in the destructive colour.
- [ ] The rail and tab-bar Inbox badge equals the number of rows `/inbox` shows after the same read (capped counts summed), and is hidden at 0.
- [ ] At 1024px and wider, the list and a detail pane sit side by side; the first row is selected on load; the pane shows the row's facts and the actions in the kind table for that row.
- [ ] Every follow-up can be cleared from `/inbox` without opening the lead: a stale lead by Mark touched; an outreach row by Tomorrow or by logging a touch and accepting (or editing) the suggested next step; a wake by Wake, Tomorrow or Later · +90 days.
- [ ] Tomorrow on an outreach row keeps the step's text and dates it tomorrow; Tomorrow on a wake sets the wake date to tomorrow; neither is offered on a stale lead.
- [ ] Reach actions are plain `wa.me`, `mailto:` or `tel:` links for the lead's own details; no AI draft is generated and no message is sent from `/inbox`; a touch is only ever logged by the operator's own submit.
- [ ] A cleared row leaves the list immediately and the selection moves to the neighbouring row; a failed action restores the row and shows a toast.
- [ ] With no rows, the list reads "Nothing needs you"; with a failed database read it shows an error line instead.
- [ ] At the desk, `j`/`k` and ↓/↑ move the selection, `↵` runs the primary, `e` the done action and `s` Tomorrow; none of them fire while typing in a field, while the palette is open, or with ⌘/Ctrl held.
- [ ] Below 1024px, tapping a row opens it in place with its primary and secondary as two 44px buttons and the remaining actions as text buttons; outreach and stale rows swipe right to mark touched and left to reveal the reach tray; at 390px wide every action is reachable with one thumb and no horizontal scroll.
- [ ] The Inbox renders in the desk tier in light and dark (system appearance), with a loading skeleton in the new layout.
- [ ] `websites/admin-dashboard/README.md` describes the Inbox as the Follow-ups queue, its keys and the badge rule.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Out of scope

- The Gates and PRs group and any GitHub read for the Inbox (`gates-read`).
- Any change to when outreach is due, when a lead is stale, the crack-finder's ordering, or the caps' values.
- AI drafting from the Inbox (D-33) — the profile's draft panel is unchanged.
- Removing Money's route or Stripe code (D-17); retiring app-tier pieces other screens still use (`retire-app-tier`).
- A keyboard help sheet (`?`) for the Inbox, and arrow-key or `e`/`s` handling on the phone.
- Push or email notifications.

## Open questions

- none
