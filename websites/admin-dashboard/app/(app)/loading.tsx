import { GroupedSection, Skeleton, cn } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BoardRefresh } from "@/components/board-refresh"
import { LoadingLine } from "@/components/loading-line"

// Work is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
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

/** Work at the desk, before the board arrives: the three panes at their real
 *  widths, hairline bars where the views, a few repos and the list's rows
 *  will be, and an empty detail pane — so the board lands without the panes
 *  moving. Still, like the rest of the desk tier: no shimmer beyond the
 *  skeleton's own. */
function DeskLoading() {
  return (
    <div
      aria-hidden
      className="desk-tier flex h-dvh min-h-0 flex-col bg-desk-canvas font-desk md:-mb-8"
    >
      <div className="flex h-desk-toolbar shrink-0 items-center border-b border-desk-line bg-desk-surface px-4">
        <span className="text-desk-heading font-bold text-desk-fg">Work</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-52 shrink-0 flex-col gap-0 border-r border-desk-line bg-desk-hover py-2 xl:w-58">
          {["w-20", "w-14", "w-16", "w-16"].map((width, i) => (
            <div key={i} className="mx-1.5 flex h-desk-row items-center gap-2 px-2.5">
              <Skeleton className={cn("h-3 bg-desk-sunken", width)} />
              <Skeleton className="ml-auto h-3 w-4 bg-desk-sunken" />
            </div>
          ))}
          <div className="mt-4 px-3 pb-1">
            <Skeleton className="h-2.5 w-10 bg-desk-sunken" />
          </div>
          {["w-24", "w-28", "w-20"].map((width, i) => (
            <div key={i} className="mx-1.5 flex h-desk-row items-center gap-2 px-2.5 pl-8">
              <Skeleton className={cn("h-3 bg-desk-sunken", width)} />
              <Skeleton className="ml-auto h-3 w-6 bg-desk-sunken" />
            </div>
          ))}
        </div>
        <div className="flex w-80 shrink-0 flex-col border-r border-desk-line bg-desk-surface xl:w-98">
          <div className="flex h-desk-pane-header shrink-0 items-center gap-3 border-b border-desk-line px-4">
            <Skeleton className="h-4 w-20 bg-desk-sunken" />
            <Skeleton className="h-3 w-32 bg-desk-sunken" />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5 border-b border-desk-line px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-desk-dot rounded-full bg-desk-sunken" />
                <Skeleton className="h-3 w-3/5 bg-desk-sunken" />
              </div>
              <Skeleton className="ml-4.5 h-2.5 w-2/5 bg-desk-sunken" />
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-desk-surface">
          <div className="flex h-desk-pane-header shrink-0 items-center border-b border-desk-line px-5">
            <Skeleton className="h-4 w-24 bg-desk-sunken" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WorkLoading() {
  return (
    <>
      <div className="hidden lg:contents">
        <DeskLoading />
      </div>
      <div className="lg:hidden">
        <PhoneLoading />
      </div>
      <span className="sr-only" role="status">
        Loading tickets
      </span>
    </>
  )
}

/** The phone board's skeleton, as it was. */
function PhoneLoading() {
  return (
    // The header is static copy — it renders for real, and having the title
    // hold still through the load is most of why this reads as loading rather
    // than as broken.
    <AppScreen
      title="Work"
      wide
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
      </div>
    </AppScreen>
  )
}
