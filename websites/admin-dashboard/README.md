# admin-dashboard (`@jamie-nisbet/admin`) — "Consultancy JN"

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** Somewhere to track leads and customers, and to get paid. Nothing else.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** intakes,
the admin is where each becomes a lead that gets worked.

It is **a desk tool first, compressed for the phone, and installable** — branded
**Consultancy JN**, it ships a web app manifest, icons, and a service worker so it can be added
to a phone home screen and launched fullscreen like a native app (see
[Mobile & PWA](#mobile--pwa)). It is mid-way through the `admin-cockpit-redesign`: the shell is
on the desk tier (`packages/ui/BRAND.md` § Desk tier); the screens inside it move over one by one.

**Four screens and a dormant fifth.** That is the whole app, and it is deliberate — see
[Deliberately not here](#deliberately-not-here).

| Screen | Route | What it is |
|---|---|---|
| **Work** | `/` | Every repo's `.icm/intake/` backlog in one read-only board. Home. |
| **Inbox** | `/inbox` | The follow-ups queue: outreach due, leads gone quiet, wakes — cleared from the list or the keyboard. |
| **Leads** | `/leads` | Every lead and customer: a sortable table or a read-only board by deal stage at the desk, swipeable rows on the phone; longest-waiting first by default; the cold pool is a view of it (`?view=prospects`). |
| **Lead** | `/leads/<id>` | One person's profile: contact, value, notes, forms, repo, Stripe link. |
| **Money** | `/money` | Stripe: balance, invoices, payment links, recent payments. **Reachable by URL only** — it left the navigation and the palette (D-17), and its code stays in place, dormant. |

The rail and the tab bar carry Work, Inbox and Leads, in that order. The board was
`/tickets` until Work became home; `/tickets` and any `/tickets?…` link redirect to `/` with the
query intact (`next.config.ts`). Before the feed, the leads list was home, so a `/?filter=…` or
`/?archived=1` bookmark still redirects to the same view on `/leads`.

## The shell — rail, tab bar, command palette

One shell, two readings of it, both built from the desk tier's primitives
([`components/nav.tsx`](components/nav.tsx), [`app/(app)/layout.tsx`](app/(app)/layout.tsx)):

- **From `md` (768px), a 56px icon rail** on the leading edge: the JN mark, then Work, Inbox and
  Leads (`RailItem`, the current one `aria-current="page"`), and at its foot the palette's
  search button and sign out. An iPad in portrait is a desk and gets it. The content takes the
  rest of the window: Work fills it, and every other screen keeps its reading column
  (`AppScreen`'s `wide` is Work's alone).
- **Below `md`, a flat tab bar** welded to the bottom edge on a hairline — no floating glass —
  with the same three, each a third of the bar and 56px tall, extending under the home
  indicator. The title bar carries the palette's search button beside the JN menu (sign out).
- **The Inbox badge** is the number of rows the Inbox shows (D-30): the outreach owed by today
  (at most 10), open leads gone quiet past the staleness threshold (at most 6) and the nurture
  wakes whose date has come (at most 3) — a lead both stale and due counted once
  (`countFollowUps` in [`lib/inbox.ts`](lib/inbox.ts), the same rule and caps the queue reads).
  Neon only. It streams into the chrome as a
  promise, so no screen waits on it, and it is hidden at 0 and when the read fails.
- **The command palette** ([`components/command-palette.tsx`](components/command-palette.tsx)) —
  ⌘K on a Mac, Ctrl+K elsewhere, from any screen (a text field included), or the search button.
  Four groups: **Repos** (→ `/?r=`), **Tickets** (→ `/?t=`, with the ticket's status dot),
  **Leads** (non-archived, matched on name and company → `/leads/<id>`) and **Actions** —
  "Launch next for <repo>" per epic with a next stub (its default launch link, the one Copy
  next builds), "Estate check", and "Go to" Work, Inbox and Leads. With nothing typed it offers
  the actions; typing filters every group on label and metadata, word-start matches first, eight
  rows a group. ↑/↓ move, Enter runs, Esc closes. The index is read on every open by one server
  action ([`app/(app)/palette-actions.ts`](app/(app)/palette-actions.ts)) over the reads the
  screens already make — `readBoard()`, so the board's cached GitHub reads, and the Leads
  screen's `listClients` — and a source that fails drops its groups with a one-line note.
  Launches open in a new tab; the palette sends nothing and changes nothing.

## Inbox — what is waiting on you

The Inbox answers *what needs me* as a fast queue (D-13): the business attention still owed by
hand, and nothing else. Money left it with the rail (D-17), the "worth a look" counts stayed
behind as the Leads filters they already were (`/leads?crack=unplanned`, `/leads?crack=idle` —
D-18), today's tickets are Work's, and the Gates and PRs group arrives with `gates-read`. So the
page reads Neon and nothing else ([`lib/inbox.ts`](lib/inbox.ts) → `loadInbox`).

**One group, Follow-ups** (D-15), foldable, its count in the header (the fold is remembered in
this browser). Three kinds of row, in this order, each capped — the caps are the badge's too:

- **Outreach** — next steps dated today or earlier, in the crack-finder's order: overdue first,
  then fit tier. At most 10: ten is a morning's work.
- **Waiting on you** — open leads untouched for 7+ days (the Leads list's threshold, in
  [`lib/leads.ts`](lib/leads.ts)) that are not already on today's outreach, longest first. At
  most 6.
- **Wake** — nurture leads whose wake date has come, longest-overdue first. At most 3.

Past a cap, a quiet line at the foot of the group says how many more are waiting; they take the
freed places as rows clear. A row reads its kind tag (mono), the name, who or where, and the age
— overdue outreach and every stale lead in the destructive colour.

**At the desk (from `lg`)** the list and a detail pane sit side by side (D-34): the row's step or
silence, its facts (last touch, due date, cadence rung, intake), and its actions. **Below `lg`**
a tap opens the row in place: its primary and secondary as two full-width buttons, the rest as
text buttons. Outreach and stale rows keep the Leads list's swipes (D-32): right marks the lead
touched, left reaches them on WhatsApp or email.

| Kind | Primary (↵) | Secondary | Also |
|---|---|---|---|
| Outreach | Reach on their best channel | Log a touch (`e`) | Tomorrow (`s`), other channels, Mark touched, Open lead |
| Waiting on you | Reach on their best channel | Mark touched (`e`) | other channels, Open lead |
| Wake | Wake (`e`) | Later · +90 days | Tomorrow (`s`), Open lead |

**Keys, at the desk:** `j` / `k` (or ↓ / ↑) move, `↵` runs the primary, `e` the done action, `s`
Tomorrow. None fires while typing, while the palette or a menu is open, or with a modifier held.

**Clearing.** Every follow-up can be cleared without opening the lead: a stale lead by Mark
touched; an outreach row by Tomorrow (the step keeps its words, dated tomorrow) or by logging a
touch and accepting — or editing — the cadence's suggested next step; a wake by Wake (it comes
back as an outreach row, with "Get back in touch" due today), Tomorrow, or Later. A cleared row
leaves the list at once and the selection moves on; a failed write puts it back with a toast.
Mark touched on an outreach row stamps the lead but leaves the row: the step is still due.

**Nothing is sent from the Inbox** (D-33). Reach is a plain `wa.me`, `mailto:` or `tel:` link,
with no draft — drafting stays on the lead's
profile — and a touch is logged only by the operator's own submit.

**Empty is the point:** with no rows the list reads "Nothing needs you". A failed database read
says so in place of the group rather than pretending the day is clear.

## Leads

One row per person. A portfolio contact enquiry, a sellers-site referral, and someone met at a
meetup are all the same kind of record; `source` is the only thing that tells them apart. There
is no second table for opportunities — a lead who comes back for more work is still the same
relationship, and what was actually billed lives in Stripe.

- **Desk first, compressed for the phone** (leads-table-board, D-1, D-19). From `md` — where the
  shell swaps the tab bar for the rail — the screen is one desk-tier pane across the content
  area: a header with the cash totals, the **Table / Board** switch, **Prospects** (with the size
  of the pool) and **Archived**, and **Add lead**; a filter bar; then the table or the board.
  Below `md` it is the phone's list of rows under the title bar. One read and one sort feed both.
  Everything lives in the URL — `view`, `archived`, `filter` or `crack`, `layout`, `sort`, `dir` —
  so every control is a link that keeps the rest, and a reload or a shared link lands on the
  same screen.
- **The table** ([`components/leads-table.tsx`](components/leads-table.tsx), on the desk
  `DataGrid`) — Name (and company), Status, Deal stage, Value, Next step, Due, Last worked, Tier,
  and three row actions: **WhatsApp**, **Email**, **Mark touched** (in the archive: **Restore**
  and **Delete**). A click anywhere else on the row opens the lead. Status is read here and
  changed on the lead's page, where archive and delete also live — a live row carries no
  destructive control (D-30).
- **Sorted by who has waited longest — until you click a header.** With no `sort` in the URL the
  roster orders on `coalesce(last_touched_at, created_at)` ascending (the table reads that as
  *Last worked*, descending), so the page opens on the work rather than on the newest arrival.
  Any of the eight data columns sorts on a click and reverses on the second; the choice rides the
  URL as `?sort=<name|status|stage|value|next|due|last|tier>&dir=asc|desc` and is applied on the
  server ([`lib/leads.ts`](lib/leads.ts) → `sortLeads`). Blanks — no stage, no deal, no next
  step, no date, no tier — sort last in both directions. Anything open and untouched for 7+ days
  reads `waiting N days` in red; changing a status, editing a profile, or **Mark touched** all
  stamp the row.
- **The keyboard** (desk, table) — `j` / `k` move a highlight through the rows, `Enter` opens the
  highlighted lead, `t` marks it touched. Never while typing, while the palette or a sheet is
  open, or with a modifier held — ⌘K stays the palette's (D-32).
- **The board** ([`components/deal-board.tsx`](components/deal-board.tsx)) — `?layout=board`,
  on every view: one column per deal stage, **01 intake** to **08 handover**, each with its
  count, and **No folder** first for every lead whose stage can't be read — no repo, no deal
  folder, no live engagement, or no `NN-` artefact yet (D-35). The stage is the deal folder's in
  icm-board ([`lib/deals.ts`](lib/deals.ts) → `dealStages`), cached like every other GitHub read
  here. Cards show name, figure, next step and a due / waiting / status foot, and link to the
  lead. **Read-only** (D-19): nothing drags and nothing writes — a deal moves in its folder. When
  the folders can't be listed at all (no `GITHUB_TOKEN`, a rate limit) the board says so in one
  line instead of filing everyone under No folder in silence.
- **Filters** — All / Open / Clients / Not won, each with a count that adds up to All, as links
  in the filter bar. After a hairline, the two cracks the Inbox used to count — **Nothing
  planned** and **Gone quiet** — each with its count, computed with the same predicates their
  views list by (D-18, D-34). A crack view (`?crack=unplanned|idle`) stands the population
  filters down, says in one line what its rows have in common, and links back to Leads.
- **Two views, switched from the header.** **Archived** and **Prospects** change what you are
  looking at rather than filtering it. The prospects view holds the cold pool — imported
  businesses on the `prospect` and `nurture` rungs — sorted on their **fit tier** (A/B/C,
  untiered rows last) with the parked ones muted and last, carrying *sector · town* where a
  company would sit, and its own three filters (All / Working / Nurture). Nothing in it is open,
  stale, or in a money total, and Add lead is not offered there: the pool arrives by import, in
  a batch, not one business at a time.
- **On the phone, a row is two lines and its actions are gestures.** Flat, full-bleed rows on the
  desk tier, at least 44px. The whole row opens the lead; **swipe left** reveals WhatsApp / email
  / archive (restore / delete in the archive view), **swipe right** marks them touched in one
  stroke — the mail-app idiom, built on [`components/swipe-row.tsx`](components/swipe-row.tsx).
  Every gesture has a non-gesture twin one tap away, on the lead's own page: the swipe is the
  shortcut, never the only way in. The phone gets no Table / Board switch — nine columns is a
  desk view — and its rows follow whatever sort the URL carries.
- **The headline figure** — what a lead is worth, in mono beside the name. A deal is
  [composable](../../packages/services/README.md): cash, a swap,
  equity and commission are independent components and any one of them is a deal, so the figure
  is whichever one leads. Cash shows its euros (`€1,500`, or `€1,500/mo` when `billing_type` is
  monthly); a deal with no cash in it shows its strongest percentage instead — **12% equity**,
  **8.5% comm** — where a euro-shaped model used to leave the row blank. Which component gets
  the slot is `dealHeadline` in the services layer, so the list row and the profile masthead
  can't disagree about it.
- **Deal terms, on the row** — not every engagement is euros invoiced monthly, and none of that
  is legible from a number in a Value column. So the phone row's third line (beside the deal
  folder's stage) carries the four things that change how you treat a relationship:
  **Barter** (`deal_type = 'barter'` — services exchanged, not invoiced),
  **_n_% equity** (`equity_bps` — the stake negotiated in their company),
  **_n_% comm** (`commission_bps` — the cut of the client's revenue taken through Stripe), and
  **Started** (`work_started_at` — the work has begun). A plain cash deal that hasn't started
  shows nothing, which is most rows most of the time. Whatever the headline figure has already
  said is left out of the badges rather than stacked beside it — an equity-only deal reads
  "12% equity" once. Barter is the exception and always keeps its badge: it *qualifies* the
  euros next to it rather than repeating them.
- **The header totals stay cash-only.** Open one-off cash as *in play*, active monthly clients
  as */ month*, and barter on its own **in kind** figure — a swap can be worth real money and
  still put nothing in the bank, so folding it in would quietly overstate the pipeline. Equity
  and commission never fold into a euro total at all: 12% of a company is not €12,000 until
  someone buys it, and a commission is a share of revenue that hasn't happened yet. They are
  read on the rows, where they say what they are. All of it is Jamie's own figures — Stripe
  stays the authority on what was actually invoiced and paid.
- **Add lead / add customer** — leads mostly arrive by word of mouth, so adding someone by hand
  is a first-class button, not an afterthought: a floating button in the thumb zone above the tab
  bar on a phone (opening the form as a bottom sheet), **Add lead** in the header at the desk. The public contact form is one way in, not the only one. Because a lead and a customer
  are the same row, the sheet opens on a **Lead / Customer** choice, which is all that sets
  `status` — `new` or `client`. A lead needs only a name; a customer also gets **Value** and
  **Billed**, so entering one who has been paying since before this dashboard existed doesn't
  leave the recurring-revenue total understated from the moment they're added. The free-text box
  follows the same split: a lead's words are intake (`intake_message`), a customer's are working
  notes (`notes`). The rung between the two — `talking` — and the drop-out `lost` are the
  status menu on the lead's page. The customer branch also asks **Paid in** (cash or
  services) — and only that, of the deal terms: the rest skews no total by waiting for the
  profile, but a swap filed as cash overstates the pipeline from the moment it is typed.

The **working-list strip** that used to sit above this list — todos and Portuguese compliance
dates folded into a `<details>` — is gone, and so are todos and compliance dates themselves.
Attention lives on the [Inbox](#inbox--what-is-waiting-on-you).

A lead's own page opens on *them*: the identity masthead (name, company · status, the deal's
headline figure in mono) and, under it, the five things you do from a phone as a row of tinted
discs — call / WhatsApp / email / mark touched / **work started**. Then the record, in **two
segments**:

- **Person** — the record. Status (and when they were last worked), **Contact**, **Facts**,
  **Deal**, the folded **Intake** row, and the **Danger zone**.
- **Work** — the surface you operate. **Touches**, **Notes**, **Forms**.

Both segments are rendered and only one is shown, so switching costs no round trip and a
half-typed note survives a look at the deal; the choice rides in the URL as `?tab=work` through
`history.replaceState`, so a refresh comes back where you left off.

Directly under the identity, on its own line, is **what happens next**
([`components/lead-next-action.tsx`](components/lead-next-action.tsx)): the lead's `next_action`
and its due date, tinted, in mono, and tinted red once the date has passed. It is a button —
tap it to write one, edit one, or clear it — and on a parked (**Nurture**) lead it says when
they wake instead, because a parked relationship's plan *is* its date. A lead with nothing
planned reads a quiet "No next step" on the rungs where one is expected, and renders nothing at
all on the ones where it isn't (a client, a past client, a lost lead). **Nothing ever blocks a
save for a missing next action** — that is Jamie's decision, and what notices the gap instead is
a read: the crack-finder queries in the services layer, which sequence 6 of the lead-engine epic
puts on the Inbox.

Riding with the identity are **two status glyphs — the delivery repo and the Stripe customer**.
Lit and filled when connected (tap jumps to GitHub or Stripe); dim on a dashed outline when not
(tap opens the control that links one, in a sheet). That is the whole of the delivery/billing
surface — there is no Delivery & billing section, and no convert walkthrough: **moving the
status to Active client *is* the conversion**. Nothing warns, walks or blocks; an unlit glyph is
the only reminder that plumbing is still missing.

The record is **facts, not form fields**: a **Contact** card whose rows are the actions
themselves (tap the email row and the mail app opens, tap WhatsApp and the conversation opens,
tap Instagram and their page does, copy beside each), a **Facts** card — what they *are* rather
than how you reach them: sector, town, language, fit tier, web presence, and the **hook** as
prose in a block at its foot, because the one line that says why they would care is a sentence
you read before writing one — a **Deal** card showing only the components actually agreed
(value, billed, paid in, equity %, commission %, what's being exchanged) and saying so plainly
when none is — nothing there waits on a euro figure — and a **Notes** card. Each edits in its
own bottom sheet
([`Sheet` in `@jamie-nisbet/ui`](../../packages/ui/src/components/ui/sheet.tsx)) posting a
server action scoped to exactly its own fields (`saveClientContact` / `saveClientFacts` /
`saveDealTerms` / `saveClientNotes`), so no sheet can blank a field it never showed. **Work started** is a one-tap
toggle in the rail rather than a field to save, because it is something you record on the day it
happens; re-tapping undoes it, and marking an already-started engagement keeps the original date.

### The touch log

**Work** opens on **Touches** ([`components/lead-touches.tsx`](components/lead-touches.tsx),
rows in [`components/touch-row.tsx`](components/touch-row.tsx)) — every call, message, DM and
walk-in with this person, newest first, because what has already been tried is what decides what
to try next. A bare touch is a row ("WhatsApp · Sent · 2 Sep"); one carrying a note or an AI
draft is a fold, with the note's first line as the preview. An inbound touch — one *they*
started — carries a small tinted arrow; outbound is the default and says nothing.

Logging one is **two taps**: the channel, then what came of it. That is the whole design
constraint — if logging a call takes longer than the call was short it will not happen, and a
history with holes in it is worse than none because you stop trusting it. So the second tap is
the submit, the note is a box that is simply there while you decide rather than a step, and
there is no Save button to find. The outcomes offered depend on the channel (a phone call rings
out or it doesn't; an email goes and either comes back or doesn't), and the direction control
defaults to outbound, which is almost every row.

**The sheet does not close on a log.** It turns into the cadence's suggestion for the next
touch, already filled in — *step 3 of 5 · WhatsApp*, due on a date — one tap from being real.
Editing it is a field; **Not now** closes the sheet with nothing planned, which is allowed. When
the lead has actually answered, the cadence stops pushing and suggests a reply instead; when the
five-touch cadence is spent it suggests **parking them on nurture** with a wake date ninety days
out, which is one button rather than three edits. A "not interested" gets no suggestion at all —
there is nothing to suggest after a no.

The cadence itself is plain data in the services layer
([`packages/services/src/cadence.ts`](../../packages/services/src/cadence.ts)), not a table and
not a scheduler: ~5 touches over ~3 weeks, first on whichever door is open, a second channel on
day 3, a follow-up in the first week, a walk-in on day 12 for A-tier leads with a town on file,
and a last message on day 19.

### Drafts — written here, sent by you

Under the history sits **Draft** ([`components/lead-draft.tsx`](components/lead-draft.tsx)): the
message for the next touch, grounded on this lead's own row. It is AI back in the dashboard
after the 2026-08 reversal removed it, and it is allowed back because of where it stops — it
composes, and a human sends. There is no Resend in this app, no auto-send path, no versioned
documents and no `generations` table. A draft is a string.

- **Grounded, not generic.** Name, company, sector, town, language, the **hook**, the website
  and its grade, the review count, and the touch history — assembled by `buildDraftPrompt` in
  [`packages/services/src/outreach.ts`](../../packages/services/src/outreach.ts), which is also
  where the voice prompt lives so a script drafting from a terminal sounds like this screen.
  The model is told never to invent a fact: with a thin row it says less.
- **Four rungs, three doors.** *First · Bump · Follow-up · Last one* — the cadence's own steps
  read as messages, prefilled from where this lead actually is. The door is email, WhatsApp or
  Instagram; a phone call and a walk-in are touches, not drafts. The register follows the
  channel, and an email draft carries its own `Subject:` line.
- **pt-PT gets a better model.** English drafts run on a nano-class model; a lead whose
  `language` is `pt` steps up to a Haiku-class one, because the failure mode there is not a
  wrong language but a *translated* one, which is the exact signal a business uses to spot a
  mailshot. Both ids live in [`lib/ai.ts`](lib/ai.ts).
- **A first-touch email carries the two lines the law puts there** — where the details came
  from, and how to stop it (Art 14; see
  [`.icm/docs/lia-cold-outreach.md`](../../.icm/docs/lia-cold-outreach.md) § 3).
- **Handoff, never send.** `mailto:` opens a compose window with subject and body filled in;
  `wa.me/<number>?text=` opens the conversation with the message typed into the box; Instagram
  has no prefill at all, so that row copies the draft and opens the profile in one tap. Every
  one of them ends with a thumb pressing send in somebody else's app.
- **The handoff offers to log the touch.** Taking the draft anywhere reveals *Log it — WhatsApp,
  sent*, which writes the touch with the draft attached (`touches.draft_md`, plus which model
  wrote it) and then leads into the cadence's next-step pane — the same one the touch log uses
  ([`components/next-step-pane.tsx`](components/next-step-pane.tsx)). Read, hand over, log, plan:
  one sheet.
- **A closed door has no gesture.** A channel somebody opted out of is a disabled segment that
  says why, and the server action refuses it too — the app must not be able to *write* the
  message, not merely to send it. A lead with every channel closed, or none on file, gets a
  stated dead end instead of the panel. With no `AI_GATEWAY_API_KEY` the section says drafting
  isn't set up and nothing else on the page changes.

The Gateway is reached through the AI SDK with a bare `provider/model` string, so there are no
provider packages and no client to construct — one key, one bill, and a monthly budget in the
Vercel dashboard as the spend tripwire.

### Read their website — facts proposed, never taken

The **Facts** group on **Person** has two rows at its foot, because there are two ways a fact
gets there: type it, or read it off their site. The second is
[`components/lead-enrich.tsx`](components/lead-enrich.tsx) — it fetches one page of the
business's own website, has a cheap model say what is on it, and puts the answer *beside* what
is stored.

- **A blank fills itself; a value argues its case.** A proposal for an empty column arrives with
  its switch on — that is a correction, and making you tap nine times to accept nine corrections
  trains you to tap without reading. A proposal that would **replace** something arrives switched
  off, every time, with what is already there printed next to it. The hook is why: it is usually a
  sentence you wrote after looking at the business yourself.
- **Nine columns, and only those.** Web presence, sector, town, language, the hook, and the four
  contact doors. A proposed door that has already opted out is dropped server-side before the
  sheet ever draws it — writing a suppressed address back onto a record would put a channel there
  that every other surface then has to spend its time refusing.
- **The tier is not on the list.** *A/B/C* is **derived** from the facts by a pure function in
  [`packages/services/src/tiering.ts`](../../packages/services/src/tiering.ts), so the sheet
  *reports* what the letter becomes rather than offering it, and the server derives it again on
  save from whatever was actually accepted. AI proposes facts; the function decides the letter.
  Where the stored tier and the facts have since parted company, the Fit tier row says so —
  *"The facts now say B"* — and nothing acts on it: a re-tier is a gesture, not something that
  happens to a record while nobody is looking.
- **What the site shows.** Two to five lines of evidence — whether you can book online, how
  recently anyone touched it, which doors it offers — read once and never stored. There is no
  findings column and no provenance table.
- **Accepting nothing is a real outcome.** *Save nothing, mark as read* stamps `enriched_at` so
  the batch pass leaves the row alone; it is not `last_touched_at`, because reading a stranger's
  home page is not contact.
- **Four ways it declines, each saying which.** No website on file, no Gateway key, a site that
  did not answer (reported — never graded, because a timeout is not a finding), and a model that
  came back with something other than facts.

The batch counterpart is `leads-enrich` in
[`packages/services/scripts/`](../../packages/services/scripts/) — `--dry-run`, rate-limited,
skips recently-read rows, fills blanks only, and `--retier` to re-derive every letter at once.

Reference material and irreversible actions sink to the bottom of **Person** — **Intake** is a
`GroupedDisclosure` that folds open on a tap, and archive/delete are the last section, under a
**Danger zone** header in red, rather than beside the title where a thumb reaching for the
status could find them.

### Delivery repos

Each lead can carry a GitHub delivery repository ([`lib/github.ts`](lib/github.ts),
[`components/client-repo-link.tsx`](components/client-repo-link.tsx)): connect an existing repo
or create a fresh one from the sheet behind the profile's repo glyph. The pointer is stored on
the row (`clients.github_repo`) so the dashboard always knows where a customer's work lives.
Needs `GITHUB_TOKEN` (see [`.env.example`](.env.example)); with it unset the sheet shows a "not
configured" note and the rest of the admin is unaffected.

The picker suggests every repo the account **owns or collaborates on**
(`affiliation=owner,collaborator` — not every org repo it can merely read), so a repo a client
created under their own account or org and invited Jamie to is connectable. Two things have to
hold for one:

- **The invitation is accepted.** A pending invite grants nothing; connecting says so and links
  the invitation.
- **The token is a classic PAT with `repo` scope.** A fine-grained token is bound to one resource
  owner, so it can't see a repo another account owns even when Jamie is a collaborator on it;
  connecting says so rather than calling the repo missing. A client org that enforces SAML SSO
  also needs the token authorised for that org on github.com.

The Work board reads through the same token, so the same rule decides whether a client-hosted
repo's tickets show up there.

### Forms — questionnaires sent to a lead

Prospection used to happen over email, which meant the answers lived in an inbox rather than on
the lead. The **Forms** card on a profile fixes that: pick a questionnaire, hit **Send form**,
and paste the link it gives you into an email you write yourself.

- **Questions are content, answers are business state.** The house questionnaires are markdown
  files in **icm-board** — `workspaces/sell/references/forms/` (the deal workspace owns them
  since 2026-09-22; the grammar is in that folder's README) — parsed by the shared
  `parseOnboardingForm` in `@jamie-nisbet/services` into the snapshot type the portfolio also
  renders. The answers land in Neon (`biz.form_links`), which stays the record.
- **The library is two repos, scoped per lead.** The picker offers the house questionnaires
  from icm-board *plus* any in the lead's own connected delivery repo (`clients.github_repo`,
  the same roster the Work board uses; its folder is `.icm/onboarding/`) — both read over the
  GitHub API, the client's sorted first and preselected. A form written for one client only ever
  appears on that client's profile; a repo with no questionnaire folder contributes nothing and
  raises nothing. Forms are identified by repo *and* slug, so a client repo can carry its own
  `intake-diagnostic.md`, and the snapshot's `sourceRepo` + `sourcePath` record which was sent.
- **Publishing is a snapshot.** "Send form" parses the file *at click time* and freezes the
  result onto the link row, so editing a question later never reinterprets answers already
  collected — and never changes what a form sitting in someone's inbox shows them.
- **The link is copied, not sent.** Per the standing "no outbound action without review" rule
  the card's job ends at a pasteable URL (`PORTFOLIO_BASE_URL` + `/f/<token>`); the email around
  it is written by a human. The row's uuid *is* the token, so there is no separate credential.
- **One shot.** A pending link shows the URL, a copy button, and a preview; once answered it
  turns green and folds open the answers read-only (newest open, older ones collapsed).
  Revisiting a submitted link shows a polite dead end rather than the form. Deleting a link
  takes its answers with it, so it asks first.
- A questionnaire that doesn't parse is reported by name in the card — with what is wrong with
  it — instead of quietly vanishing from the picker, and nothing is inserted.
- **Snapshot to the deal folder closes the loop.** An answered form on a row with a delivery
  repo gains a **Snapshot to deal folder** button — the deal folder is named after the repo
  (icm-board D28, nothing to set): the answers are rendered to readable markdown and
  committed to **icm-board** as
  `workspaces/deals/<repo name>/<engagement>/answers/<form-slug>.md` (or the client folder's
  `answers/` when `DEAL.md` names no live engagement), one commit, message
  `Deal: <slug> — <form-slug> answers`, with a provenance header naming the `form_links` row.
  Immutable and provenance-stamped — the one kind of copy icm-board's one-home-per-fact rule
  allows (D24); an existing file is never overwritten, and the button refuses plainly when the
  row has no `github_repo`. The GitHub token needs Contents: write on `k0d0minio/icm-board` for it.

The public pages live on the portfolio (`/f/[token]` for a sent link, `/start` for the free-look
intake) because that app already has the brand chrome and a server action writing to
`biz.clients`; nothing customer-facing is served from the dashboard. Nothing is traced into the
deployment any more: the house forms are read from icm-board over the GitHub API.

## Work — the screen the app opens on

The estate's engineering backlog in one place, read **batch-first**. Every active repo keeps
its work items as markdown in `.icm/intake/` — the estate-wide standard (canonical spec:
`_system/contracts/TICKETS.md` in the `icm-board` repo) — and [`lib/tickets.ts`](lib/tickets.ts)
reads those folders from each repo's **default branch** via the GitHub API (60-second revalidate, tag-busted by the
board's refresh button) and folds them into `listBoard()`: one inset grouped list per repo —
urgency-ordered — whose intake batches are its rows. Each epic folder is a batch row showing its
progress as a mono `N of M` over the thin `Meter` (from the stubs' `sequence: N of M` lines) and
its next stub; the `triage/` one-offs and any unmigrated legacy tickets ride as **Triage** and
**Backlog** pseudo-batches, and the repo's runs in flight (`.icm/runs/`) as **In flight**. The
repo roster comes from the database plus every repo the token owns or collaborates on; each
ticket links back to its client. A connected repo the token can't see is named on the board
with the reason, never dropped in silence.

**Master–detail.** The board is a list that drills and a pane that swaps
([`components/tickets-board.tsx`](components/tickets-board.tsx)). List level 0 is the repo chip
rail and the repo groups; tapping a batch pushes the list to level 1 — that batch's tickets
under a "‹ repo" back row — and tapping a repo's header opens the repo. From `lg` the pane
([`components/board-pane.tsx`](components/board-pane.tsx)) stands beside the list, pinned under
the title bar with its own scroll, and shows the selected **ticket**, **batch**, **repo** or,
with nothing selected, the **estate overview**. The batch view is the epic's own: its `N of M`
and `Meter`, **Copy next** (the next stub's own split button — its pick-up, every tool behind
the chevron), **Recut** (epics), GitHub, its stubs, and the epic's `breakdown.md` rendered (read
by blob SHA beside the stubs; "No breakdown.md in this epic." where there is none). The repo view sets
the repo's own figures in mono — Open, Today, Blocked, In flight, a zero left out — then, if
its GitHub read failed, what GitHub said in full, then its client (or "House repo") and its
maintenance launchers with Open on GitHub. The estate overview sets the Today / Blocked / Open
figures for the current repo filter; under them a **Blocked** group lists exactly the tickets
that figure counts, each with its repo and why it is stuck (its `blocked:` line, else the open
stub it waits on), a tap opening the ticket; then **Couldn't be read** — the roster error
first, then each unreadable repo with what GitHub said, its row opening that repo's view (a
repo that couldn't be read has no section in the list, so this is its way in; the view still
carries its triage and sweep launchers); then the estate check and the board's footnote. A ticket reads phone-first: its title and one
summary line (status · priority · `n of m` · repo · client, and why it is blocked), then
**Copy** with its recommendation and **Open on GitHub**, its header fields — a `depends-on`
slug still on the board selects that ticket — and the body, its `## Prompt` section folded.
Below `lg` a ticket or a repo is a full-screen pushed view with a back bar and an edge swipe; a
batch is not pushed — level 1 *is* its view there, its stubs first and its actions and
breakdown under them — and the overview is the foot of level 0. Every selection is URL state —
`?t=<repo>/<ticket id>`, `?b=<repo>/<batch>` (`_runs` for In flight) or `?r=<repo>`, one at a
time, beside the `?repo=` filter — so a link reopens exactly that view, and one that names
something since shipped falls back to its batch, or to nothing. An old link still carrying the
retired `&pane=1` opens the same view and drops the flag.

**The keyboard, from `lg`.** [`components/use-board-keys.ts`](components/use-board-keys.ts)
drives the board without the mouse; `?` (or the hint at the foot of the list) opens the map.
`↓`/`↑` or `j`/`k` move a cursor through the list level on screen. At level 0 it walks the repo
headers and batch rows and the pane *previews* the row under it without touching the URL (a batch
can't be selected there without drilling); `Enter`, `→` or `l` commits — a batch drills to level
1, a repo opens and focus moves into the pane. At level 1 the cursor is the selection: each step
rewrites `?t=` in place (`replaceState`), so back steps through levels, not through every stub
passed; `Enter` moves focus into the pane, where the arrows and `j`/`k` scroll it. `Esc`, `←` or
`h` back out a level — pane → list → repos — and at level 0 clear the selection. `c` copies what
the view's own copy button would (a ticket's pick-up, a batch's Copy next; "Nothing to copy here"
otherwise), `o` opens it on GitHub, `r` is the refresh button, `[`/`]` step the repo chips (All
included, wrapping). No key fires while you type, while a menu or sheet is open, or with
Ctrl/Cmd/Alt held — except `[`, `]` and `?` themselves, which still fire on the AltGr/Option
layouts (Portuguese, German, Spanish among them) that type those characters that way. Each list
level is a `listbox` whose `aria-activedescendant` is the cursor row, so a screen reader follows
the same cursor; below `lg` nothing here applies.

**Read once, used locally.** Work (`/`) reads the board once per visit (`readBoard()` in
[`lib/tickets.ts`](lib/tickets.ts)) and hands it to a client root
([`components/tickets-board.tsx`](components/tickets-board.tsx)) as plain data: ticket bodies and
epic breakdowns as raw markdown, rendered only when that ticket or epic is opened, and every
launcher already built. The repo
chips filter in memory and every selection is resolved from the URL, written with
`history.pushState` ([`components/use-board-params.ts`](components/use-board-params.ts)) — so a
tap is instant, back/forward step through filters and selections, and `/?repo=<slug>`
still deep-links. New data arrives
two ways, both swapped in under whatever is open without the loading skeleton: the **refresh
button** busts every board read (`refreshBoard`), and coming back to the app after **five minutes
or more** away re-reads quietly, busting only the position reads — the repo trees and
`today.md`, which carry a second tag, `BOARD_POSITION_TAG` — so the estate's shape and every
unchanged ticket body stay cached. It has to bust something: a read past its revalidate window is
answered stale while it refreshes in the background. Beside the button, **"as of HH:MM"**
(Europe/Lisbon) is when the board on screen was read.

**Which branch a repo is read from.** `main` (icm-board decision D39 §8) — a repo's ticket state
has one home, in icm-board and every client repo alike, and every read, link, and group header
follows it. No per-repo probe, no badge, no fallback caveat.

The board is **read-only by design**: a ticket is created, edited, and finished (moved to
`_done/`) inside its repo by the session doing the work — the repo stays the source of truth
and nothing is mirrored into the database. Every button therefore copies a prompt, or opens a
tool with it pre-filled, and a human sends it: **Copy prompt** (with every registered tool in
its menu) / swipe-right on a row or batch, and the maintenance launchers — per-repo *triage the backlog* and
*sweep finished work* (in the repo's view), per-batch *recut this batch* (in the batch's view),
and the board-level *estate check* (the `/icm-check` pass on icm-board, in the estate
overview). The triage, sweep and recut prompts end by
telling the session its ticket changes commit straight to `main`, pointing at the
`pr-conventions` skill's "Ticket commits" section for the shape (D39). Rows wear the Leads list's gestures: swipe
left for a tray (copy, GitHub, client), swipe right to copy what it sends — with a haptic tick the
moment a full swipe crosses its threshold.

That link is documented by Anthropic, built by the one target in the launcher registry
[`lib/launchers/`](lib/launchers/) — `claude-web.ts`, carrying a comment naming its doc, ordered
in `index.ts`. A target declares what it can carry (repo, mode, model, effort) and a pure
`build()`. The board asks the registry for a `Launch[]` — one entry per registered target, in
`LAUNCH_TARGETS` order, the default first, each with its link or the one-line reason it has
none — through `launchesForTicket` and the maintenance launchers in
[`lib/tickets.ts`](lib/tickets.ts), and every control in
[`components/launch-menu.tsx`](components/launch-menu.tsx) is drawn from that list alone. No
component names a tool.

**Copy is the default action everywhere** (decided 2026-09-23): no tool link is the default
until it is proven, and the clipboard works on every surface, with every tool, at any length. A
`claude-cli://` terminal target was tried and dropped the same day — it opened nothing in a
smoke test, and root-causing it turned out to depend on the operator's own machine (Claude Code
CLI's local URL-scheme registration, then GNOME/Brave's MIME cache, then a corrupted
`~/.local/share/applications` permission bit) rather than on anything this repo controls; see
triage stub `claude-terminal-link-opens-nothing` (archived).

- an opened ticket's **Copy prompt** (or **Copy pick-up**) is a split button — the primary half
  copies, the chevron opens an `AppMenu` of every target with its recommendation beside it;
- the maintenance rows (triage, sweep), a batch's **Recut this batch** and the board's **Estate
  check** copy their prompt on tap and carry the same menu as a trailing `…`;
- swipe-right on a ticket copies its pick-up, on a batch the next stub's;
- a target that can't carry a launch — parked, or a prompt past its cap — stays in the menu,
  dimmed, with its reason; never hidden.

| Target (menu order) | Shape | Doc | State |
|---|---|---|---|
| **Claude Code** | `claude.ai/code/new?q=…&repo=…&mode=code` | [universal link](https://support.claude.com/en/articles/14898120-open-the-claude-mobile-app-with-a-link) | live |

What gets copied is the default target's text: the pick-up verb as is, or a prompt body with
the recommendation line on top in that target's vocabulary.

**Add a launch target.** Only once the tool documents its link shape — no guessed schemes:

1. Write `lib/launchers/<tool>.ts` exporting a `LaunchTarget`: its `id`, menu `label`,
   `surface`, what it `supports`, its `modelAliases` (or null), its `maxEncodedPromptChars`
   (or null), and a pure `build()` that returns null when it can't express a request. Put the
   doc's URL in the comment above it.
2. Add it to `LAUNCH_TARGETS` in `lib/launchers/index.ts`. Its position is its place in the
   menu; the first entry's vocabulary is the one the copied text uses.
3. Add a row to the table above. Nothing under `components/` or `app/` changes.

To **park** a target that doesn't work yet, set `parked: "<one line>"` in its file: it stays in
every menu, dimmed with that line, and emits no link. Delete the field to bring it back.

The primary link is a *universal* link: on a phone with the Claude app installed the OS hands
the tap to the app's new-session composer, and everywhere else the same URL opens that form in
the browser — which is why it replaced the older undocumented
`claude.ai/code?prompt=…&repositories=…` shape on a screen built to be read one-handed. Every
launcher passes `mode=code` — explicitly, not by omission, so a board session never inherits a
sticky plan pick (the article documents `plan` and `code`; see the table below for what the
composer actually did with it). The terminal link is its desk-bound twin: it opens a local session in whichever clone
that machine last ran `claude` in, prompt pre-filled and inert until Enter.

**Model and effort are recommended, not preselected.** One rule in
[`lib/launchers/hint.ts`](lib/launchers/hint.ts) derives a tool-neutral tier and effort from what
a ticket already carries — never from a line anyone writes. A `/pipeline` verb follows the
pipeline's own tiering (`new` opens Define on the deep tier; `build`, `release` and every lane
run on the balanced tier), with the effort from the stub's `size` (S medium, M high, L xhigh) or
triage lane (chore low, tweak medium, bug high), else high. A prompt body, from a repo without
the router, is sized by the stub alone. Maintenance: triage and sweep balanced · medium, recut and
estate check deep · high. Each target names the tier in its own vocabulary — for Claude the
aliases `haiku` / `sonnet` / `opus`, never a dated model ID. Because neither link carries it (the
table below), the ticket detail shows it beside **Copy prompt** ("Recommended Opus · high") and
on each menu entry, to be picked in the composer, and a prompt body — never a verb — opens with
one line naming it in that target's vocabulary, which counts toward the cap below. **Copy
prompt** copies the default target's version.

**The cloud environment comes from the claude.ai/code selector, not the link.** No link
documents one, and there is no URL for the selector: pick the right environment there once (the
pick sticks), or set the organization default at claude.ai/admin-settings/claude-code.

What the links were seen to do — **verified by hand on 2026-09-23, not documented**; a parameter
is wired only once it reads *honoured* here:

| Parameter tried on `claude.ai/code/new` | Result |
|---|---|
| `repo=owner%2Fname` | honoured — the right repository is picked |
| `mode=code` (documented) | not reflected in the composer — still sent, as documented |
| `model=haiku`, `model=claude-haiku-4-5` | ignored — not wired |
| `effort=low`, `reasoning_effort=low` | ignored — not wired |
| `environment=<name>` | ignored — not wired |

The terminal scheme documents none of these either, and nothing beyond `repo` and `q` is sent
to it.

A ticket's prompt is unbounded, so both Claude targets stop at 4,500 encoded characters —
under the 5,000 the terminal scheme documents for `q`, measured on the encoded value, which is
the conservative reading. A longer prompt drops both links rather than emitting a URL that
truncates in silence: the menu entries go dim with a line saying why, and **Copy prompt**,
which has no cap, still works. House
prose encodes at roughly 1.5x, so that ceiling is about 3,000 characters of an actual ticket.
The maintenance prompts are authored literals in `lib/tickets.ts`, short by construction, so
their links never come back empty — a literal edited past the cap throws rather than render a
dimmed entry.

Uses the same `GITHUB_TOKEN` as the delivery-repo features; unset, the screen shows a "not
configured" notice.

## Money

The admin talks to Stripe directly via the server-side secret key (`STRIPE_SECRET_KEY`) — this
is owner-only surface, so no publishable key or client SDK is involved. Stripe is the source of
truth for money; every figure shown
is read live from Stripe, and nothing about an amount comes from the browser. One page, four
sections:

- **Balance** — available, pending, and total outstanding across open invoices.
- **Invoices** (`#invoices`) — every Stripe invoice
  with status/amount/hosted link, and a form to raise a new
  one **against a lead picked from the database** (no free-text customer details). Raising it
  resolves — and, first time, creates + links — that lead's Stripe customer, storing the id on
  the row (`clients.stripe_customer_id`) so the two stay joined. Honoring the repo's *no
  outbound action without review* rule, a new invoice is created as a **draft**; emailing it is
  a deliberate second step ("Finalize & send").
- **Payment links** — mint a reusable, fixed-amount payment link (copy to share), or deactivate one.
- **Recent payments** — what actually landed.

Leads and Stripe customers are kept in sync from here: editing a linked lead's name/email/phone
pushes the change to their Stripe customer, and a lead can be linked ahead of billing from their
profile. See [`lib/clients-stripe.ts`](lib/clients-stripe.ts).

With `STRIPE_SECRET_KEY` unset the app still runs: this page shows a "not configured" notice and
the Leads screen is unaffected. This admin is where invoices are *raised*.

## Deliberately not here

The dashboard used to run a three-step AI deal pipeline (brainstorm with web research → pitch →
proposal → milestone invoicing), with versioned review-gated documents, AI provenance and spend
tracking, draft-only outreach composition, and a won-deal onboarding checklist — around 14
screens in total. It was removed in favour of the four above: too much machinery for a
one-person consultancy whose actual need is knowing who is waiting to hear back.

Drafting came back in 2026-08 as the panel described under [Leads](#leads) — deliberately the
lean half of what left: one string, one call, no table, no versions, no provenance ceremony, and
still nothing that sends.

Gone with it: the `deals`, `documents`, `generations`, `touches` and `workshop_messages` tables,
the `app/api/ai/*` routes, and the `@jamie-nisbet/icm` package (its only consumer was those
routes). The ICM markdown factory (`_config/`, `shared/templates/`, `workspaces/`) was retired
in 2026-08 — the repo now carries only the websites and their shared packages. History in
[`.icm/docs/decisions.md`](../../.icm/docs/decisions.md).

## Auth

Single owner, single password. `ADMIN_PASSWORD` unlocks the app; a signed (HMAC via
`ADMIN_SESSION_SECRET`) httpOnly session cookie keeps you in. [`proxy.ts`](proxy.ts) gates
every route and bounces unauthenticated requests to `/login`. See [`lib/auth.ts`](lib/auth.ts).

The gate's matcher skips any path containing a `.` (static files), so the PWA assets
(`/manifest.webmanifest`, `/sw.js`, `/offline.html`, `/icon.png`, `/apple-icon.png`,
`/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`) are all publicly reachable **by design** — a phone must be
able to fetch the manifest and icons to install the app before you sign in. None of them expose
business data.

## Mobile & PWA

The app is built mobile-first and installs to a phone home screen as **Consultancy JN**.

- **Navigation** ([`components/nav.tsx`](components/nav.tsx)) — three destinations, Work
  first: a flat tab bar on phones and the 56px icon rail from `md` up, with the ⌘K palette over
  both (see [The shell](#the-shell--rail-tab-bar-command-palette)). Each tab is a full 3.5rem
  target — a third of the bar; content is padded to clear it and it extends under the
  home-indicator safe area.
- **Touch targets and safe areas** ([`app/globals.css`](app/globals.css)) — the design system's
  own controls are sized for a mouse (h-8/h-9), so rather than annotate every call site the
  floor is lifted once under `@media (pointer: coarse)`: every button, input and select trigger
  gets a 44px minimum. Nothing there affects a desktop pointer, and the app tier's own controls
  already set their own floor (`min-h-app-touch` on a grouped row, a 3.5rem tab, a 48px action
  disc). The same file defines the geometry utilities the fixed chrome and the rails use —
  `bottom-above-tabs`, `pb-tabs`, `no-scrollbar`, and `pt-screen-safe` /
  `pb-screen-safe` for the two screens outside the shell (login and "not here"), which have no
  tab bar to clear but still open under a notch.
- **Appearance follows the system**, with no in-app toggle — the app tier's rule. An inline,
  render-blocking script in [`app/layout.tsx`](app/layout.tsx) mirrors `prefers-color-scheme`
  onto `[data-theme]` before first paint, which is the whole point: a theme resolved in an
  effect is the white flash every dark-mode app is judged by.
- **Materials degrade where the device can't afford them.** The title bar (still on the app
  tier) is `backdrop-filter`s over a scrolling list, which is the most expensive thing this tier
  asks of a GPU. Two things turn the blur off, both landing on the same opaque surfaces (see
  [`packages/ui/tokens/app.css`](../../packages/ui/tokens/app.css) § Materials without the
  blur): `prefers-reduced-transparency`, reactively in CSS, and `data-materials="opaque"` —
  stamped by the same pre-paint script when the device reports 4GB or less. A capability check,
  never a setting.
- **Anything hover-only is a bug on a phone.** A row action that only fades in on hover from
  `sm` up must stay always visible below `sm`.
- **Gestures, and their non-gesture twins** — list rows swipe
  ([`components/swipe-row.tsx`](components/swipe-row.tsx): pointer-events + `touch-action:
  pan-y`, so vertical stays native scroll; one row open at a time; a drag never fires the row's
  link), and the whole authenticated area supports **pull-to-refresh**
  ([`components/pull-to-refresh.tsx`](components/pull-to-refresh.tsx)) — every screen is a live
  read (Neon, Stripe, GitHub) and standalone mode has no reload button. The body's
  `overscroll-behavior-y: contain` hands the pull gesture to the app. **No action is reachable
  only by swiping**: every tray action has an equivalent inside the sheet or profile the row's
  tap opens, which is what keeps the lists usable under VoiceOver.
- **Haptics** ([`lib/haptics.ts`](lib/haptics.ts)) — one light tick, at the commit rather than
  at the outcome, for a gesture crossing an invisible threshold (a swipe past its commit point,
  a pull past the refresh point) and for a control that changes the record. Never on a
  navigation, an opening sheet, a copy to the clipboard, or a re-read. Silent under
  `prefers-reduced-motion`, and silent on iOS Safari, which has no `navigator.vibrate`.
- **Sheets, not centred dialogs.** Anything a phone user opens one-handed — add a lead, edit
  contact / deal / notes, a ticket batch, an invoice — is a bottom sheet (`Sheet` in
  `@jamie-nisbet/ui`), taking native detents where it holds a form, and falling back to a
  centred dialog from `sm` up. The two Money create forms fold shut until asked for.
- **Four designed states, everywhere.** Content, empty, a layout-true skeleton
  (`loading.tsx` beside each screen), and error: the four screens share one boundary at
  `app/(app)/error.tsx` and a lead's profile has its own, so a read that refuses still leaves
  you in the app. A URL that is nothing — including a bookmark to a deleted lead — gets
  [`app/not-found.tsx`](app/not-found.tsx) rather than Next's bare 404.
  Missing configuration degrades its own feature and never takes a screen down with it.
- **Manifest** ([`app/manifest.ts`](app/manifest.ts)) — `id` and name/short-name
  `Consultancy JN`, `standalone` display, unlocked orientation (the wide layout is a deliberate
  iPad-style scale-up), the app's light canvas as `theme_color`/`background_color`, and PNG
  icons. The mode-reactive theme colour is the `<meta name="theme-color">` pair in
  [`app/layout.tsx`](app/layout.tsx), since a manifest cannot carry a media query.
- **Icons** — static PNGs in [`public/`](public/), cut from the brand artwork itself
  ([`packages/ui/assets/logo/reference/icon-dark.png`](../../packages/ui/assets/logo/reference/), the icon form's dark reading at 2000px):
  `/icon-192.png` and `/icon-512.png` (`any`), `/icon-maskable-512.png`, `/apple-icon.png`
  (180×180 for iOS), and `/icon.png` (64px favicon). They are **not** redrawn from the design
  system's vector paths — the mark is typographic, and an approximation of it in hand-written
  SVG is visibly not the logo. The maskable reading is its own file because a square frame has
  to shrink to about 56% of the tile for its corners to clear the 40% radius a circular mask
  guarantees, and shipping that padding as `any` would waste a fifth of every unmasked tile.
  The crops are documented in [`app/manifest.ts`](app/manifest.ts).
- **Service worker** ([`public/sw.js`](public/sw.js), registered by
  [`components/service-worker-register.tsx`](components/service-worker-register.tsx)) — makes the
  app installable and serves [`public/offline.html`](public/offline.html) for navigations when the
  network is gone. It **does not cache app responses** — this is a live, per-request dashboard, so
  caching authenticated pages would risk stale or wrong-session data. The offline page carries a
  literal copy of the tier's type, colours and radii, because it is served without a stylesheet;
  bump `CACHE` in the worker whenever it changes, or installed workers keep the old one.
- Theme colour, standalone launch, the status-bar style and the apple-touch-icon are wired in the
  root [`app/layout.tsx`](app/layout.tsx) (`metadata` + `viewport`).

## Layout

```
app/
  globals.css           # design-system link + phone plumbing (safe areas, coarse-pointer targets)
  layout.tsx            # root <html> + design-system styles + PWA metadata/viewport + SW register
  manifest.ts           # /manifest.webmanifest (PWA install manifest — "Consultancy JN")
  not-found.tsx         # a URL that is nothing, including a deleted lead's bookmark
  login/                # /login page + login/logout server actions
  (app)/                # authenticated area (route group — no URL segment)
    layout.tsx          # the shell: rail, tab bar, palette provider, the streamed Inbox badge
    error.tsx           # the screens' error boundary — a read that refused
    page.tsx            # Work — the board; also redirects the old /?filter= leads bookmarks
    loading.tsx         # Work's layout-true skeleton
    board-actions.ts    # the board's refresh (tag-busting) server actions
    palette-actions.ts  # the palette's index: readBoard() + listClients, slimmed
    inbox/              # the Inbox — the follow-ups queue (Neon only); loading.tsx alongside
    actions.ts          # lead + touch server actions (every lead screen
                        #   uses these); logTouchAction is the one that answers with what to
                        #   do next
    leads/              # Leads — the table / board at the desk, rows on the phone;
                        #   staleness-sorted unless ?sort=; ?view=prospects is the cold
                        #   pool, tier-sorted; loading.tsx alongside
    leads/[id]/         # one lead: Person / Work segments, repo + Stripe glyphs
                        #   error.tsx — its own boundary, so it can name the record
    money/              # Stripe: balance, invoices, payment links, payments; actions.ts alongside
components/             # login form, nav, service-worker register, lead + money UI
                        #   app-screen.tsx — every screen's masthead: the tier's collapsing
                        #                header, and the profile's identity form of it; the
                        #                reading column (Work alone is `wide`)
                        #   nav.tsx      — the desk rail from `md`, the flat tab bar below it
                        #   command-palette.tsx — ⌘K: the shortcut, the index, filtering, the
                        #                title bar's search button
                        #   app-menu.tsx — the monogram on the bar: what belongs to the app
                        #   chip.tsx     — filter/view chips (finger-sized, rail-friendly)
                        #   swipe-row.tsx — swipe-left action tray / swipe-right commit, per row
                        #   lead-row.tsx — the leads list's gestures (call/email/archive, touched)
                        #   leads-table.tsx — Leads at the desk: the DataGrid, header sort,
                        #                row actions, j/k/Enter/t; the Table / Board switch
                        #   deal-board.tsx — Leads by deal stage, read-only
                        #   inbox-list.tsx / inbox-row.tsx / inbox-detail.tsx — the Inbox
                        #                queue: fold, selection, keys and optimistic clears;
                        #                one row; the detail pane, the kind table of actions
                        #                and the log-a-touch form
                        #   lead-action-row.tsx — the profile's circular actions, Contacts-style
                        #   lead-contact-card.tsx / lead-facts-card.tsx / lead-deal-card.tsx /
                        #   lead-notes-card.tsx
                        #                — the record as facts, each edited in a bottom sheet
                        #   lead-next-action.tsx — what happens next, on the masthead; the one
                        #                place the gentle invariant is ever said out loud
                        #   lead-touches.tsx / touch-row.tsx — the touch log: history rendered
                        #                on the server, two-tap logging and the cadence's
                        #                prefilled next step in a client sheet over it
                        #   lead-intake.tsx — how they came in, folded shut until asked for
                        #   tickets-board.tsx — Work's board, its client root: read once,
                        #                master–detail, selection resolved from the URL
                        #                (use-board-params.ts owns it; board-model.ts resolves it)
                        #   board-pane.tsx / board-views.tsx — the pane from `lg`, the pushed
                        #                view below it, and what it shows
                        #   batch-row.tsx / board-ticket-row.tsx / ticket-detail.tsx
                        #                — the list's two levels, and a ticket opened
                        #   board-refresh.tsx — the board's refresh button, "as of" stamp and
                        #                quiet re-read on return
                        #   pull-to-refresh.tsx — pull down from the top to re-read everything
                        #   client-create-form.tsx — add a lead or a customer by hand
                        #   deal-badges.tsx — barter / equity / commission / started, on the row
                        #   work-started-button.tsx — one-tap "the work has begun"
lib/                    # auth, formatting, stripe client, money, percent, finance reads, github, tickets
                        #   launchers/ — the session-link registry: one file per tool, index.ts orders them
                        #   leads.ts — the staleness threshold and the row labels the feed and
                        #              the Leads list both read a lead by
                        #   inbox.ts — the follow-up rule, the caps, the queue's read and the
                        #              badge count; inbox-row.ts — the row as the browser gets it
                        #   touches.ts / lead-facts.ts — the model's closed vocabularies,
                        #              mirrored for the browser so a sheet needn't ship the
                        #              Neon driver to read a label
                        #   haptics.ts — the one tick, and the rule for when it fires
public/                 # icon.png (favicon), the installed PNG icons, sw.js (service
                        #   worker), offline.html (offline fallback)
```

## Local development

```bash
cp .env.example .env.local   # DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, STRIPE_SECRET_KEY (test)
pnpm --filter @jamie-nisbet/admin dev
```

Requires the `biz` schema to exist — run the migration in
[`packages/services`](../../packages/services/) first (`pnpm --filter @jamie-nisbet/services db:migrate`).

## Deploy

Import as a new Vercel project, attach the **same** Neon integration as the other sites (for
`DATABASE_URL`), and set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `STRIPE_SECRET_KEY` (the
and optionally `GITHUB_TOKEN` for the delivery-repo
connect/create and the Work board (plus `GITHUB_REPO_OWNER` to home new client repos under a
specific user/org). Set `PORTFOLIO_BASE_URL` to the portfolio's origin so the Forms card builds
customer links against the right host. `AI_GATEWAY_API_KEY` turns on the draft panel and
*Read their website* — set a small monthly budget on the Gateway in the Vercel dashboard as the
spend tripwire; without the key both degrade to a "not set up" note and nothing else changes.
Consumes the shared packages as source (`transpilePackages` in [`next.config.ts`](next.config.ts)).
