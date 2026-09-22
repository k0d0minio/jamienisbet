import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, CircleCheck, TriangleAlert } from "lucide-react"

import {
  GlanceFigure,
  GlanceRow,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  SegmentedControl,
  SegmentedItem,
  cn,
} from "@jamie-nisbet/ui"
import {
  IDLE_AFTER_DAYS,
  clientStatusLabel,
  customerStatuses,
  dealTermsOf,
  listClients,
  nurtureStatuses,
  openStatuses,
  type Client,
} from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { ArchiveChip, ProspectsChip } from "@/components/chip"
import { ClientActions } from "@/components/client-actions"
import { ClientCreateForm } from "@/components/client-create-form"
import { ClientStatusSelect } from "@/components/client-status-select"
import { DealBadges } from "@/components/deal-badges"
import { DealStageChip } from "@/components/deal-stage-chip"
import { LeadRow } from "@/components/lead-row"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  compareProspects,
  daysWaiting,
  dealFigure,
  hasNoPlan,
  isActiveClient,
  isIdleDiscussion,
  isNurtured,
  isOpenLead,
  isPastClient,
  isProspect,
  isStale,
  nextActionLine,
  prospectLabel,
  waitedLabel,
  wakeLine,
  whoLabel,
} from "@/lib/leads"
import { dealStages } from "@/lib/deals"
import { formatMoney } from "@/lib/money"

export const metadata: Metadata = { title: "Leads" }
// No `dynamic = "force-dynamic"` here any more (2026-09-22). Awaiting
// `searchParams` already makes this request-time, and the export cost the deal
// folder reads their cache: force-dynamic sets `fetchCache: "force-no-store"`
// across the segment, which overrides the 60-second revalidate on every
// GitHub read in `lib/deals.ts` — see the header of `lib/tickets.ts` for how
// that once 403'd the board. Neon is read through drizzle, not fetch, and is
// live either way.

// Every lead and client in a single inset grouped list, longest-waiting first
// (the sort is done in the query).
//
// One codepath from phone to laptop. The screen's name sets large and hands off
// to the compact bar on scroll; under it, what the list adds up to is a glance
// row of mono figures rather than a sentence; under that, a segmented control
// of the four filters. Then the rows: each is a single big tap target into the
// lead, carrying only what you scan for (how long they've waited, who they are,
// what it's worth) with the two things worth doing without opening them — mark
// touched, reach them — riding behind it as gestures.
//
// The desktop table is gone. From `md` the same rows simply grow: more room,
// and the two controls a pointer has the width for — the status as a menu
// changed in place, archive and delete as icons — sitting in the row itself.
// Nothing there is revealed by hover; a control you can only find with a mouse
// is a control half the surfaces here can't reach.
//
// It is no longer the app's home: `/` is the Needs you feed, and this screen is
// the roster you come to when you want everyone rather than what is owed today.
// The working-list strip that used to sit above the list went with that move —
// todos and compliance dates are attention, and attention lives on the feed.

// Two views of one screen, and the cold pool is the reason there are two.
//
// The ladder grew a `prospect` rung and a parked `nurture` rung for imported
// businesses that have never engaged, and eighty-five of them arrive in one
// batch. They are not a slice of the roster — they are a different population:
// sorted on their fit tier rather than on who has waited longest, carrying none
// of the money the glance row adds up, and owed a reply by nobody. Filing them
// under "All" would leave the roster mostly strangers and make the word "All"
// a promise the screen can't keep.
//
// So they get their own view of the same screen, switched from the title bar
// beside the archive — where a control that changes what a list *is* belongs —
// and both views keep the same shape: a closed set of filter segments that
// partitions whatever population is on screen.
type ViewKey = "leads" | "prospects"

// The filters across the top of the roster. Each is a set of statuses; "all"
// means no filter. With seven rungs the named chips are still a clean partition
// of the five this view holds — "Open" is lead + discussing, "Clients" is
// active + past (the past rows are muted in the list rather than given a fifth
// segment), "Not won" is its own terminal — so their counts add up to All
// rather than overlapping.
//
// Four, and never more: a closed set is what a segmented control is for. The
// cold pool did not become the fifth segment for exactly that reason; it became
// the other view instead, with its own three.
const LEAD_FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "open", label: "Open", statuses: openStatuses },
  { key: "customers", label: "Clients", statuses: customerStatuses },
  { key: "lost", label: "Not won", statuses: ["not_won"] },
] as const

