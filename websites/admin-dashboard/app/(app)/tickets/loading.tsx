import { GlanceFigure, GlanceRow, GroupedSection, Skeleton, cn } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BoardRefresh } from "@/components/board-refresh"
import { LoadingLine } from "@/components/loading-line"

// Tickets is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
// folder, fetched on every visit (`dynamic = "force-dynamic"`). On a phone on
// mobile data that is a second or two of nothing, so the shape of the board
// arrives first: the filter rail, the now group, then a repo group of batch
// rows.
//
// Sized against page.tsx deliberately — the chips carry the Chip's geometry,
// the now rows the GroupedRow's, the batch rows the same three lines — so the
// real board replaces this without the page jumping under a thumb that has
// already started moving.
//
// Bars that stand on the page canvas (the glance figures, the section headers,
// the chips) take `--app-press` rather than Skeleton's own fill, which is a
// near-match for the canvas in dark and simply vanished there. Bars inside a
// group keep the default: there they have a card to sit on.

/** The hairline between rows, inset the way GroupedRow insets it — to the
 *  label column where the row carries a leading glyph, to the slab's own
 *  padding where it doesn't. */
function hairline(first?: boolean) {
  return first
    ? undefined
    : "before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator"
}

const ICON_ROW = { "--app-row-inset": "3.25rem" } as React.CSSProperties
const PLAIN_ROW = { "--app-row-inset": "1rem" } as React.CSSProperties

/** A now-strip row: the status bullet, a title, a repo-and-state line. */
function NowRowSkeleton({ first }: { first?: boolean }) {
  return (
    <div
      style={ICON_ROW}
      className={cn(
        "relative flex min-h-app-touch items-center gap-3 px-4 py-2.5",
        hairline(first)
      )}
    >
      <Skeleton className="size-2.5 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Body over footnote — two bar heights, or the group reads as one
            grey block. */}
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}

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
        <span className="flex items-baseline gap-2">
          <Skeleton className="h-3 w-24 bg-app-press" />
          <Skeleton className="ml-auto h-3 w-12 bg-app-press" />
        </span>
      }
    >
      {Array.from({ length: batches }, (_, i) => (
        <BatchRowSkeleton key={i} first={i === 0} />
      ))}
      {/* The maintenance row that closes every repo group. */}
      <div
        style={ICON_ROW}
        className={cn(
          "relative flex min-h-app-touch items-center gap-3 px-4 py-2.5",
          hairline()
        )}
      >
        <Skeleton className="size-5 shrink-0 rounded-sm" />
        <Skeleton className="h-4 w-28" />
      </div>
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
      masthead={
        <GlanceRow>
          {/* Two, not three: a board with nothing blocked shows two figures,
              and a bar that resolves into nothing is a worse guess than one
              fewer bar. */}
          {[0, 1].map((i) => (
            <GlanceFigure
              key={i}
              value={<Skeleton className="h-6 w-10 bg-app-press" />}
              label={<Skeleton className="mt-1 h-2.5 w-12 bg-app-press" />}
            />
          ))}
        </GlanceRow>
      }
    >
      <div className="flex flex-col gap-5 pt-1 pb-2">
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
          <GroupedSection
            header={<Skeleton className="h-3 w-8 bg-app-press" />}
            // The now group carries a two-line footer on the real board, and
            // leaving it out here is two lines the repo groups below would
            // jump by.
            footer={
              <span className="flex flex-col gap-1">
                <Skeleton className="h-2.5 w-full max-w-xs bg-app-press" />
                <Skeleton className="h-2.5 w-32 bg-app-press" />
              </span>
            }
          >
            {[0, 1, 2].map((i) => (
              <NowRowSkeleton key={i} first={i === 0} />
            ))}
          </GroupedSection>

          <RepoSectionSkeleton batches={2} />
          <RepoSectionSkeleton batches={3} />
        </div>

        <span className="sr-only" role="status">
          Loading tickets
        </span>
      </div>
    </AppScreen>
  )
}
