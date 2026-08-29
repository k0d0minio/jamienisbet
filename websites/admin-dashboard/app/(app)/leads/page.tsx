import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, TriangleAlert } from "lucide-react"

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
  customerStatuses,
  listClients,
  openStatuses,
  type Client,
} from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { ArchiveChip } from "@/components/chip"
import { ClientActions } from "@/components/client-actions"
import { ClientCreateForm } from "@/components/client-create-form"
import { ClientStatusSelect } from "@/components/client-status-select"
import { DealBadges } from "@/components/deal-badges"
import { LeadRow } from "@/components/lead-row"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  daysWaiting,
  isOpenLead,
  isStale,
  valueLabel,
  waitedLabel,
  whoLabel,
} from "@/lib/leads"
import { formatMoney } from "@/lib/money"

export const metadata: Metadata = { title: "Leads" }
export const dynamic = "force-dynamic"

// Every lead and customer in a single inset grouped list, longest-waiting first
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

// The filters across the top. Each is a set of statuses; "all" means no filter.
// With the ladder down to three rungs plus `lost`, the three named chips are a
// clean partition of it — "Open" is new + talking, "Customers" is client — so
// their counts add up to All rather than overlapping.
//
// Four, and never more: a closed set is what a segmented control is for. If a
// fifth rung ever arrives this goes back to being a scrolling rail.
const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "open", label: "Open", statuses: openStatuses },
  { key: "customers", label: "Customers", statuses: customerStatuses },
  { key: "lost", label: "Lost", statuses: ["lost"] },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

function isFilterKey(value: string | undefined): value is FilterKey {
  return FILTERS.some((f) => f.key === value)
}

