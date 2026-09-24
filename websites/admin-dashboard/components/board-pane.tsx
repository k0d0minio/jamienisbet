"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { ChevronLeft } from "lucide-react"

import { Material, cn } from "@jamie-nisbet/ui"

/** How far an edge swipe has to carry the view, as a share of its width,
 *  before letting go goes back rather than settling it home. */
const EDGE_BACK_SHARE = 0.33

/** Tailwind's `lg` — where the pane stands beside the list rather than being
 *  pushed over it. */
const DESKTOP_QUERY = "(min-width: 64rem)"

// The detail half of the board's master–detail: one element, two readings.
//
// From `lg` it is the pane — beside the list, pinned under the title bar and
// scrolling on its own, so selecting in the list swaps what it shows while the
// list stays exactly where it was. It always shows something: the selection,
// or the estate overview when there is none.
//
// Below `lg` it is a pushed view — full screen over the list, with a large
// title, a way back on the leading edge of its own bar, and an edge swipe that
// does the same — and it is there only while a selection is pushed. The list
// stays mounted underneath with the page scroll held, which is what brings you
// back to the row you left.
//
// CSS decides which reading applies, not script, so the server's render and
// the first client render agree on every width.
export function DetailPane({
  pushed,
  title,
  subtitle,
  backLabel,
  onBack,
  contentKey,
  scrollerRef,
  children,
}: {
  /** Below `lg`: the view is pushed over the list. Ignored from `lg`. */
  pushed: boolean
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** What the phone's back affordance names — the screen it returns to. */
  backLabel: React.ReactNode
  onBack: () => void
  /** Changes when the view shows something else, so the pane starts at the
   *  top of the new thing rather than halfway down the last one. */
  contentKey: string
  /** The pane's own scroller, for the board's keyboard to move focus into —
   *  focused, it reads with the arrows and Page keys like any scroll view. */
  scrollerRef?: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  const ownScroller = useRef<HTMLDivElement>(null)
  const scroller = scrollerRef ?? ownScroller
  const [drag, setDrag] = useState(0)
  const gesture = useRef<{ pointerId: number; startX: number } | null>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [contentKey, scroller])

  // A pushed view holds the page still under it. Overscroll containment alone
  // only holds while the view is tall enough to scroll; a short one would
  // otherwise hand the drag to the list behind it.
  // Re-read on every crossing of `lg`: an iPad turned while a view is pushed
  // changes which reading applies, and the lock has to follow it.
  useEffect(() => {
    if (!pushed) return
    const root = document.documentElement
    const previous = root.style.overflow
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const apply = () => {
      root.style.overflow = desktop.matches ? previous : "hidden"
    }
    apply()
    desktop.addEventListener("change", apply)
    return () => {
      desktop.removeEventListener("change", apply)
      root.style.overflow = previous
    }
  }, [pushed])

  function onEdgeDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return
    gesture.current = { pointerId: e.pointerId, startX: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onEdgeMove(e: React.PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== e.pointerId) return
    setDrag(Math.max(0, e.clientX - gesture.current.startX))
  }

  function onEdgeEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== e.pointerId) return
    gesture.current = null
    const width = scroller.current?.clientWidth ?? window.innerWidth
    const release = e.type === "pointerup" && drag > width * EDGE_BACK_SHARE
    setDrag(0)
    if (release) onBack()
  }

  return (
    <div
      ref={scroller}
      // A landmark the keyboard can land in (`Enter` from the list, `Esc` back
      // out) — focusable by script only, never a Tab stop of its own.
      role="region"
      aria-label="Details"
      tabIndex={-1}
      // A pull inside the view is the view's own scroll, never the page's
      // pull-to-refresh, which listens further up the tree.
      onTouchStart={(e) => e.stopPropagation()}
      style={
        drag > 0
          ? { transform: `translateX(${drag}px)`, transitionProperty: "none" }
          : undefined
      }
      className={cn(
        // Phone: pushed over everything but the tab bar (which comes later in
        // the tree at the same layer), sliding in from the trailing edge the
        // way a pushed view does. Absent while nothing is pushed.
        pushed
          ? cn(
              "fixed inset-0 z-30 flex flex-col overflow-y-auto overscroll-contain bg-app-canvas pb-tabs",
              "transition-transform spring-sheet max-lg:starting:translate-x-full"
            )
          : "hidden",
        // Desktop: the pane, pinned under the title bar and scrolling on its
        // own. It is always there.
        "lg:sticky lg:inset-auto lg:z-auto lg:flex lg:flex-col lg:overflow-y-auto lg:bg-transparent lg:pb-8",
        // The keyboard's focus shows as the ring the app's buttons wear.
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:rounded-app-group",
        "lg:top-[calc(var(--app-bar-height)_+_env(safe-area-inset-top))]",
        "lg:max-h-[calc(100dvh_-_var(--app-bar-height)_-_env(safe-area-inset-top))]"
      )}
    >
      {pushed ? (
        <>
          {/* The pushed view's own bar: the way back, on the leading edge. */}
          <Material
            level="regular"
            edge="bottom"
            className="sticky top-0 z-10 px-app-gutter lg:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex min-h-app-bar items-center">
              <button
                type="button"
                onClick={onBack}
                className={cn(
                  "-ml-2 flex min-h-app-touch max-w-full items-center gap-0.5 rounded-app-control pr-2",
                  "text-app-body text-app-tint transition-colors spring-press active:bg-app-press"
                )}
              >
                <ChevronLeft className="size-6 shrink-0" aria-hidden />
                <span className="truncate">{backLabel}</span>
              </button>
            </div>
          </Material>
          {/* The leading edge, where a thumb swipes back. Narrow, and only on
              the pushed view: the list's rows swipe sideways too, and they
              are never under this. It starts under the bar, so the back
              button keeps its whole target. */}
          <div
            aria-hidden
            className="fixed bottom-0 left-0 top-[calc(var(--app-bar-height)_+_env(safe-area-inset-top))] z-20 w-4 touch-none lg:hidden"
            onPointerDown={onEdgeDown}
            onPointerMove={onEdgeMove}
            onPointerUp={onEdgeEnd}
            onPointerCancel={onEdgeEnd}
          />
        </>
      ) : null}

      <div className="flex flex-col gap-app-section px-app-gutter pt-2 pb-2 lg:px-0 lg:pt-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-app-large-title font-bold text-app-label lg:text-app-title-2">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-app-footnote text-app-label-3">{subtitle}</p>
          ) : null}
        </div>
        {/* Keyed to what is shown, so a ticket's controls never carry one
            ticket's state (a "Copied" confirmation, an open menu) into the
            next. */}
        <Fragment key={contentKey}>{children}</Fragment>
      </div>
    </div>
  )
}
