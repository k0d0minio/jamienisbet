"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { LogoLoader, cn } from "@jamie-nisbet/ui"

import { hapticTick } from "@/lib/haptics"

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
  // Whether the pull is currently far enough to fire. Kept so the haptic can
  // answer the *edge* — the same thing a swipe row's commit threshold does,
  // and for the same reason: the threshold is invisible, and a tick is what
  // makes the gesture releasable without watching it.
  const armed = useRef(false)

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
    const next = Math.min((dy - 8) / 2, MAX_PULL_PX)
    setPull(next)

    const past = next >= THRESHOLD_PX
    if (past !== armed.current) {
      armed.current = past
      hapticTick()
    }
  }

  function onTouchEnd() {
    if (!start.current.active) return
    start.current.active = false
    armed.current = false
    if (pull >= THRESHOLD_PX) {
      // No tick here: the crossing already answered, and buzzing again on
      // release would read as two events for one gesture.
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
          // A released pull closes the gap in the desk tier's 100ms, eased
          // out, as a released swipe row does — no spring — and stands still
          // under reduced motion.
          pull === 0 && "transition-[height] duration-100"
        )}
        style={{ height: refreshing ? 40 : pull }}
        aria-hidden={!refreshing}
      >
        {/* Two states, one slot: while the finger is down the arrow winds up
            with the pull, and once released it hands over to the JN loader —
            the icon drawing itself in, the same indicator every route's
            loading state shows. */}
        {refreshing ? (
          // The loader labels itself "Loading"; the sr-only line below says the
          // more specific thing, so here it is decorative.
          <LogoLoader
            className="mb-2 size-5 text-desk-fg-3"
            role={undefined}
            aria-label={undefined}
            aria-hidden="true"
          />
        ) : (
          <RefreshCw
            className={cn(
              "mb-2 size-5 text-desk-fg-3",
              !active && "opacity-0"
            )}
            style={{ transform: `rotate(${pull * 2.5}deg)` }}
            aria-hidden
          />
        )}
        <span className="sr-only" role="status">
          {refreshing ? "Refreshing" : ""}
        </span>
      </div>
      {children}
    </div>
  )
}