// The same control over the pool: everything, the ones the cadence is running
// on, and the ones parked waiting for a date. Two rungs, so three segments, and
// the arithmetic adds up the same way.
const PROSPECT_FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "working", label: "Working", statuses: ["prospect"] },
  { key: "parked", label: "Nurture", statuses: nurtureStatuses },
] as const

// The third way this screen is looked at, and the one nobody navigates to: the
// two cracks the Needs you feed reports as counts.
//
// A crack is not a filter and could not have been one. The segments partition a
// population by status — a closed set that adds up to "All" — and neither of
// these does: "nothing planned" spans the cold pool *and* the ladder proper, so
// no single view holds it, and both are questions about a column rather than
// about a rung. So a crack replaces the partition instead of joining it: the
// segmented control stands down, the screen takes the crack's own name, and
// what it lists is exactly the set the feed counted. That is the contract those
// two rows depend on — a number that opens onto a different number is worse
// than no number at all.
type CrackKey = "unplanned" | "idle"

type Crack = {
  /** The screen's name while this crack is on it. */
  title: string
  /** One line under the title: what these rows have in common. */
  blurb: string
  /** What it says when the crack has closed — a designed state, since a
   *  closed crack is the whole point of naming it. */
  empty: string
  /** The row-level twin of the crack-finder's `where`, from lib/leads. */
  matches: (row: Client, now: number) => boolean
  /** Re-sort on fit tier, the way the crack-finder hands the rows over.
   *  False leaves the read's own order — longest-quiet first. */
  sorted: boolean
}

const CRACKS: Record<CrackKey, Crack> = {
  unplanned: {
    title: "Nothing planned",
    blurb:
      "Being worked, with no next step — or one nobody dated, which never reaches the queue.",
    empty:
      "Everything being worked carries a next step and a date. Nothing has fallen through.",
    matches: (row) => hasNoPlan(row),
    // Mostly prospects, and a pool is worked best-fit first.
    sorted: true,
  },
  idle: {
    title: "Gone quiet",
    blurb: `In discussion, and nothing has happened in ${IDLE_AFTER_DAYS} days.`,
    empty: "Every live conversation has moved in the last fortnight.",
    matches: (row, now) => isIdleDiscussion(row, now),
    sorted: false,
  },
}

function isCrackKey(value: string | undefined): value is CrackKey {
  return value === "unplanned" || value === "idle"
}

type Filter = {
  key: string
  label: string
  statuses: readonly string[] | null
}

type FilterKey =
  | (typeof LEAD_FILTERS)[number]["key"]
  | (typeof PROSPECT_FILTERS)[number]["key"]

function filtersFor(view: ViewKey): readonly Filter[] {
  return view === "prospects" ? PROSPECT_FILTERS : LEAD_FILTERS
}

function isFilterKey(
  value: string | undefined,
  filters: readonly Filter[]
): value is FilterKey {
  return filters.some((f) => f.key === value)
}

// The figures worth knowing at a glance: what cash is still in play, what comes
// in every month, and what is being traded rather than invoiced. All are Jamie's
// own numbers off the profiles — Stripe is the authority on what has actually
// been invoiced and paid.
//
// Only live relationships count: open (lead + discussing) for the pipeline,
// active for the monthly and in-kind figures. A past client's engagement — and
// retainer — is over, so they fall out of all three without leaving the list.
// A prospect is in neither set, so the cold pool contributes nothing here by
// construction rather than by being filtered out first — which is the point of
// keeping it out of `openStatuses`: an imported business is not pipeline, and
// eighty-five of them would put a six-figure fiction in the masthead.
//
// Barter is kept out of the first two on purpose. A swap can be worth real money
// and still put nothing in the bank, so folding it into "in play" would quietly
// overstate the pipeline; it gets its own "in kind" figure instead.
//
// These are cash-only, and stay that way now a deal can be made of components.
// A stake and a cut are both real terms and neither is a euro: 12% of a company
// is not €12,000 until someone buys it, and a commission is a share of revenue
// that hasn't happened yet. Adding a guess for either would put a number in the
// masthead that nothing could reconcile — so equity and commission are read on
// the rows, where they say what they are, and never folded into a total.
function totals(rows: Client[]) {
  let pipeline = 0
  let monthly = 0
  let inKind = 0
  for (const row of rows) {
    const open = isOpenLead(row)
    const active = isActiveClient(row)
    if (!open && !active) continue

    // Cash and barter are the two readings of one figure, so a row is only ever
    // in one of these — the model decides which, not the column. Equity and
    // commission come back on the same map and are deliberately ignored here.
    const { cash, barter } = dealTermsOf(row)
    if (barter) {
      inKind += barter.valueMinor
      continue
    }
    if (!cash) continue

    if (cash.billingType === "monthly") {
      if (active) monthly += cash.valueMinor
    } else if (open) {
      pipeline += cash.valueMinor
    }
  }
  // The support line beside a one-off ("one-off + support") is recurring
  // revenue too, once the engagement is on — counted here, not as pipeline.
  for (const row of rows) {
    if (isActiveClient(row) && row.dealType !== "barter" && row.supportMinor > 0) {
      monthly += row.supportMinor
    }
  }
  return { pipeline, monthly, inKind }
}

