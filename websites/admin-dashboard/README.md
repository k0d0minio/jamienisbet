# admin-dashboard (`@jamie-nisbet/admin`) — "Consultancy JN"

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** Somewhere to track leads and customers, and to get paid. Nothing else.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** intakes,
the admin is where each becomes a lead that gets worked.

It is **mobile-first and installable** — branded **Consultancy JN**, it ships a web app
manifest, icons, and a service worker so it can be added to a phone home screen and launched
fullscreen like a native app (see [Mobile & PWA](#mobile--pwa)).

**Four screens.** That is the whole app, and it is deliberate — see
[Deliberately not here](#deliberately-not-here).

| Screen | Route | What it is |
|---|---|---|
| **Needs you** | `/` | The triaged feed: what is waiting on you right now, in four sections. Home. |
| **Leads** | `/leads` | Every lead and customer in one list, longest-waiting first; the cold pool is a view of it (`?view=prospects`). |
| **Lead** | `/leads/<id>` | One person's profile: contact, value, notes, forms, repo, Stripe link, todos. |
| **Tickets** | `/tickets` | Every repo's `.icm/intake/` backlog in one read-only board. |
| **Money** | `/money` | Stripe: balance, invoices, payment links, recent payments. |

The tab bar and the desktop sidebar carry those four in that order, Needs you
first. The leads list used to be home; a `/?filter=…` or `/?archived=1` bookmark
from then is redirected to the same view on `/leads`, and a bare `/` opens the
feed.

## Needs you — the screen the app opens on

The only question you have at 8am is *what needs me*, and a roster of everyone
does not answer it. So home is a feed: one prioritised list, four sections, and
nothing in it that does not want something. A section renders only when it has
rows.

- **Waiting on you** — open leads past the staleness threshold (7 days with no
  touch, the same constant the Leads list flags on, shared in
  [`lib/leads.ts`](lib/leads.ts)), longest first. These rows wear the Leads
  list's gestures: **swipe right** marks them worked — which is precisely the
  stroke that drops them out of the section — **swipe left** reaches them, and a
  tap opens the profile.
- **Overdue** — todos that have come due, ticked in place; and compliance dates
  past or inside a two-week horizon, marked done on a button beside the row
  rather than by tapping it (completing a recurring obligation re-arms the next
  occurrence, which is too much to hang off a mis-tap while scrolling).
  Compliance rows stay **decision-support only** — the section says so under
  them. A todo with no due date is filed rather than owed: it lives on its
  lead's profile and is counted, not listed, in the section's footer.
- **Money** — the two kinds of invoice waiting on a decision: a draft nobody
  finalized, and an open one past its due date, longest overdue first
  (`listInvoicesNeedingAction` in [`lib/finance.ts`](lib/finance.ts)). The rows
  **deep-link into Money** and nothing else: per the standing *no outbound
  action without review* rule, finalizing and emailing stays a deliberate click
  there.
- **Today's tickets** — the board's now-strip (today's picks, runs in flight,
  blocked stubs), each row deep-linking into Tickets filtered to its repo.

**The rule that shapes every row:** a row either **acts in place** or
**deep-links**. Nothing in the feed edits something that has a proper home
elsewhere — marking a lead touched and ticking a todo happen under the thumb
because there is nowhere better to send you; an invoice or a ticket is a link.

**Writing a todo down** is the one thing here that makes something, so it is a
`+` on the title bar (`components/add-todo.tsx`): a sheet with the title, an
optional date and an optional lead. The Overdue section's header would have hidden
it on exactly the day you have nothing overdue and want to write something down.
A todo about someone in particular is still added from their profile.

**Empty is the point.** With nothing in any section the screen shows a designed
**all clear** rather than a blank — the app opening on "nothing needs you" is a
good day, not a broken screen.

**Degradation is per section.** A missing `STRIPE_SECRET_KEY` or `GITHUB_TOKEN`
drops its section and leaves one footnote line at the foot of the feed saying
what is not being read; the same for a source that errors. A key that is missing
is a fact about the deployment, not a thing that needs you, so it never takes a
section's worth of the fold. Neon is the exception: it is the app's spine, two of
the four sections depend on it, and it fails into a stated banner. The all-clear
state knows when it is only as complete as what it could see, and says so.

## Leads

One row per person. A portfolio contact enquiry, a sellers-site referral, and someone met at a
meetup are all the same kind of record; `source` is the only thing that tells them apart. There
is no second table for opportunities — a lead who comes back for more work is still the same
relationship, and what was actually billed lives in Stripe.

- **Sorted by who has waited longest.** The list orders on
  `coalesce(last_touched_at, created_at)` ascending, so the page opens on the work rather than
  on the newest arrival. Anything open and untouched for 7+ days is flagged in red. Changing a
  status, editing a profile, or hitting **Mark touched** all stamp the row and drop it back down
  the list.
- **Filters** — All / Open / Clients / Not won, each with a count, in one segmented control:
  they partition the list, so they belong in a single track rather than a rail of chips you
  could read as independent toggles. From `md` up, status becomes a pull-down menu on the row
  itself ([`components/client-status-select.tsx`](components/client-status-select.tsx)),
  changed in place — the desktop half of "one design that grows".
- **Two views, switched from the title bar.** **Archived** and **Prospects** are both switches
  beside the page title rather than more chips, because each changes what you are looking at
  rather than filtering it. The prospects view holds the cold pool — imported businesses on the
  `prospect` and `nurture` rungs — sorted on their **fit tier** (A/B/C, in mono where a deal's
  figure sits, untiered rows last) with the parked ones muted and last, its rows carrying
  *sector · town* in place of a waiting line nobody is waiting on, and its own three segments
  (All / Working / Nurture). Nothing in it is open, stale, or in a money total, and the `+` is
  not offered there: the pool arrives by import, in a batch, not one business at a time.
- **A row is two lines and its actions are gestures.** The whole row opens the lead;
  **swipe left** reveals call / email / archive (restore / delete in the archive view),
  **swipe right** marks them touched in one stroke — the mail-app idiom, built on
  [`components/swipe-row.tsx`](components/swipe-row.tsx). Every gesture has a non-gesture twin
  one tap away, on the lead's own page: the swipe is the shortcut, never the only way in.
  Status reads on the row on a phone and changes on that page — a dropdown per row was most of
  what made the old cards tall.
- **One codepath from phone to laptop.** The wide table is gone: the same inset grouped rows
  simply grow — more room, more of the record on the line — rather than a phone list being
  swapped for a desktop table at `md`.
- **The headline figure** — what a lead is worth, in mono beside the name. A deal is
  [composable](../../packages/services/README.md): cash, a swap,
  equity and commission are independent components and any one of them is a deal, so the figure
  is whichever one leads. Cash shows its euros (`€1,500`, or `€1,500/mo` when `billing_type` is
  monthly); a deal with no cash in it shows its strongest percentage instead — **12% equity**,
  **8.5% comm** — where a euro-shaped model used to leave the row blank. Which component gets
  the slot is `dealHeadline` in the services layer, so the list row and the profile masthead
  can't disagree about it.
- **Deal terms, on the row** — not every engagement is euros invoiced monthly, and none of that
  is legible from a number in a Value column. So a **Deal** column (badges under the name on a
  phone) carries the four things that change how you treat a relationship:
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
  bar on a phone (opening the form as a bottom sheet), an ordinary button beside the heading on
  desktop. The public contact form is one way in, not the only one. Because a lead and a customer
  are the same row, the sheet opens on a **Lead / Customer** choice, which is all that sets
  `status` — `new` or `client`. A lead needs only a name; a customer also gets **Value** and
  **Billed**, so entering one who has been paying since before this dashboard existed doesn't
  leave the recurring-revenue total understated from the moment they're added. The free-text box
  follows the same split: a lead's words are intake (`intake_message`), a customer's are working
  notes (`notes`). The rung between the two — `talking` — and the drop-out `lost` are the
  status dropdown on the row itself. The customer branch also asks **Paid in** (cash or
  services) — and only that, of the deal terms: the rest skews no total by waiting for the
  profile, but a swap filed as cash overstates the pipeline from the moment it is typed.

The **working-list strip** that used to sit above this list — todos and Portuguese compliance
dates folded into a `<details>` — is gone. Todos and compliance dates are attention, and
attention now lives on [Needs you](#needs-you--the-screen-the-app-opens-on).

A lead's own page opens on *them*: the identity masthead (name, company · status, the deal's
headline figure in mono) and, under it, the five things you do from a phone as a row of tinted
discs — call / WhatsApp / email / mark touched / **work started**. Then the record, in **two
segments**:

- **Person** — the record. Status (and when they were last worked), **Contact**, **Facts**,
  **Deal**, the folded **Intake** row, and the **Danger zone**.
- **Work** — the surface you operate. **Touches**, **Notes**, **todos**, **Forms**.

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
puts on the Needs you feed.

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

The Tickets board reads through the same token, so the same rule decides whether a client-hosted
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
  the same roster the Tickets board uses; its folder is `.icm/onboarding/`) — both read over the
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

## Tickets

The estate's engineering backlog in one place, read **batch-first**. Every active repo keeps
its work items as markdown in `.icm/intake/` — the estate-wide standard (canonical spec:
`_system/contracts/TICKETS.md` in the `icm-board` repo) — and [`lib/tickets.ts`](lib/tickets.ts)
reads those folders from each repo's **ticket base branch** via the GitHub API (60-second revalidate, tag-busted by the
board's refresh button) and folds them into `listBoard()`: a **now** group (today's picks from
icm-board's `today.md`, runs in flight from `.icm/runs/`, blocked stubs), then one inset
grouped list per repo — urgency-ordered — whose intake batches are its rows. Each epic folder
is a batch row showing its progress as a mono `N of M` over the thin `Meter` (from the stubs'
`sequence: N of M` lines) and its next stub; the `triage/` one-offs and any unmigrated legacy
tickets ride as **Triage** and **Backlog** pseudo-batches. Tapping a batch opens a detented
sheet (a dialog on desktop) with the stubs in sequence, each expanding to the full rendered
ticket. The screen's name sets large and hands off to the compact bar on scroll, where the
refresh button lives; under it, what the board adds up to is a glance row of mono figures. The
repo roster comes from the database plus every repo the token owns or collaborates on; each
ticket links back to its client. A connected repo the token can't see is named on the board
with the reason, never dropped in silence.

**Which branch a repo is read from** (icm-board decision D38). A repo's ticket state has one
home, its ticket base branch: `uat.branch` where the repo's `.icm/project.json` declares one,
else the default branch. On a UAT repo a run's close-out moves its stub to `_done/` inside a
PR that merges into `uat`, and `main` only sees the move at promotion — reading `main` showed
finished work as open for a whole batch. So the board reads `project.json` from the default
branch once an hour per repo (the discovery clock, like the intake and router probes) and takes
the tree, the runs in flight and every "Open on GitHub" link from that branch. A repo read from
a branch other than its default wears a mono badge with the branch's name on its group header.
A declared branch that isn't there is read from the default branch instead and named under
**Couldn't be read** with that caveat — never silently. A repo with no `project.json`, no `uat`
block, or an empty branch reads exactly as before. icm-board is exempt: it has no UAT branch.

The board is **read-only by design**: a ticket is created, edited, and finished (moved to
`_done/`) inside its repo by the session doing the work — the repo stays the source of truth
and nothing is mirrored into the database. Every button therefore copies a prompt, or opens a
tool with it pre-filled, and a human sends it: **Copy prompt** (with every registered tool in
its menu) / swipe-right on a row or batch, and the maintenance launchers — per-repo *triage the backlog* and
*sweep finished work* (the **Maintenance** row closing each repo's group), per-batch *recut
this batch* (in the batch sheet), and the board-level *estate check* (the `/icm-check` pass on
icm-board, in the group that closes the screen). The triage, sweep and recut prompts end by
telling the session to land its ticket changes as a ticket PR into the repo's ticket base
branch, pointing at the `pr-conventions` skill for the shape (D38); icm-board's still commit
straight to `main`. Rows wear the Leads list's gestures: swipe
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
- **Invoices** (`#invoices` — where the Needs you feed's Money rows land) — every Stripe invoice
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

- **Navigation** ([`components/nav.tsx`](components/nav.tsx)) — four destinations, Needs you
  first: a floating translucent tab bar hovering over the content on phones, and the same four as
  a leading sidebar from `md` up. Each tab is a full 3.5rem target — a quarter of the pill, which
  is why the labels set at the tier's smallest caption and never wrap; content is padded to clear
  the bar and respects the home-indicator safe area.
- **Touch targets and safe areas** ([`app/globals.css`](app/globals.css)) — the design system's
  own controls are sized for a mouse (h-8/h-9), so rather than annotate every call site the
  floor is lifted once under `@media (pointer: coarse)`: every button, input and select trigger
  gets a 44px minimum. Nothing there affects a desktop pointer, and the app tier's own controls
  already set their own floor (`min-h-app-touch` on a grouped row, a 3.5rem tab, a 48px action
  disc). The same file defines the geometry utilities the fixed chrome and the rails use —
  `bottom-tabs`, `bottom-above-tabs`, `pb-tabs`, `no-scrollbar`, and `pt-screen-safe` /
  `pb-screen-safe` for the two screens outside the shell (login and "not here"), which have no
  tab bar to clear but still open under a notch.
- **Appearance follows the system**, with no in-app toggle — the app tier's rule. An inline,
  render-blocking script in [`app/layout.tsx`](app/layout.tsx) mirrors `prefers-color-scheme`
  onto `[data-theme]` before first paint, which is the whole point: a theme resolved in an
  effect is the white flash every dark-mode app is judged by.
- **Materials degrade where the device can't afford them.** The floating chrome and the title
  bar are `backdrop-filter`s over a scrolling list, which is the most expensive thing this tier
  asks of a GPU. Two things turn the blur off, both landing on the same opaque surfaces (see
  [`packages/ui/tokens/app.css`](../../packages/ui/tokens/app.css) § Materials without the
  blur): `prefers-reduced-transparency`, reactively in CSS, and `data-materials="opaque"` —
  stamped by the same pre-paint script when the device reports 4GB or less. A capability check,
  never a setting.
- **Anything hover-only is a bug on a phone.** Row deletes in the todo and compliance lists are
  always visible below `sm` and only fade in on hover from `sm` up.
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
    layout.tsx          # nav chrome (mobile-first spacing + tab-bar clearance)
    error.tsx           # the four screens' error boundary — a read that refused
    page.tsx            # Needs you — the feed; also redirects the old /?filter= leads bookmarks
    loading.tsx         # the feed's layout-true skeleton (the widest read in the app)
    actions.ts          # lead + touch + todo + compliance server actions (every lead screen
                        #   uses these); logTouchAction is the one that answers with what to
                        #   do next
    leads/              # Leads — the list, staleness-sorted; ?view=prospects is the cold
                        #   pool, tier-sorted; loading.tsx alongside
    leads/[id]/         # one lead: Person / Work segments, repo + Stripe glyphs, their todos
                        #   error.tsx — its own boundary, so it can name the record
    tickets/            # Tickets — every repo's .icm/intake/ backlog, read-only, copy-prompt
    money/              # Stripe: balance, invoices, payment links, payments; actions.ts alongside
components/             # login form, nav, service-worker register, lead + money UI
                        #   app-screen.tsx — every screen's masthead: the tier's collapsing
                        #                header, and the profile's identity form of it
                        #   nav.tsx      — the floating tab bar, and its sidebar form from `md`
                        #   app-menu.tsx — the monogram on the bar: what belongs to the app
                        #   chip.tsx     — filter/view chips (finger-sized, rail-friendly)
                        #   swipe-row.tsx — swipe-left action tray / swipe-right commit, per row
                        #   lead-row.tsx — the leads list's gestures (call/email/archive, touched),
                        #                worn by the feed's "Waiting on you" rows too
                        #   lead-action-row.tsx — the profile's circular actions, Contacts-style
                        #   overdue-list.tsx — the feed's Overdue section: todos + compliance,
                        #                both acting in place
                        #   add-todo.tsx — the feed's `+`: write a todo down from anywhere
                        #   lead-contact-card.tsx / lead-facts-card.tsx / lead-deal-card.tsx /
                        #   lead-notes-card.tsx
                        #                — the record as facts, each edited in a bottom sheet
                        #   lead-next-action.tsx — what happens next, on the masthead; the one
                        #                place the gentle invariant is ever said out loud
                        #   lead-touches.tsx / touch-row.tsx — the touch log: history rendered
                        #                on the server, two-tap logging and the cadence's
                        #                prefilled next step in a client sheet over it
                        #   lead-intake.tsx — how they came in, folded shut until asked for
                        #   batch-row.tsx / board-ticket-row.tsx / ticket-detail.tsx
                        #                — the Tickets board, batch-first
                        #   pull-to-refresh.tsx — pull down from the top to re-read everything
                        #   client-create-form.tsx — add a lead or a customer by hand
                        #   deal-badges.tsx — barter / equity / commission / started, on the row
                        #   work-started-button.tsx — one-tap "the work has begun"
lib/                    # auth, formatting, stripe client, money, percent, finance reads, github, tickets
                        #   launchers/ — the session-link registry: one file per tool, index.ts orders them
                        #   leads.ts — the staleness threshold and the row labels the feed and
                        #              the Leads list both read a lead by
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
connect/create and the Tickets board (plus `GITHUB_REPO_OWNER` to home new client repos under a
specific user/org). Set `PORTFOLIO_BASE_URL` to the portfolio's origin so the Forms card builds
customer links against the right host. `AI_GATEWAY_API_KEY` turns on the draft panel and
*Read their website* — set a small monthly budget on the Gateway in the Vercel dashboard as the
spend tripwire; without the key both degrade to a "not set up" note and nothing else changes.
Consumes the shared packages as source (`transpilePackages` in [`next.config.ts`](next.config.ts)).
