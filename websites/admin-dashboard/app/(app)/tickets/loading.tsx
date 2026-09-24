import { GroupedSection, Skeleton, cn } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BoardRefresh } from "@/components/board-refresh"
import { LoadingLine } from "@/components/loading-line"

// Tickets is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
// folder. On a phone on mobile data a cold read is a second or two of nothing,
// so the shape of the board arrives first: the filter rail, then a repo group
// of batch rows — and, from `lg`, the empty pane beside them. This is the
// first load's only: once the board is on screen, filtering and selecting
// happen in the browser and a refresh swaps the data in under it in a
// transition, so this skeleton never comes back.
//
// Sized against the board deliberately — the chips carry the Chip's geometry,
// the repo headers the header button's, the batch rows the same three lines,
// the columns the board's own grid — so the real board replaces this without
// the page jumping under a thumb that has already started moving.
//
// Bars that stand on the page canvas (the section headers, the chips, the
// pane's title) take `--app-press` rather than Skeleton's own fill, which is a
// near-match for the canvas in dark and simply vanished there. Bars inside a
// group keep the default: there they have a card to sit on.

/** The hairline between batch rows, inset to the slab's own padding the way
 *  the board's rows inset it. */
function hairline(first?: boolean) {
  return first
    ? undefined
    : "before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator"
}

const PLAIN_ROW = { "--app-row-inset": "1rem" } as React.CSSProperties

/** A batch row: the name and its figure, the arc, what's next. */
function BatchRowSkeleton({ first }: { first?: boolean }) {
  return (
    <div
      style={PLAIN_ROW}
      className={cn(
        "relative flex min-h-app-touch flex-col justify-center gap-1.5 px-4 py-3 md:px-5 md:py-3.5",
        hairline(first)
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="ml-auto h-3.5 w-14 shrink-0" />
      </div>
      {/* The Meter's own track height, so the row doesn't resize when the arc
          arrives under it. */}
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  )
}

function RepoSectionSkeleton({ batches }: { batches: number }) {
  return (
    <GroupedSection
      header={
        // The header is a 44px button on the board; the bars sit in the
        // middle of the same height.
        <span className="flex min-h-app-touch items-center gap-2">
          <Skeleton className="h-3 w-24 bg-app-press" />
          <Skeleton className="ml-auto h-3 w-12 bg-app-press" />
        </span>
      }
    >
      {Array.from({ length: batches }, (_, i) => (
        <BatchRowSkeleton key={i} first={i === 0} />
      ))}
    </GroupedSection>
  )
}

export default function TicketsLoading() {
  return (
    // The header is static copy — it renders for real, and having the title
    // hold still through the load is most of why this reads as loading rather
    // than as broken.
    <AppScreen
      title="Tickets"
      subtitle={<LoadingLine>Loading the board</LoadingLine>}
      // The bar button renders for real, like the title: it busts the cache
      // this read is already missing, and a grey square where an icon is about
      // to be would move the bar's contents the moment the board lands.
      actions={<BoardRefresh />}
    >
      <div className="pt-1 pb-2 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* The repo filter rail, at its real geometry — the chips are inert
              here, so they are drawn rather than rendered as controls. */}
          <div
            aria-hidden
            className="-mx-4 flex items-center gap-1 overflow-hidden px-4 sm:mx-0 sm:px-0"
          >
            {["2.5rem", "5rem", "4rem", "6rem"].map((width) => (
              <div
                key={width}
                className="flex min-h-app-touch shrink-0 items-center px-3.5"
              >
                <Skeleton className="h-3.5 bg-app-press" style={{ width }} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-app-section">
            <RepoSectionSkeleton batches={3} />
            <RepoSectionSkeleton batches={2} />
          </div>
        </div>

        {/* The pane, empty: where the overview lands from `lg`. Its title's
            geometry only — what it holds depends on the board. */}
        <div aria-hidden className="hidden flex-col gap-1 pt-1 lg:flex">
          <Skeleton className="h-7 w-40 bg-app-press" />
          <Skeleton className="h-3 w-28 bg-app-press" />
        </div>

        <span className="sr-only" role="status">
          Loading tickets
        </span>
      </div>
    </AppScreen>
  )
}
