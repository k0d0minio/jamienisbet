"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@jamie-nisbet/ui"

import { hapticTick } from "@/lib/haptics"

// The mobile list gesture: swipe a row left to reveal a tray of actions behind
// its right edge, and (optionally) swipe it right past a threshold to commit
// one action in a single stroke — the mail-app idiom. Pointer events rather
// than a gesture library: the rows need exactly one gesture, and `touch-action:
// pan-y` already splits the work with the browser (vertical stays native
// scroll, horizontal comes here).
//
// The row's children stay whatever the caller renders — usually a stretched
// <Link> — and a drag never leaks into a tap: any claimed gesture swallows the
// click that would otherwise fire on release.
//
// Nothing here moves without a press. A mouse crossing a row emits the same
// `pointermove` stream a drag does, so the gesture tracks the pointer that went
// down on the row and ignores every other one — otherwise a desktop hover pulls
// the row open and fires its commit action.

// Only one row is open at a time. Opening (or starting to drag) one broadcasts
// a close to every other row — cheaper than threading context through a list
// that renders on the server.
const CLOSE_EVENT = "jn:swipe-row-close"

export type SwipeCommit = {
  /** Announced to screen readers and shown in the reveal underlay. */
  label: string
  icon: React.ReactNode
  /** Underlay colour classes, e.g. "bg-success text-white". */
  className: string
  onCommit: () => void
}

// How far a finger must travel before the gesture is ours (past tap wobble),
// and how far right a swipe must go to fire the commit action.
const CLAIM_PX = 12
const COMMIT_PX = 88

