import {
  GlanceFigure,
  GlanceRow,
  GroupedSection,
  Skeleton,
  cn,
} from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { LoadingLine } from "@/components/loading-line"

// The leads screen is a full read of every client, so on mobile data there is a
// beat of nothing between tapping the tab and the list arriving. The shape lands
// first, built from the same pieces as page.tsx so the real list replaces this
// without the page jumping under a thumb already on its way to a row.
//
// Deliberately not "Leads, loading": the title, the glance row's two slots, the
// filter track and six rows are the screen, and they are all knowable before
// the data is. What can't be known is left as a bar rather than guessed at.
//
// It sits beside the list it stands in for: `/` (the feed), `/money`,
// `/tickets` and a lead's profile each ship their own.

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
      subtitle={<LoadingLine>Loading leads</LoadingLine>}
      masthead={
        <GlanceRow>
          {/* Two, not three: the third figure only exists when something is
              being traded in kind, and a bar that resolves into nothing is a
              worse guess than one fewer bar.

              They stand on the page canvas rather than inside a group, and
              Skeleton's own fill is a near-match for the canvas in dark — the
              bars simply vanished there. --app-press is the tier's "one stop
              off whatever is under you" wash: it darkens in light and lifts in
              dark, which is exactly what a bar on the canvas needs. */}
          {[0, 1].map((i) => (
            <GlanceFigure
              key={i}
              value={<Skeleton className="h-6 w-20 bg-app-press" />}
              label={<Skeleton className="mt-1 h-2.5 w-14 bg-app-press" />}
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
