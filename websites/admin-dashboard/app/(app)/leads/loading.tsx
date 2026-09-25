import {
  Pane,
  PaneBody,
  PaneHeader,
  PaneToolbar,
  Skeleton,
} from "@jamie-nisbet/ui"

import { DeskScreen } from "@/components/desk-screen"
import { LoadingLine } from "@/components/loading-line"

// The leads screen is a full read of every client plus the deal folders, so
// there is a beat of nothing between choosing Leads and the list arriving. The
// shape lands first, built on the same frame as page.tsx — the desk's pane
// with its header, filter bar and table rows; the phone's title bar and flat
// rows — so the real screen replaces this without jumping.
//
// Deliberately not "Leads, loading": the title, the filter bar and the rows
// are the screen, and they are all knowable before the data is. What can't be
// known is left as a bar rather than guessed at.
//
// Skeleton's own fill is close to the desk canvas in dark, so the bars take
// the sunken step — one stop off whatever they sit on, in either theme.

const BAR = "bg-desk-sunken"

/** The filter bar's four links, drawn rather than rendered as controls. */
function FilterSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-3">
      {["w-8", "w-12", "w-14", "w-16"].map((width) => (
        <Skeleton key={width} className={`h-3 ${width} ${BAR}`} />
      ))}
    </div>
  )
}

function DeskRowSkeleton() {
  return (
    <div className="flex h-desk-grid-row items-center gap-5 border-b border-desk-line pr-4 pl-5">
      <div className="flex w-60 shrink-0 items-center gap-2.5">
        <Skeleton className={`size-6 shrink-0 rounded-full ${BAR}`} />
        <Skeleton className={`h-3 w-32 ${BAR}`} />
      </div>
      <Skeleton className={`h-3 w-20 shrink-0 ${BAR}`} />
      <Skeleton className={`h-3 w-16 shrink-0 ${BAR}`} />
      <Skeleton className={`h-3 w-16 shrink-0 ${BAR}`} />
      <Skeleton className={`h-3 w-40 ${BAR}`} />
    </div>
  )
}

function PhoneRowSkeleton() {
  return (
    <li className="flex min-h-desk-row items-center gap-3 border-b border-desk-line bg-desk-surface px-4 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          {/* The name line and the waiting line are two different bar
              heights, or the list reads as one grey block. */}
          <Skeleton className={`h-3.5 w-2/5 ${BAR}`} />
          <Skeleton className={`h-3.5 w-16 shrink-0 ${BAR}`} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className={`h-3 w-3/5 ${BAR}`} />
          <Skeleton className={`h-3 w-12 shrink-0 ${BAR}`} />
        </div>
      </div>
    </li>
  )
}

export default function LeadsLoading() {
  return (
    <>
      <div className="desk-tier hidden h-dvh flex-col md:-mb-8 md:flex">
        <Pane aria-label="Leads" className="flex-1">
          <PaneHeader
            titleAs="h1"
            title="Leads"
            meta={<LoadingLine>Loading leads</LoadingLine>}
          />
          <PaneToolbar>
            <FilterSkeleton />
          </PaneToolbar>
          <PaneBody className="bg-desk-surface">
            <div className="h-desk-grid-header border-b border-desk-line" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <DeskRowSkeleton key={i} />
            ))}
          </PaneBody>
        </Pane>
      </div>

      <div className="md:hidden">
        <DeskScreen
          title="Leads"
          subtitle={<LoadingLine>Loading leads</LoadingLine>}
        >
          <div className="-mx-4 flex flex-col">
            <div className="px-4 py-3">
              <FilterSkeleton />
            </div>
            <ul className="border-t border-desk-line">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <PhoneRowSkeleton key={i} />
              ))}
            </ul>
          </div>
        </DeskScreen>
      </div>

      <span className="sr-only" role="status">
        Loading leads
      </span>
    </>
  )
}