export function SwipeRow({
  children,
  // The action tray revealed by swiping left. Rendered behind the row content,
  // so the buttons are real targets once revealed.
  actions,
  // Optional swipe-right commit (e.g. "mark touched").
  commit,
  className,
}: {
  children: React.ReactNode
  actions?: React.ReactNode
  commit?: SwipeCommit
  className?: string
}) {
  // Identity token for the one-open-at-a-time broadcast — an object compared
  // by reference, nothing more.
  const rowId = useRef<object>({})
  const trayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Gesture bookkeeping lives in refs — it changes on every move event and
  // none of it should re-render until the offset actually moves. `pointerId`
  // is the press that owns the row, and it is null between presses: that is
  // the whole guard against a hovering mouse dragging anything.
  const gesture = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    base: 0,
    claimed: false,
    // Set once a gesture claimed the pointer; the next click is swallowed.
    swallowClick: false,
    // Whether the row is currently past the commit threshold. It is what the
    // haptic fires on the *edge* of, so crossing back and forth buzzes once
    // each way rather than once a frame.
    armed: false,
  })

  // Where the row actually is. State paints it; the ref is what the release
  // reads, so a fast flick commits on the distance the finger travelled rather
  // than on whatever React last managed to render.
  const offsetRef = useRef(0)

  function moveTo(next: number) {
    offsetRef.current = next
    setOffset(next)
  }

  const trayWidth = () => trayRef.current?.offsetWidth ?? 0

  function broadcastClose() {
    document.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: rowId.current }))
  }

  useEffect(() => {
    function onClose(event: Event) {
      if ((event as CustomEvent).detail !== rowId.current) moveTo(0)
    }
    document.addEventListener(CLOSE_EVENT, onClose)
    return () => document.removeEventListener(CLOSE_EVENT, onClose)
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    // A second finger, and a right or middle click, are not this gesture.
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      base: offsetRef.current,
      claimed: false,
      swallowClick: false,
      armed: false,
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current
    // No press on this row, or a different pointer's move — a hover, most of
    // the time. Nothing to drag.
    if (g.pointerId !== e.pointerId) return
    // A button let go outside the row never sends its pointerup here; the
    // first buttonless move is that release.
    if (e.pointerType === "mouse" && e.buttons === 0) {
      settle(e)
      return
    }

    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY

    if (!g.claimed) {
      // Vertical intent belongs to the scroll; only a clearly horizontal move
      // claims the pointer.
      if (Math.abs(dx) < CLAIM_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return
      g.claimed = true
      g.swallowClick = true
      setDragging(true)
      broadcastClose()
      contentRef.current?.setPointerCapture(e.pointerId)
    }

    const max = commit ? COMMIT_PX * 1.35 : 0
    const min = actions ? -trayWidth() : 0
    let next = g.base + dx
    // Rubber-band past the ends instead of hard-stopping.
    if (next < min) next = min + (next - min) / 3
    if (next > max) next = max + (next - max) / 3
    moveTo(next)

    // The threshold is invisible — the underlay grows smoothly and nothing on
    // screen says "let go now". A tick the moment it is crossed is what makes
    // the stroke committable without looking, the way a native full-swipe
    // does it, and the finger is still down to feel it.
    if (commit) {
      const past = next >= COMMIT_PX
      if (past !== g.armed) {
        g.armed = past
        hapticTick()
      }
    }
  }

  function settle(e: React.PointerEvent) {
    const g = gesture.current
    if (g.pointerId !== e.pointerId) return
    g.pointerId = null
    if (!g.claimed) return
    g.claimed = false
    setDragging(false)
    // A cancelled pointer has already lost its capture, and asking for it back
    // throws — which would leave the row parked wherever the finger left it.
    if (contentRef.current?.hasPointerCapture(e.pointerId)) {
      contentRef.current.releasePointerCapture(e.pointerId)
    }

    const at = offsetRef.current
    if (commit && at >= COMMIT_PX) {
      // Snap home and fire. No tick here: the crossing already answered, and
      // buzzing again on release would read as two events for one stroke.
      moveTo(0)
      commit.onCommit()
      return
    }
    // Past half the tray: snap open. Otherwise: closed.
    const width = trayWidth()
    moveTo(actions && at < -width / 2 ? -width : 0)
  }

  function onClickCapture(e: React.MouseEvent) {
    // A drag is not a tap — never let the stretched link underneath navigate.
    if (gesture.current.swallowClick) {
      gesture.current.swallowClick = false
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Tapping an open row closes it rather than navigating.
    if (offsetRef.current !== 0) {
      e.preventDefault()
      e.stopPropagation()
      moveTo(0)
    }
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* The commit underlay — visible while the row is pulled right. */}
      {commit ? (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center gap-2 pl-4 pr-2",
            "text-app-footnote font-semibold transition-opacity spring-press",
            commit.className,
            offset > 8 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(offset, 0) + 16 }}
          aria-hidden
        >
          {commit.icon}
          {offset >= COMMIT_PX ? <span>{commit.label}</span> : null}
        </div>
      ) : null}

      {/* The action tray behind the right edge. */}
      {actions ? (
        <div
          ref={trayRef}
          className={cn(
            "absolute inset-y-0 right-0 flex items-stretch",
            // Keep it out of the tab order (and off screen readers) while
            // hidden — otherwise every row carries invisible buttons.
            offset < 0 ? "" : "invisible"
          )}
        >
          {actions}
        </div>
      ) : null}

      <div
        ref={contentRef}
        className={cn(
          // A swipe is a drag, and a drag across text selects it — on a mouse
          // that leaves the row highlighted behind the gesture.
          "relative touch-pan-y select-none",
          // A released row settles rather than stopping dead: the app tier's
          // pop spring, critically damped, so it never passes home.
          !dragging && "transition-transform spring-pop"
        )}
        style={{ transform: offset !== 0 ? `translateX(${offset}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={settle}
        onPointerCancel={settle}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  )
}

/** One action in the swipe tray, in the iOS idiom: a full-height column of
 * solid colour running edge to edge of the row's height, icon over a single
 * word, wide enough to hit mid-swipe without aiming. No radius of its own —
 * the group the row sits in owns the corners and clips them. */
export function SwipeAction({
  label,
  icon,
  className,
  onClick,
  href,
  external,
}: {
  label: string
  icon: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  /** Open in a new tab (for links that leave the app, like WhatsApp) so the
   * board stays where the swipe happened. */
  external?: boolean
}) {
  const classes = cn(
    "relative isolate flex w-20 flex-col items-center justify-center gap-1",
    // The tray's own type: the app tier's smallest caption, set heavy, because
    // it is read at a glance under a moving thumb.
    "text-app-caption-2 font-semibold",
    // Press = colour deepens (BRAND.md), not a ghost fade: a foreground-tinted
    // scrim behind the icon/label over the caller's solid colour — darkens in
    // light, lifts in dark, the direction --primary-active moves.
    "after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-foreground/0 after:transition-colors spring-press active:after:bg-foreground/10",
    className
  )
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={label}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {icon}
        <span>{label}</span>
      </a>
    )
  }
  return (
    <button type="button" className={classes} onClick={onClick} aria-label={label}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
