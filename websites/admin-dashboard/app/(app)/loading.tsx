import {
  GlanceFigure,
  GlanceRow,
  GroupedSection,
  Skeleton,
  cn,
} from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// The leads screen is three reads in parallel — every client, every open todo,
// every open compliance date — so on mobile data there is a beat of nothing
// between tapping the tab and the list arriving. The shape lands first, built
// from the same pieces as page.tsx so the real list replaces this without the
// page jumping under a thumb already on its way to a row.
//
// Deliberately not "Leads, loading": the title, the glance row's two slots, the
// filter track and six rows are the screen, and they are all knowable before
// the data is. What can't be known is left as a bar rather than guessed at.
//
// This sits at the `(app)` segment root, but the three screens under it —
// money, tickets, a lead's profile — each ship their own, so in practice it is
// only ever the leads list that shows it.

function RowSkeleton({ first }: { first?: boolean }) {
  return (
    <li
      className={cn(
        "relative flex items-center gap-3 bg-app-group px-4 py-2.5 md:gap-4 md:px-5 md:py-3.5",
        !first &&
          "before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          {/* The name line runs at body size, the waiting line at footnote —
              two different bar heights, or the list reads as one grey block. */}
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      </div>
      <Skeleton className="size-4 shrink-0 rounded-full" />
    </li>
  )
}

export default function LeadsLoading() {
  return (
    <AppScreen
      title="Leads"
      masthead={
        <GlanceRow>
          {/* Two, not three: the third figure only exists when something is
              being traded in kind, and a bar that resolves into nothing is a
              worse guess than one fewer bar. */}
          {[0, 1].map((i) => (
            <GlanceFigure
              key={i}
              value={<Skeleton className="h-6 w-20" />}
              label={<Skeleton className="mt-1 h-2.5 w-14" />}
            />
          ))}
        </GlanceRow>
      }
    >
      <div className="flex flex-col gap-4 pt-1 sm:gap-5">
        {/* The filter track, at its real geometry — the segments are inert
            here, so they are drawn rather than rendered as controls. */}
        <div
          aria-hidden
          className="flex items-stretch gap-1 rounded-app-control bg-app-press p-1"
        >
          {["2.5rem", "3rem", "4.5rem", "2.5rem"].map((width) => (
            <div
              key={width}
              className="flex min-h-app-touch flex-1 items-center justify-center"
            >
              <Skeleton className="h-3.5" style={{ width }} />
            </div>
          ))}
        </div>

        {/* The working-list strip, still in its own idiom until sequence 5
            retires it — so its skeleton is a card, like the thing it stands
            in for. */}
        <div className="flex min-h-14 items-center gap-3 rounded-lg border bg-card px-4">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-3.5 w-40" />
        </div>

        <GroupedSection>
          <ul>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <RowSkeleton key={i} first={i === 0} />
            ))}
          </ul>
        </GroupedSection>

        <span className="sr-only" role="status">
          Loading leads
        </span>
      </div>
    </AppScreen>
  )
}