// Everything the page reads, gathered outside the component so the render stays
// pure — `now` is sampled once here rather than during render, and a DB error
// degrades into a banner instead of an empty page.
async function loadLeads(archived: boolean) {
  const now = Date.now()
  try {
    return { now, rows: await listClients({ archived }), error: null }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : "Could not reach the database."
    return { now, rows: [] as Client[], error }
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    archived?: string
    filter?: string
    view?: string
    crack?: string
  }>
}) {
  const params = await searchParams
  const crack = isCrackKey(params.crack) ? CRACKS[params.crack] : null
  // A crack view takes the whole screen: the archive and the pool are both
  // views of the roster, and a crack is a question asked of what is live.
  // Every crack-finder query excludes archived rows, so honouring `archived`
  // here would list rows the count that sent you never included.
  const archived = crack === null && params.archived === "1"
  const view: ViewKey =
    crack === null && params.view === "prospects" ? "prospects" : "leads"
  const cold = crack === null && view === "prospects"
  const filters = filtersFor(view)
  const filterKey: FilterKey = isFilterKey(params.filter, filters)
    ? params.filter
    : "all"

  const { now, rows, error } = await loadLeads(archived)
  // Where each deal folder stands, for the rows that name one — one tree read
  // of icm-board plus one DEAL.md per slug, cached a minute (lib/deals.ts).
  const stages = await dealStages(rows.map((row) => row.dealSlug))

  // One read, split in two: the cold pool on one side, everything that is an
  // actual relationship on the other. Only the side this view is about is ever
  // counted, filtered or rendered — which is what keeps "All" honest on both.
  // A crack cuts across that split instead of respecting it, which is exactly
  // why it can't be a segment: it is asked of everyone being worked.
  const population = crack
    ? rows.filter((row) => crack.matches(row, now))
    : rows.filter((row) => isProspect(row) === cold)
  // The query hands rows over longest-waiting first, which says nothing about a
  // prospect. Re-sorted on the thing that does: tier, then the parked ones
  // last. `sort` is stable, so ties keep the query's order underneath.
  if (cold || crack?.sorted) population.sort(compareProspects)

  const filter = filters.find((f) => f.key === filterKey)!
  // The segments don't partition a crack, so they don't get to narrow one
  // either — what the feed counted is what this screen lists.
  const visible = crack
    ? population
    : filter.statuses
      ? population.filter((r) => filter.statuses!.includes(r.status))
      : population
  const { pipeline, monthly, inKind } = totals(rows)

  // Counts sit on the filter segments so the shape of the list is readable
  // without clicking through each one.
  const countFor = (key: string): number => {
    const f = filters.find((x) => x.key === key)!
    if (!f.statuses) return population.length
    return population.filter((r) => f.statuses!.includes(r.status)).length
  }

  const hrefFor = (
    key: string,
    to: { archived: boolean; view: ViewKey }
  ): string => {
    const parts: string[] = []
    if (to.view === "prospects") parts.push("view=prospects")
    if (to.archived) parts.push("archived=1")
    if (key !== "all") parts.push(`filter=${key}`)
    return parts.length > 0 ? `/leads?${parts.join("&")}` : "/leads"
  }

  // Only the totals the list actually has. A figure of nothing is noise, not
  // news — and the row would rather hold two figures well than three badly.
  // The pool has no figures at all: nothing in it is worth anything yet, and a
  // row of three zeros would say the opposite of that.
  const figures = cold
    ? []
    : [
        { amount: pipeline, label: "In play" },
        { amount: monthly, label: "Per month" },
        { amount: inKind, label: "In kind" },
      ].filter((f) => f.amount > 0)

  return (
    // The archive and the cold pool are both different views of the same
    // screen, so they say so in the title: the switches that got you here are
    // icons on the bar, and an icon alone is a poor answer to "what am I
    // looking at".
    <AppScreen
      title={
        crack
          ? crack.title
          : archived
            ? cold
              ? "Archived prospects"
              : "Archived"
            : cold
              ? "Prospects"
              : "Leads"
      }
      masthead={
        !crack && figures.length > 0 ? (
          <GlanceRow>
            {figures.map((figure) => (
              <GlanceFigure
                key={figure.label}
                value={formatMoney(figure.amount, "eur")}
                label={figure.label}
              />
            ))}
          </GlanceRow>
        ) : undefined
      }
      actions={
        // A crack view carries no switches. Neither the archive nor the pool is
        // a thing you can be in *and* be looking at a crack, and a `+` on a
        // screen whose whole subject is rows that already exist is a control
        // with nothing to do.
        crack ? undefined : (
        <>
          {/* Switching population resets the filter to All: the two views name
              their segments differently, and carrying "lost" into the pool
              would land on a filter that doesn't exist there. */}
          <ProspectsChip
            href={hrefFor("all", {
              archived,
              view: cold ? "leads" : "prospects",
            })}
            prospects={cold}
          />
          <ArchiveChip
            href={hrefFor(filterKey, { archived: !archived, view })}
            archived={archived}
          />
          {/* Renders the bar `+` here and, on a phone, the floating button.
              Not in the pool: a prospect is imported in a batch, never typed
              in one at a time, so the form has nothing to offer that view. */}
          {!archived && !cold ? <ClientCreateForm /> : null}
        </>
        )
      }
    >
      <div className="flex flex-col gap-4 pt-1 sm:gap-5">
        {/* The filters as one closed control: they partition the list, so they
            belong in a single track rather than a rail of separate chips you
            could read as independent toggles. A crack isn't part of that
            partition, so it replaces the control with a sentence saying what
            is on screen and the way back to the roster. */}
        {crack ? (
          <p className="px-app-gutter text-app-footnote text-app-label-3">
            {crack.blurb}{" "}
            <Link
              href="/leads"
              className="text-app-tint underline underline-offset-2"
            >
              Back to Leads
            </Link>
            .
          </p>
        ) : (
          <SegmentedControl
            aria-label={cold ? "Filter prospects" : "Filter leads"}
          >
            {filters.map((f) => (
              <SegmentedItem
                key={f.key}
                asChild
                active={f.key === filterKey}
                label={f.label}
                count={countFor(f.key)}
              >
                {/* A plain <Link>: changing the filter re-renders this same
                    screen, so there are no two pages to cross-fade between. */}
                <Link href={hrefFor(f.key, { archived, view })} />
              </SegmentedItem>
            ))}
          </SegmentedControl>
        )}

        {/* The read failed. Say so in a group of its own, in plain words, and
            leave the rest of the screen standing. */}
        {error ? (
          <GroupedSection>
            <GroupedRow
              icon={<TriangleAlert />}
              label="Database unavailable"
              variant="destructive"
              chevron={false}
            />
            <GroupedBlock>{error}</GroupedBlock>
          </GroupedSection>
        ) : null}

        {visible.length === 0 ? (
          crack ? (
            // A crack that has closed. Its own words rather than the roster's
            // empty state, because "no leads here" would be a lie about a
            // screen whose subject is a gap: the leads exist, the gap doesn't.
            <GroupedSection>
              <GroupedRow
                icon={<CircleCheck />}
                label="Nothing to fix"
                description={crack.empty}
                chevron={false}
              />
            </GroupedSection>
          ) : (
            <EmptyLeads
              archived={archived}
              cold={cold}
              filtered={population.length > 0}
              allHref={hrefFor("all", { archived, view })}
            />
          )
        ) : (
          <GroupedSection>
            <ul>
              {visible.map((row, index) => {
                const stale = isStale(row, now)
                // Which population *this row* is from. The two ordinary views
                // are already split by exactly this, so it changes nothing
                // there; a crack view is the one screen that holds both, and a
                // prospect showing a deal figure it can't have would be the
                // first thing to go wrong on it.
                const rowCold = isProspect(row)
                // The two rows that read muted, one per population: a client
                // whose engagement is over, and a prospect parked on a wake
                // date. Same idiom, same reason — still on the list, no longer
                // live.
                const quiet = rowCold ? isNurtured(row) : isPastClient(row)
                const figure = rowCold ? null : dealFigure(row)
                const open = isOpenLead(row)
                const who = whoLabel(row)
                // What happens next takes the row's leading line whenever
                // there is one — the epic's whole doctrine in one substitution:
                // a row should say what to *do*, and only fall back to what it
                // *is* when nobody has decided. A parked row's plan is its
                // wake date.
                const next = nextActionLine(row, now)
                const wake = wakeLine(row)
                // Which line raises its voice. A slipped date is a fact about
                // the plan; staleness is only the fallback line's own alarm,
                // so the two never fight over the same row.
                const alarm = next ? next.overdue : stale
                return (
                  <li key={row.id}>
                    <LeadRow
                      id={row.id}
                      name={row.name}
                      // The swipe tray's WhatsApp action. A prospect can carry
                      // its own click-to-chat number; everyone else falls back
                      // to the one phone number they have.
                      phone={row.whatsapp ?? row.phone}
                      email={row.email}
                      archived={archived}
                    >
                      {/* One row, one fill, one hairline. The fill is what
                          hides the swipe tray behind it; the hairline is inset
                          to the label column the way a native list insets it,
                          and rides *inside* the moving content so it travels
                          with the row rather than cutting across the tray. */}
                      <div
                        className={cn(
                          "relative flex items-center gap-3 bg-app-group px-4 py-2.5",
                          "transition-colors spring-press has-[a:active]:bg-app-press",
                          // Wider row from `md`: the same row, more air, the
                          // way an iPad grows a phone list.
                          "md:gap-4 md:px-5 md:py-3.5",
                          index > 0 &&
                            "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"
                        )}
                      >
                        {/* Into the profile and back is the move this screen
                            makes most; on a browser that supports it the two
                            pages cross-fade instead of hard-cutting. The link
                            stretches over the whole row — everything else in
                            it is a real control and sits above. */}
                        <ViewTransitionLink
                          href={`/leads/${row.id}`}
                          className="flex min-w-0 flex-1 flex-col gap-0.5 after:absolute after:inset-0"
                        >
                          <span className="flex items-baseline justify-between gap-3">
                            <span
                              className={cn(
                                "truncate text-app-body font-semibold",
                                // A past client's engagement is over, and a
                                // nurtured prospect is parked: the name reads
                                // muted the way a completed todo does, so the
                                // distinction shows without a segment of its
                                // own.
                                quiet ? "text-app-label-2" : "text-app-label"
                              )}
                            >
                              {row.name}
                            </span>
                            {/* A figure, so it sets in mono — the brand's
                                signature, on every tier. Muted with the name
                                on a past client, whose retainer is over. Euros
                                when the deal has any; otherwise the stake or
                                the cut, which is the whole deal on a row that
                                used to show nothing here. Nothing captions it,
                                so it carries its own word. */}
                            {figure ? (
                              <span
                                className={cn(
                                  "shrink-0 font-mono text-app-subhead font-semibold tabular-nums",
                                  quiet ? "text-app-label-2" : "text-app-label"
                                )}
                              >
                                {figure.standalone}
                              </span>
                            ) : null}
                            {/* The pool has no money to show, so the same slot
                                carries the thing it *is* sorted on: the fit
                                tier, a single letter in mono. Untiered rows
                                leave it empty rather than inventing a grade —
                                they sit at the end of the list, which is the
                                whole of what "nobody has graded this" means.
                                The letter alone reads as a code on screen and
                                is spoken in full. */}
                            {rowCold && row.fitTier ? (
                              <span
                                className={cn(
                                  "shrink-0 font-mono text-app-subhead font-semibold tabular-nums",
                                  quiet ? "text-app-label-2" : "text-app-label"
                                )}
                              >
                                <span aria-hidden>{row.fitTier}</span>
                                <span className="sr-only">
                                  Tier {row.fitTier}
                                </span>
                              </span>
                            ) : null}
                          </span>

                          <span className="flex items-baseline justify-between gap-3 text-app-footnote">
                            {/* The line, in the order the row can answer it:
                                what happens next if anything does, then the
                                date a parked row wakes on, then — for a
                                prospect nobody has planned — what they *are*,
                                since sector and town are the two facts you
                                scan a cold list by and "waiting 12 days" was
                                never true about an imported business. Everyone
                                else falls back to how long they have waited,
                                which is what this list has always sorted on. */}
                            <span
                              className={cn(
                                "truncate",
                                alarm
                                  ? "font-medium text-destructive"
                                  : "text-app-label-3"
                              )}
                            >
                              {next ? (
                                next.text
                              ) : wake ? (
                                wake
                              ) : rowCold ? (
                                (prospectLabel(row) ?? "")
                              ) : (
                                <>
                                  {waitedLabel(daysWaiting(row, now), open)}
                                  {who ? ` · ${who}` : ""}
                                </>
                              )}
                            </span>
                            {/* The status is read here and changed on the
                                lead's page — or, from `md`, in the menu on the
                                right of this row. The word comes from the one
                                label lookup, never from capitalising the stored
                                string. */}
                            <span className="shrink-0 text-app-label-3 md:hidden">
                              {clientStatusLabel(row.status)}
                            </span>
                          </span>

                          {/* Barter, commission, equity, started — only the
                              rows that carry them grow a third line, and never
                              the term the figure above already named. A
                              prospect has no deal to badge. */}
                          {rowCold ? null : (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {/* Where the deal folder says the engagement
                                  stands — read from icm-board, beside the
                                  rung this row carries (D24). */}
                              {(() => {
                                const stage = row.dealSlug ? stages.get(row.dealSlug) : undefined
                                return stage ? <DealStageChip stage={stage} /> : null
                              })()}
                              <DealBadges client={row} omit={figure?.kind} />
                            </div>
                          )}
                        </ViewTransitionLink>

                        {/* The width a pointer has, spent on the two things
                            the old table's last two columns did. Always
                            rendered, never hover-revealed. */}
                        <div className="relative z-10 hidden shrink-0 items-center gap-1 md:flex">
                          <ClientStatusSelect id={row.id} value={row.status} />
                          <ClientActions id={row.id} archived={archived} />
                        </div>

                        <ChevronRight
                          aria-hidden
                          className="size-4 shrink-0 text-app-label-3"
                        />
                      </div>
                    </LeadRow>
                  </li>
                )
              })}
            </ul>
          </GroupedSection>
        )}
      </div>
    </AppScreen>
  )
}

