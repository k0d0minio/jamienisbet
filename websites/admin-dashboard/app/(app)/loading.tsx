import { Skeleton, cn } from "@jamie-nisbet/ui"

import { AccountMenu } from "@/components/account-menu"
import { BoardRefresh } from "@/components/board-refresh"
import { PaletteTitleBarButton } from "@/components/command-palette"

// Work is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
// folder. On a phone on mobile data a cold read is a second or two of nothing,
// so the shape of the board arrives first: at the desk the three panes, on the
// phone the title bar, the Up next / Repos switch and a section of ticket
// rows. This is the first load's only: once the board is on screen, filtering
// and selecting happen in the browser and a refresh swaps the data in under it
// in a transition, so this skeleton never comes back.
//
// Sized against the board deliberately — the same bar, the same row heights,
// the panes at their real widths — so the real board replaces this without
// the page jumping under a thumb that has already started moving. Bars take
// the sunken fill: it reads on the surface in both themes.

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

/** Work on the phone before the board arrives: the title bar for real (the
 *  name, the refresh that busts the cache this read is missing, the palette
 *  and the account menu), the view switch drawn, then one section of ticket
 *  rows at their real two-line height — components/work-phone.tsx. */
function PhoneLoading() {
  return (
    <div className="flex flex-col">
      <header
        className="sticky top-0 z-10 flex flex-col gap-2 border-b border-desk-line bg-desk-surface px-4 pb-2"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex min-h-12 items-center gap-2">
          <h1 className="text-desk-heading font-bold">Work</h1>
          <div className="ml-auto flex items-center gap-1">
            <BoardRefresh />
            <div className="flex items-center gap-1 md:hidden">
              <PaletteTitleBarButton />
              <AccountMenu />
            </div>
          </div>
        </div>
        {/* The Up next / Repos switch, drawn — inert until the board lands. */}
        <div
          aria-hidden
          className="flex h-11 w-full gap-0.5 rounded-desk-control bg-desk-sunken p-0.5"
        >
          <div className="flex-1 rounded-desk-key border border-desk-line bg-desk-surface" />
          <div className="flex-1" />
        </div>
      </header>
      <div aria-hidden className="flex flex-col">
        {[5, 2].map((rows, section) => (
          <div key={section}>
            <div className="flex items-center gap-2 border-b border-desk-line bg-desk-hover px-4 pt-4 pb-1.5">
              <Skeleton className="h-2.5 w-16 bg-desk-sunken" />
              <Skeleton className="h-2.5 w-3 bg-desk-sunken" />
            </div>
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className="flex min-h-desk-row flex-col gap-1.5 border-b border-desk-line px-4 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-desk-dot rounded-full bg-desk-sunken" />
                  <Skeleton className={cn("h-3 bg-desk-sunken", i % 2 ? "w-2/5" : "w-3/5")} />
                  <Skeleton className="ml-auto h-3 w-6 bg-desk-sunken" />
                </div>
                <Skeleton className="ml-4.5 h-2.5 w-1/2 bg-desk-sunken" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
