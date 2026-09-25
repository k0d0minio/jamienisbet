import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, CircleCheck, TriangleAlert } from "lucide-react"

import {
  DeskButton,
  Pane,
  PaneBody,
  PaneHeader,
  PaneToolbar,
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

import { DeskScreen } from "@/components/desk-screen"
import { ArchiveChip, ProspectsChip } from "@/components/chip"
import { ClientCreateForm } from "@/components/client-create-form"
import { DealBadges } from "@/components/deal-badges"
import { DealBoard } from "@/components/deal-board"
import { DealStageChip } from "@/components/deal-stage-chip"
import { LeadOrderRecorder } from "@/components/lead-order"
import { LeadRow } from "@/components/lead-row"
import {
  LeadsLayoutSwitch,
  LeadsTable,
  type LeadRowView,
} from "@/components/leads-table"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  compareProspects,
  daysWaiting,
  dealFigure,
  dueOf,
  firstDirection,
  hasNoPlan,
  isActiveClient,
  isIdleDiscussion,
  isNurtured,
  isOpenLead,
  isPastClient,
  isProspect,
  isStale,
  leadSortKeys,
  nextActionLine,
  parseLeadSort,
  prospectLabel,
  sortLeads,
  waitedLabel,
  wakeLine,
  whoLabel,
  type LeadSort,
  type LeadSortKey,
} from "@/lib/leads"
import { dealFolderSlug, dealStages, type DealStage } from "@/lib/deals"
import { formatShortDay, waitingLabel, whatsappUrl } from "@/lib/format"
import { formatMoney } from "@/lib/money"

export const metadata: Metadata = { title: "Leads" }
// No `dynamic = "force-dynamic"` here any more (2026-09-22). Awaiting
// `searchParams` already makes this request-time, and the export cost the deal
// folder reads their cache: force-dynamic sets `fetchCache: "force-no-store"`
// across the segment, which overrides the 60-second revalidate on every
// GitHub read in `lib/deals.ts` — see the header of `lib/tickets.ts` for how
// that once 403'd the board. Neon is read through drizzle, not fetch, and is
// live either way.

// Every lead and client, on the desk tier (leads-table-board, 2026-09-25).
//
// Designed at the desk and compressed for the phone (D-1). From `md` — where
// the shell swaps the tab bar for the rail — the screen is one pane across the
// whole content area: a header with the cash totals, the Table / Board switch,
// the two population switches and Add lead; a filter bar; and then either a
// sortable table (D-19) or a read-only board by deal stage. Below `md` it is
// the phone's list of rows with their swipe gestures, under the phone's title
// bar, restyled to the desk tier — the rows a thumb needs, not a table.
//
// One read, one sort, two renderings: the page works out the population, the
// filter, the order and every cell's words once, and hands the desk tree and
// the phone tree the same rows. The URL carries all of it — `view`,
// `archived`, `filter` or `crack`, `layout`, `sort` and `dir` — so a reload or
// a shared link lands on the same screen, and every control here is a link
// that keeps the rest of the state.
//
// It is not the app's home: `/` is Work and `/inbox` the queue, and this
// screen is the roster you come to when you want everyone rather than what is
// owed today.

// Two views of one screen, and the cold pool is the reason there are two.
//
// The ladder grew a `prospect` rung and a parked `nurture` rung for imported
// businesses that have never engaged, and eighty-five of them arrive in one
// batch. They are not a slice of the roster — they are a different population:
// sorted on their fit tier rather than on who has waited longest, carrying none
// of the money the totals line adds up, and owed a reply by nobody. Filing them
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

type Layout = "table" | "board"

/** Everything the URL says about this screen. Every link on it is this with
 *  one thing changed, so no control drops another's choice. */
type LeadsUrl = {
  view: ViewKey
  archived: boolean
  filter: string
  crack: CrackKey | null
  layout: Layout
  sort: LeadSort | null
}