// The figures worth knowing at a glance: what cash is still in play, what comes
// in every month, and what is being traded rather than invoiced. All are Jamie's
// own numbers off the profiles — Stripe is the authority on what has actually
// been invoiced and paid.
//
// Barter is kept out of the first two on purpose. A swap can be worth real money
// and still put nothing in the bank, so folding it into "in play" would quietly
// overstate the pipeline; it gets its own "in kind" figure instead.
function totals(rows: Client[]) {
  let pipeline = 0
  let monthly = 0
  let inKind = 0
  for (const row of rows) {
    if (row.valueMinor <= 0) continue
    const open = (openStatuses as readonly string[]).includes(row.status)
    const customer = (customerStatuses as readonly string[]).includes(row.status)

    if (row.dealType === "barter") {
      if (open || customer) inKind += row.valueMinor
    } else if (row.billingType === "monthly") {
      if (customer) monthly += row.valueMinor
    } else if (open) {
      pipeline += row.valueMinor
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
  searchParams: Promise<{ archived?: string; filter?: string }>
}) {
  const params = await searchParams
  const archived = params.archived === "1"
  const filterKey: FilterKey = isFilterKey(params.filter) ? params.filter : "all"

  const { now, rows, error } = await loadLeads(archived)

  const filter = FILTERS.find((f) => f.key === filterKey)!
  const visible = filter.statuses
    ? rows.filter((r) => (filter.statuses as readonly string[]).includes(r.status))
    : rows
  const { pipeline, monthly, inKind } = totals(rows)

  // Counts sit on the filter segments so the shape of the pipeline is readable
  // without clicking through each one.
  const countFor = (key: FilterKey): number => {
    const f = FILTERS.find((x) => x.key === key)!
    if (!f.statuses) return rows.length
    return rows.filter((r) => (f.statuses as readonly string[]).includes(r.status))
      .length
  }

  const hrefFor = (key: FilterKey, toArchive: boolean): string => {
    const parts: string[] = []
    if (toArchive) parts.push("archived=1")
    if (key !== "all") parts.push(`filter=${key}`)
    return parts.length > 0 ? `/leads?${parts.join("&")}` : "/leads"
  }

  // Only the totals the list actually has. A figure of nothing is noise, not
  // news — and the row would rather hold two figures well than three badly.
  const figures = [
    { amount: pipeline, label: "In play" },
    { amount: monthly, label: "Per month" },
    { amount: inKind, label: "In kind" },
  ].filter((f) => f.amount > 0)

  return (
    // The archive is a different view of the same screen, so it says so in the
    // title: the switch that got you here is an icon on the bar, and an icon
    // alone is a poor answer to "what am I looking at".
    <AppScreen
      title={archived ? "Archived" : "Leads"}
      masthead={
        figures.length > 0 ? (
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
        <>
          <ArchiveChip href={hrefFor(filterKey, !archived)} archived={archived} />
          {/* Renders the bar `+` here and, on a phone, the floating button. */}
          {!archived ? <ClientCreateForm /> : null}
        </>
      }
    >
      <div className="flex flex-col gap-4 pt-1 sm:gap-5">
        {/* The four filters as one closed control: they partition the list, so
            they belong in a single track rather than a rail of separate chips
            you could read as independent toggles. */}
        <SegmentedControl aria-label="Filter leads">
          {FILTERS.map((f) => (
            <SegmentedItem
              key={f.key}
              asChild
              active={f.key === filterKey}
              label={f.label}
              count={countFor(f.key)}
            >
              {/* A plain <Link>: changing the filter re-renders this same
                  screen, so there are no two pages to cross-fade between. */}
              <Link href={hrefFor(f.key, archived)} />
            </SegmentedItem>
          ))}
        </SegmentedControl>

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
          <EmptyLeads
            archived={archived}
            filtered={rows.length > 0}
            allHref={hrefFor("all", archived)}
          />
        ) : (
          <GroupedSection>
            <ul>
              {visible.map((row, index) => {
                const stale = isStale(row, now)
                const value = valueLabel(row)
                const open = isOpenLead(row)
                const who = whoLabel(row)
                return (
                  <li key={row.id}>
                    <LeadRow
                      id={row.id}
                      name={row.name}
                      phone={row.phone}
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
                            <span className="truncate text-app-body font-semibold text-app-label">
                              {row.name}
                            </span>
                            {/* A figure, so it sets in mono — the brand's
                                signature, on every tier. */}
                            {value ? (
                              <span className="shrink-0 font-mono text-app-subhead font-semibold tabular-nums text-app-label">
                                {value}
                              </span>
                            ) : null}
                          </span>

                          <span className="flex items-baseline justify-between gap-3 text-app-footnote">
                            <span
                              className={cn(
                                "truncate",
                                stale
                                  ? "font-medium text-destructive"
                                  : "text-app-label-3"
                              )}
                            >
                              {waitedLabel(daysWaiting(row, now), open)}
                              {who ? ` · ${who}` : ""}
                            </span>
                            {/* The status is read here and changed on the
                                lead's page — or, from `md`, in the menu on the
                                right of this row. */}
                            <span className="shrink-0 text-app-label-3 capitalize md:hidden">
                              {row.status}
                            </span>
                          </span>

                          {/* Barter, commission, equity, started — only the
                              rows that carry them grow a third line. */}
                          <DealBadges client={row} className="mt-1" />
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
// than an empty slab, which reads as a card that failed to load. Three things
// can be empty here and they are not the same thing — an archive nobody has put
// anything in, a filter that happens to match nothing, and a dashboard on its
// first day — so each says what it is and, where there is one, what to do.
function EmptyLeads({
  archived,
  filtered,
  allHref,
}: {
  archived: boolean
  /** There are rows behind the current filter — this view is empty, not the list. */
  filtered: boolean
  allHref: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
      <p className="text-app-callout font-medium text-app-label-2">
        {filtered
          ? "Nothing under this filter"
          : archived
            ? "Nothing archived"
            : "No leads yet"}
      </p>
      <p className="max-w-xs text-app-footnote text-app-label-3">
        {filtered ? (
          <>
            Every other lead is still there —{" "}
            <Link
              href={allHref}
              className="text-app-tint underline underline-offset-2"
            >
              show all
            </Link>
            .
          </>
        ) : archived ? (
          "A lead you archive is taken off the list and kept here."
        ) : (
          "Add the first one with the plus button — everything else can be filled in on their profile."
        )}
      </p>
    </div>
  )
}
