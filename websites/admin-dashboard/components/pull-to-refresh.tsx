"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// Pull down from the top of the page to re-read everything — the gesture every
// installed app answers, and this one especially: each screen is a live read
// (Neon, Stripe, the repos' ticket folders) with no reload button in standalone
// mode. The body's `overscroll-behavior-y: contain` already suppresses the
// browser's own pull-to-refresh, so the gesture is ours to answer.
//
// Touch events rather than pointer events on purpose: this competes with
// native scrolling, and only touch events let scroll keep working the moment
// the pull is abandoned.

// How far the finger travels (damped) before release triggers a refresh.
const THRESHOLD_PX = 64
// Stop growing the indicator past this.
const MAX_PULL_PX = 96

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const [pull, setPull] = useState(0)
  const start = useRef({ x: 0, y: 0, active: false })

  function onTouchStart(e: React.TouchEvent) {
    // Only a pull that starts with the page already at its top is a refresh;
    // anywhere else it's just scrolling.
    const top = (document.scrollingElement?.scrollTop ?? 0) <= 0
    start.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      active: top && !refreshing,
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!start.current.active) return
    const dx = e.touches[0].clientX - start.current.x
    const dy = e.touches[0].clientY - start.current.y
    // A sideways gesture is someone swiping a row, not pulling the page —
    // hand the touch over for good rather than jittering the indicator.
    if (pull === 0 && Math.abs(dx) > Math.abs(dy)) {
      start.current.active = false
      return
    }
    if (dy <= 8) {
      setPull(0)
      return
    }
    // Damped, so the page follows the finger at half speed and settles.
    setPull(Math.min((dy - 8) / 2, MAX_PULL_PX))
  }

  function onTouchEnd() {
    if (!start.current.active) return
    start.current.active = false
    if (pull >= THRESHOLD_PX) {
      startTransition(() => router.refresh())
    }
    setPull(0)
  }

  const active = pull > 0 || refreshing

  return (
    <div
      // Carries the layout's flex so the wrapped <main> keeps filling the
      // viewport exactly as it did unwrapped.
      className="flex flex-1 flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* The indicator rides in the gap the pull opens up. */}
      <div
        className={cn(
          "pointer-events-none flex items-end justify-center overflow-hidden",
          pull === 0 && "transition-[height] duration-200"
        )}
        style={{ height: refreshing ? 40 : pull }}
        aria-hidden={!refreshing}
      >
        <RefreshCw
          className={cn(
            "mb-2 size-5 text-muted-foreground",
            refreshing && "animate-spin",
            !active && "opacity-0"
          )}
          style={
            refreshing ? undefined : { transform: `rotate(${pull * 2.5}deg)` }
          }
        />
        <span className="sr-only" role="status">
          {refreshing ? "Refreshing" : ""}
        </span>
      </div>
      {children}
    </div>
  )
}