function leadsHref(url: LeadsUrl): string {
  const query = new URLSearchParams()
  // A crack takes the whole screen (below), so it carries none of the
  // population's own state.
  if (url.crack) {
    query.set("crack", url.crack)
  } else {
    if (url.view === "prospects") query.set("view", "prospects")
    if (url.archived) query.set("archived", "1")
    if (url.filter !== "all") query.set("filter", url.filter)
  }
  if (url.layout === "board") query.set("layout", "board")
  if (url.sort) {
    query.set("sort", url.sort.key)
    query.set("dir", url.sort.dir)
  }
  const text = query.toString()
  return text ? `/leads?${text}` : "/leads"
}

/** Two letters for the name's disc, from its first two words. */
function monogramOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/** A lead as the desk's table and board show it — every cell worded here, so
 *  the two can never word the same fact differently. */
function toRowView(
  row: Client,
  now: number,
  stage: DealStage | null
): LeadRowView {
  const cold = isProspect(row)
  const days = daysWaiting(row, now)
  const stale = isStale(row, now)
  const due = dueOf(row)
  const phone = row.whatsapp ?? row.phone
  return {
    id: row.id,
    name: row.name,
    sub: cold ? prospectLabel(row) : whoLabel(row),
    monogram: monogramOf(row.name),
    // Still listed, no longer live: a client whose engagement is over, a lead
    // that went elsewhere, a prospect parked on a wake date.
    muted: cold
      ? isNurtured(row)
      : isPastClient(row) || row.status === "not_won",
    status: clientStatusLabel(row.status),
    stage,
    // A prospect has no deal to be worth anything yet.
    value: cold ? null : (dealFigure(row)?.standalone ?? null),
    next: row.nextAction
      ? { text: row.nextAction, planned: true }
      : hasNoPlan(row)
        ? { text: "Nothing planned", planned: false }
        : null,
    due: due
      ? { text: formatShortDay(due), overdue: due.getTime() < now }
      : null,
    last: {
      text: stale ? `waiting ${waitingLabel(days)}` : waitingLabel(days),
      alarm: stale,
    },
    tier: row.fitTier,
    whatsappUrl: phone ? whatsappUrl(phone) : null,
    email: row.email,
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
    layout?: string
    sort?: string
    dir?: string
  }>
}) {
  const params = await searchParams
  const crackKey = isCrackKey(params.crack) ? params.crack : null
  const crack = crackKey ? CRACKS[crackKey] : null
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
  // The Board is offered on every view (D-31); the phone never shows it.
  const layout: Layout = params.layout === "board" ? "board" : "table"
  const urlSort = parseLeadSort(params.sort, params.dir)

  const { now, rows, error } = await loadLeads(archived)
  // Where each deal folder stands, for the rows with a repo (the folder is
  // named after it, D28) — one tree read of icm-board plus one DEAL.md per
  // folder, cached a minute (lib/deals.ts).
  const { stages, readable } = await dealStages(
    rows.map((row) => dealFolderSlug(row.githubRepo))
  )
  const stageOf = (row: Client): DealStage | null => {
    const slug = dealFolderSlug(row.githubRepo)
    return (slug ? stages.get(slug) : undefined) ?? null
  }

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
  const filtered = crack
    ? population
    : filter.statuses
      ? population.filter((r) => filter.statuses!.includes(r.status))
      : population
  // A header's sort, on top of the view's own order (D-33).
  const visible = urlSort
    ? sortLeads(filtered, urlSort, {
        now,
        stageOf: (row) => stageOf(row)?.code ?? null,
      })
    : filtered
  // The order on screen as a column would name it. With no sort in the URL the
  // roster, the archive and "Gone quiet" are longest-waiting first — Last
  // worked, descending — and the pool and "Nothing planned" are on tier order,
  // which no single column is.
  const shownSort: LeadSort | null =
    urlSort ?? (cold || crack?.sorted ? null : { key: "last", dir: "desc" })

  const { pipeline, monthly, inKind } = totals(rows)

  // Counts sit on the filters so the shape of the list is readable without
  // clicking through each one.
  const countFor = (key: string): number => {
    const f = filters.find((x) => x.key === key)!
    if (!f.statuses) return population.length
    return population.filter((r) => f.statuses!.includes(r.status)).length
  }

  // The two cracks, as filters on the roster (D-18, D-34): once the Inbox
  // stops counting them, this is where they are found. Counted over the
  // non-archived read with the same predicates the crack view lists by, so a
  // count always opens onto that many rows. Only where that read is on screen
  // — the roster and the cracks themselves — never over the archive.
  const showCracks = crack !== null || (!archived && !cold)
  const crackCounts: Record<CrackKey, number> = {
    unplanned: rows.filter((row) => CRACKS.unplanned.matches(row, now)).length,
    idle: rows.filter((row) => CRACKS.idle.matches(row, now)).length,
  }

  const url: LeadsUrl = {
    view,
    archived,
    filter: filterKey,
    crack: crackKey,
    layout,
    sort: urlSort,
  }
  const hrefWith = (change: Partial<LeadsUrl>) => leadsHref({ ...url, ...change })
  // Switching population resets the filter to All: the two views name their
  // segments differently, and carrying "lost" into the pool would land on a
  // filter that doesn't exist there.
  const prospectsHref = hrefWith({
    view: cold ? "leads" : "prospects",
    filter: "all",
  })
  const archiveHref = hrefWith({ archived: !archived })
  const backHref = hrefWith({ crack: null, view: "leads", archived: false, filter: "all" })
  const sortHrefs = Object.fromEntries(
    leadSortKeys.map((key) => [
      key,
      hrefWith({
        sort:
          shownSort?.key === key
            ? { key, dir: shownSort.dir === "asc" ? "desc" : "asc" }
            : { key, dir: firstDirection(key) },
      }),
    ])
  ) as Record<LeadSortKey, string>

  const filterItems: FilterItem[] = [
    ...(crack
      ? []
      : filters.map((f) => ({
          key: f.key,
          label: f.label,
          count: countFor(f.key),
          href: hrefWith({ filter: f.key }),
          active: f.key === filterKey,
        }))),
  ]
  const crackItems: FilterItem[] = showCracks
    ? (Object.keys(CRACKS) as CrackKey[]).map((key) => ({
        key,
        label: CRACKS[key].title,
        count: crackCounts[key],
        href: hrefWith({ crack: key }),
        active: key === crackKey,
      }))
    : []

  // Only the totals the list actually has. A figure of nothing is noise, not
  // news. The pool has no figures at all — nothing in it is worth anything
  // yet — and a crack is a question, not a roster, so neither carries them.
  const figures =
    cold || crack
      ? []
      : [
          { amount: pipeline, label: "in play" },
          { amount: monthly, label: "per month" },
          { amount: inKind, label: "in kind" },
        ].filter((f) => f.amount > 0)
  const totalsLine =
    figures.length > 0 ? (
      <span className="font-mono text-desk-meta text-desk-fg-2">
        {figures.map((figure, index) => (
          <span key={figure.label}>
            {index > 0 ? " · " : null}
            <b className="font-semibold text-desk-fg">
              {formatMoney(figure.amount, "eur")}
            </b>{" "}
            {figure.label}
          </span>
        ))}
      </span>
    ) : null

  // The archive and the cold pool are both different views of the same
  // screen, so they say so in the title.
  const title = crack
    ? crack.title
    : archived
      ? cold
        ? "Archived prospects"
        : "Archived"
      : cold
        ? "Prospects"
        : "Leads"
  // The size of the pool beside its switch — only where the read holds it.
  const poolCount = archived || crack ? null : rows.filter(isProspect).length
  const canAdd = !crack && !archived && !cold

  const blurb = crack ? (
    <>
      {crack.blurb}{" "}
      <Link href={backHref} className="text-desk-fg underline underline-offset-2">
        Back to Leads
      </Link>
      .
    </>
  ) : null

  const errorLine = error ? (
    <p
      role="alert"
      className="flex items-center gap-2 border-b border-desk-line px-4 py-2 text-desk-ui text-desk-blocked md:px-5"
    >
      <TriangleAlert aria-hidden className="size-desk-icon shrink-0" />
      <span className="min-w-0">
        <span className="font-semibold">Database unavailable.</span> {error}
      </span>
    </p>
  ) : null

  const empty =
    visible.length === 0 ? (
      crack ? (
        <ClosedCrack text={crack.empty} />
      ) : (
        <EmptyLeads
          archived={archived}
          cold={cold}
          filtered={population.length > 0}
          allHref={hrefWith({ filter: "all" })}
        />
      )
    ) : null

  const rowViews = visible.map((row) => toRowView(row, now, stageOf(row)))

  return (
    <>
      {/* The order on screen — the table's, and the phone rows' — for j / k
          on a lead's profile (D-24). The board groups these same rows by
          stage; stepping from it follows the table's order underneath. */}
      <LeadOrderRecorder ids={visible.map((row) => row.id)} />

      {/* The desk: one pane across the content area, the whole window high,
          so the table's header sticks and the board's columns scroll inside
          it rather than the page. `-mb-8` takes back the shell's desk
          bottom allowance, which a full-height pane has no use for. */}
      <div className="desk-tier hidden h-dvh flex-col md:-mb-8 md:flex">
        <Pane aria-label={title} className="flex-1">
          <PaneHeader
            titleAs="h1"
            title={title}
            meta={totalsLine}
            actions={
              <>
                <LeadsLayoutSwitch
                  layout={layout}
                  hrefs={{
                    table: hrefWith({ layout: "table" }),
                    board: hrefWith({ layout: "board" }),
                  }}
                />
                {crack ? null : (
                  <>
                    <DeskButton
                      asChild
                      variant="ghost"
                      className={cn(cold && "bg-desk-sunken text-desk-fg")}
                    >
                      <Link
                        href={prospectsHref}
                        aria-current={cold ? "page" : undefined}
                        title={cold ? "Show leads and clients" : "Show prospects"}
                      >
                        Prospects
                        {poolCount !== null ? (
                          <span className="font-mono text-desk-micro text-desk-fg-3 tabular-nums">
                            {poolCount}
                          </span>
                        ) : null}
                      </Link>
                    </DeskButton>
                    <DeskButton
                      asChild
                      variant="ghost"
                      className={cn(archived && "bg-desk-sunken text-desk-fg")}
                    >
                      <Link
                        href={archiveHref}
                        aria-current={archived ? "page" : undefined}
                        title={archived ? "Show active leads" : "Show archived leads"}
                      >
                        Archived
                      </Link>
                    </DeskButton>
                  </>
                )}
                {canAdd ? <ClientCreateForm trigger="desk" /> : null}
              </>
            }
          />
          <PaneToolbar className="gap-3">
            <LeadFilters
              label={cold ? "Filter prospects" : "Filter leads"}
              items={filterItems}
              cracks={crackItems}
            />
            {blurb ? (
              <p className="ml-auto min-w-0 truncate text-desk-meta text-desk-fg-3">
                {blurb}
              </p>
            ) : null}
          </PaneToolbar>
          {errorLine}
          <PaneBody>
            {empty ??
              (layout === "board" ? (
                <DealBoard rows={rowViews} readable={readable} />
              ) : (
                // Keyed to the archive flag: a row restored or deleted from
                // the archive is hidden on the click, and that hiding must not
                // follow the same component instance back into the live view,
                // where the restored lead belongs again.
                <LeadsTable
                  key={archived ? "archive" : "live"}
                  rows={rowViews}
                  sort={shownSort}
                  sortHrefs={sortHrefs}
                  archived={archived}
                />
              ))}
          </PaneBody>
        </Pane>
      </div>

      {/* The phone: the shell's title bar, and under it the rows a thumb
          works — full-bleed, flat, on the desk tier. The layout switch is not
          offered here: a board of nine columns is a desk view. */}
      <div className="md:hidden">
        <DeskScreen
          title={title}
          subtitle={totalsLine ?? undefined}
          actions={
            // A crack view carries no switches. Neither the archive nor the
            // pool is a thing you can be in *and* be looking at a crack, and
            // a `+` on a screen whose whole subject is rows that already
            // exist is a control with nothing to do.
            crack ? undefined : (
              <>
                <ProspectsChip href={prospectsHref} prospects={cold} />
                <ArchiveChip href={archiveHref} archived={archived} />
                {/* The bar `+` and the floating button; not in the pool — a
                    prospect is imported in a batch, never typed in one at a
                    time — nor in the archive. */}
                {canAdd ? <ClientCreateForm /> : null}
              </>
            )
          }
        >
          <div className="desk-tier -mx-4 flex flex-col">
            <div className="flex flex-col gap-1.5 px-4 py-2">
              <LeadFilters
                label={cold ? "Filter prospects" : "Filter leads"}
                items={filterItems}
                cracks={crackItems}
              />
              {blurb ? (
                <p className="text-desk-meta text-desk-fg-3">{blurb}</p>
              ) : null}
            </div>
            {errorLine}
            {empty ?? (
              <ul className="overflow-hidden border-t border-desk-line">
                {visible.map((row) => (
                  <li key={row.id}>
                    <PhoneRow
                      row={row}
                      now={now}
                      stage={stageOf(row)}
                      archived={archived}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DeskScreen>
      </div>
    </>
  )
}

type FilterItem = {
  key: string
  label: string
  count: number
  href: string
  active: boolean
}

// The filters, as links: each one is a different URL of this same screen, so
// a click re-reads nothing it doesn't have to and the choice survives a
// reload. The population's own filters partition the list and their counts
// add up to All; the two cracks sit after a hairline because they don't —
// they are questions asked across it. Sideways-scrolling on a phone, never
// wrapping.
function LeadFilters({
  label,
  items,
  cracks,
}: {
  label: string
  items: FilterItem[]
  cracks: FilterItem[]
}) {
  return (
    <nav
      aria-label={label}
      className="no-scrollbar -mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1"
    >
      {items.map((item) => (
        <FilterLink key={item.key} item={item} />
      ))}
      {items.length > 0 && cracks.length > 0 ? (
        <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-desk-line" />
      ) : null}
      {cracks.map((item) => (
        <FilterLink key={item.key} item={item} />
      ))}
    </nav>
  )
}

function FilterLink({ item }: { item: FilterItem }) {
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "inline-flex h-desk-control shrink-0 items-center gap-1.5 rounded-desk-control px-2.5 text-desk-ui whitespace-nowrap",
        "transition-colors duration-100",
        item.active
          ? "bg-desk-sunken font-semibold text-desk-fg"
          : "font-medium text-desk-fg-2 hover:bg-desk-hover hover:text-desk-fg"
      )}
    >
      {item.label}
      <span className="font-mono text-desk-micro text-desk-fg-3 tabular-nums">
        {item.count}
      </span>
    </Link>
  )
}

// One lead on the phone, wearing the list's gestures (components/lead-row.tsx):
// swipe right marks them touched, swipe left opens WhatsApp / Email / Archive —
// Restore / Delete in the archive — and every one of those has its twin on the
// lead's own page. The whole row is one tap into the lead, carrying only what
// you scan for: who, what it's worth, what happens next, and where they stand.
function PhoneRow({
  row,
  now,
  stage,
  archived,
}: {
  row: Client
  now: number
  stage: DealStage | null
  archived: boolean
}) {
  const stale = isStale(row, now)
  // Which population *this row* is from. A crack view is the one screen that
  // holds both, and a prospect showing a deal figure it can't have would be
  // the first thing to go wrong on it.
  const rowCold = isProspect(row)
  const quiet = rowCold
    ? isNurtured(row)
    : isPastClient(row) || row.status === "not_won"
  const figure = rowCold ? null : dealFigure(row)
  const open = isOpenLead(row)
  const who = whoLabel(row)
  // What happens next takes the leading line whenever there is one: a row
  // should say what to *do*, and only fall back to what it *is* when nobody
  // has decided. A parked row's plan is its wake date.
  const next = nextActionLine(row, now)
  const wake = wakeLine(row)
  // A slipped date is a fact about the plan; staleness is only the fallback
  // line's own alarm, so the two never fight over the same row.
  const alarm = next ? next.overdue : stale

  return (
    <LeadRow
      id={row.id}
      name={row.name}
      // A prospect can carry its own click-to-chat number; everyone else
      // falls back to the one phone number they have.
      phone={row.whatsapp ?? row.phone}
      email={row.email}
      archived={archived}
    >
      {/* One fill, one hairline. The fill hides the swipe tray behind it; the
          hairline rides inside the moving content so it travels with the row
          rather than cutting across the tray. */}
      <div
        className={cn(
          "relative flex min-h-desk-row items-center gap-3 border-b border-desk-line bg-desk-surface px-4 py-2",
          "transition-colors duration-100 has-[a:active]:bg-desk-sunken"
        )}
      >
        {/* Into the profile and back is the move this screen makes most; the
            link stretches over the whole row. */}
        <ViewTransitionLink
          href={`/leads/${row.id}`}
          className="flex min-w-0 flex-1 flex-col gap-0.5 after:absolute after:inset-0"
        >
          <span className="flex items-baseline justify-between gap-3">
            <span
              className={cn(
                "truncate text-desk-ui font-semibold",
                quiet ? "text-desk-fg-3" : "text-desk-fg"
              )}
            >
              {row.name}
            </span>
            {/* A figure, so it sets in mono. The pool has no money to show, so
                the same slot carries what it is sorted on: the fit tier. */}
            {figure ? (
              <span
                className={cn(
                  "shrink-0 font-mono text-desk-meta font-medium tabular-nums",
                  quiet ? "text-desk-fg-3" : "text-desk-fg"
                )}
              >
                {figure.standalone}
              </span>
            ) : rowCold && row.fitTier ? (
              <span
                className={cn(
                  "shrink-0 font-mono text-desk-meta font-medium tabular-nums",
                  quiet ? "text-desk-fg-3" : "text-desk-fg"
                )}
              >
                <span aria-hidden>{row.fitTier}</span>
                <span className="sr-only">Tier {row.fitTier}</span>
              </span>
            ) : null}
          </span>

          <span className="flex items-baseline justify-between gap-3 text-desk-meta">
            <span
              className={cn(
                "truncate",
                alarm ? "font-medium text-desk-blocked" : "text-desk-fg-3"
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
            {/* Read here, changed on the lead's page. */}
            <span className="shrink-0 text-desk-fg-3">
              {clientStatusLabel(row.status)}
            </span>
          </span>

          {/* Where the deal folder says the engagement stands, and the terms
              the figure doesn't already say — only on the rows that have
              them. A prospect has no deal to badge. */}
          {rowCold ? null : (
            <DealLine row={row} stage={stage} omit={figure?.kind} />
          )}
        </ViewTransitionLink>

        <ChevronRight aria-hidden className="size-4 shrink-0 text-desk-fg-3" />
      </div>
    </LeadRow>
  )
}

function DealLine({
  row,
  stage,
  omit,
}: {
  row: Client
  stage: DealStage | null
  omit: Parameters<typeof DealBadges>[0]["omit"]
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
      {stage ? <DealStageChip stage={stage} /> : null}
      <DealBadges client={row} omit={omit} />
    </div>
  )
}

// A crack that has closed. Its own words rather than the roster's empty state,
// because "no leads here" would be a lie about a screen whose subject is a
// gap: the leads exist, the gap doesn't.
function ClosedCrack({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
      <CircleCheck aria-hidden className="size-5 text-desk-done" />
      <p className="text-desk-ui font-semibold text-desk-fg-2">Nothing to fix</p>
      <p className="max-w-xs text-desk-meta text-desk-fg-3">{text}</p>
    </div>
  )
}

// A quiet day should look calm, not broken. Four things can be empty here and
// they are not the same thing — an archive nobody has put anything in, a
// filter that happens to match nothing, a dashboard on its first day, and a
// cold pool nothing has been imported into yet — so each says what it is and,
// where there is one, what to do.
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
      <p className="text-desk-ui font-semibold text-desk-fg-2">
        {filtered
          ? "Nothing under this filter"
          : archived
            ? "Nothing archived"
            : cold
              ? "No prospects yet"
              : "No leads yet"}
      </p>
      <p className="max-w-xs text-desk-meta text-desk-fg-3">
        {filtered ? (
          <>
            Every other {noun} is still there —{" "}
            <Link href={allHref} className="text-desk-fg underline underline-offset-2">
              show all
            </Link>
            .
          </>
        ) : archived ? (
          `A ${noun} you archive is taken off the list and kept here.`
        ) : cold ? (
          "The cold pool arrives by import, in a batch, rather than one business at a time."
        ) : (
          "Add the first one with Add lead — everything else can be filled in on their profile."
        )}
      </p>
    </div>
  )
}