// A quiet day should look calm, not broken: centred words on the canvas rather
// than an empty slab, which reads as a card that failed to load. Four things
// can be empty here and they are not the same thing — an archive nobody has put
// anything in, a filter that happens to match nothing, a dashboard on its first
// day, and a cold pool nothing has been imported into yet — so each says what
// it is and, where there is one, what to do.
function EmptyLeads({
  archived,
  cold,
  filtered,
  allHref,
}: {
  archived: boolean
  /** The cold pool, not the roster — a different absence and a different fix. */
  cold: boolean
  /** There are rows behind the current filter — this view is empty, not the list. */
  filtered: boolean
  allHref: string
}) {
  const noun = cold ? "prospect" : "lead"
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
      <p className="text-app-callout font-medium text-app-label-2">
        {filtered
          ? "Nothing under this filter"
          : archived
            ? "Nothing archived"
            : cold
              ? "No prospects yet"
              : "No leads yet"}
      </p>
      <p className="max-w-xs text-app-footnote text-app-label-3">
        {filtered ? (
          <>
            Every other {noun} is still there —{" "}
            <Link
              href={allHref}
              className="text-app-tint underline underline-offset-2"
            >
              show all
            </Link>
            .
          </>
        ) : archived ? (
          `A ${noun} you archive is taken off the list and kept here.`
        ) : cold ? (
          "The cold pool arrives by import, in a batch, rather than one business at a time."
        ) : (
          "Add the first one with the plus button — everything else can be filled in on their profile."
        )}
      </p>
    </div>
  )
}
