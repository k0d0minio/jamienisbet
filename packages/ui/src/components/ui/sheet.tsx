"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import { useKeyboardInset } from "../../lib/use-keyboard-inset"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

// The phone-first modal surface: a bottom sheet that slides up over the page on
// a small screen — where a centred dialog floats out of thumb reach and fights
// the keyboard — and falls back to the ordinary centred dialog from `sm` up.
// Same Radix machinery as Dialog (focus trap, escape, overlay), different
// geometry; use it for any form or action that a phone user opens one-handed.
//
// On the app tier a sheet can also take **detents** — the native behaviour
// where the sheet rests at one of a few heights and you drag its handle
// between them. See SheetContent's `detents` prop.

const Sheet = Dialog
const SheetTrigger = DialogTrigger
const SheetClose = DialogClose
const SheetDescription = DialogDescription

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  // A sheet is opened by a thing — a batch, a lead, a ticket — so its title
  // carries that thing's name and wraps on a phone where a dialog's one-liner
  // never did. `leading-none` stacks those lines on top of each other, and the
  // close button sits over the end of the first one; give it a real line
  // height and the room the button takes.
  return (
    <DialogTitle className={cn("pr-8 leading-snug", className)} {...props} />
  )
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  // A sheet rises from the bottom edge, so its header reads as a left-aligned
  // title bar on every size — never the centred text of a floating dialog.
  return <DialogHeader className={cn("text-left", className)} {...props} />
}

// How long to let the keyboard finish animating before chasing the focused
// field — long enough for iOS, short enough not to read as a second gesture.
const FOCUS_SETTLE_MS = 200

// ------------------------------------------------------------------
// Detents.
//
// How much of the screen a sheet takes at rest. `medium` is the native
// half-sheet — enough for a short form with the page still visible behind it;
// `large` is the near-full sheet a long form or a set of answers wants. A
// sheet given more than one can be dragged between them by its handle, and
// dragged off the bottom to dismiss, exactly as iOS does it.
// ------------------------------------------------------------------

type Detent = "medium" | "large"

const DETENT_FRACTION: Record<Detent, number> = {
  medium: 0.56,
  large: 0.92,
}

/** Below the smallest detent by more than this, a release dismisses rather
 *  than snapping back — the same "you clearly meant down" threshold a native
 *  sheet uses. */
const DISMISS_RATIO = 0.62

/** A sheet never drags shorter than this while the finger is still down; past
 *  it the gesture reads as a dismiss, not a resize. */
const MIN_DRAG_HEIGHT = 96

/** A press that moved less than this was a tap on the handle, not a drag —
 *  and a tap cycles to the next detent, so the handle works without a gesture
 *  (and for anyone who can't make one). */
const TAP_SLOP = 4

/** Detents are a phone behaviour: from `sm` up the sheet is a centred dialog
 *  that sizes to its content, and there is nothing to drag. */
const PHONE_QUERY = "(max-width: 39.9375rem)"

function usePhone(): boolean {
  // Read on the first render rather than in an effect: a sheet opening at its
  // content height and then jumping to its detent one frame later is exactly
  // the kind of thing this tier exists to stop. Safe to read the DOM here —
  // a sheet's content only ever mounts on the client, when it opens.
  const [phone, setPhone] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches
  )
  React.useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY)
    const sync = () => setPhone(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  return phone
}

function SheetContent({
  className,
  children,
  style,
  detents,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  /** The heights this sheet rests at, shortest first. Omit for the default:
   *  a sheet that sizes to its content up to 85dvh. */
  detents?: Detent[]
}) {
  const keyboardInset = useKeyboardInset()
  const phone = usePhone()
  const detented = detents != null && detents.length > 0 && phone

  // Keep the field you're typing in above the keyboard. The sheet scrolls
  // itself (`overflow-y-auto`), so `block: "nearest"` moves the field the least
  // it can rather than yanking the form to the top — and it fires on the
  // keyboard's own resize too, since focus lands before the keyboard is up.
  const contentRef = React.useRef<HTMLDivElement>(null)
  // Dismissing by gesture goes through Radix's own close rather than a prop,
  // so an uncontrolled sheet closes without the caller wiring anything.
  const closeRef = React.useRef<HTMLButtonElement>(null)

  const [detentIndex, setDetentIndex] = React.useState(0)
  const [dragHeight, setDragHeight] = React.useState<number | null>(null)
  const drag = React.useRef<{
    startY: number
    startHeight: number
    moved: boolean
  } | null>(null)

  React.useEffect(() => {
    const node = contentRef.current
    if (!node) return

    let timer: ReturnType<typeof setTimeout> | undefined

    function reveal(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return
      if (!target.matches("input, textarea, select, [contenteditable]")) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        target.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }, FOCUS_SETTLE_MS)
    }

    function onFocusIn(event: FocusEvent) {
      reveal(event.target)
    }
    function onViewportResize() {
      reveal(document.activeElement)
    }

    node.addEventListener("focusin", onFocusIn)
    window.visualViewport?.addEventListener("resize", onViewportResize)
    return () => {
      clearTimeout(timer)
      node.removeEventListener("focusin", onFocusIn)
      window.visualViewport?.removeEventListener("resize", onViewportResize)
    }
  }, [])

  // A keyboard takes the room a medium detent was leaving to the page behind:
  // go to the tallest detent so the form still has somewhere to be.
  const lastDetent = (detents?.length ?? 1) - 1
  React.useEffect(() => {
    if (keyboardInset > 0) setDetentIndex(lastDetent)
  }, [keyboardInset, lastDetent])

  function detentPixels(): number[] {
    return (detents ?? []).map((d) => DETENT_FRACTION[d] * window.innerHeight)
  }

  function onHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!detented || !contentRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      startY: event.clientY,
      startHeight: contentRef.current.getBoundingClientRect().height,
      moved: false,
    }
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current) return
    const travel = current.startY - event.clientY
    if (Math.abs(travel) > TAP_SLOP) current.moved = true
    if (!current.moved) return
    const heights = detentPixels()
    const tallest = Math.max(...heights)
    setDragHeight(
      Math.min(Math.max(current.startHeight + travel, MIN_DRAG_HEIGHT), tallest)
    )
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    drag.current = null
    if (!current) return
    event.currentTarget.releasePointerCapture(event.pointerId)

    const heights = detentPixels()
    // A tap rather than a drag: step to the next detent and wrap, so the
    // handle is a control and not only a grip.
    if (!current.moved) {
      setDetentIndex((index) => (index + 1) % heights.length)
      return
    }

    const released = dragHeight ?? current.startHeight
    setDragHeight(null)
    if (released < heights[0]! * DISMISS_RATIO) {
      closeRef.current?.click()
      return
    }
    let nearest = 0
    heights.forEach((height, index) => {
      if (Math.abs(height - released) < Math.abs(heights[nearest]! - released)) {
        nearest = index
      }
    })
    setDetentIndex(nearest)
  }

  const restingFraction =
    DETENT_FRACTION[detents?.[Math.min(detentIndex, lastDetent)] ?? "large"]

  return (
    <DialogContent
      ref={contentRef}
      className={cn(
        // Phone: pinned to the bottom edge, full-width, capped height with its
        // own scroll, padded past the home indicator.
        "top-auto left-0 w-full max-w-none translate-x-0 translate-y-0",
        "overflow-y-auto overscroll-contain rounded-b-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        // Ride above the keyboard rather than behind it, and give up the height
        // it took so the sheet still scrolls to its own end.
        "bottom-[var(--jn-keyboard-inset)]",
        detented
          ? // A detented sheet is the height its detent says, not the height
            // its content asks for — and it moves between them on the sheet
            // spring. The duration utilities read the app tier's own tokens,
            // which stand still under reduced motion.
            [
              "h-[var(--jn-sheet-height)] max-h-[calc(92dvh_-_var(--jn-keyboard-inset))]",
              // The dialog body is a grid, and a grid told to be taller than
              // its rows stretches them: content shorter than its detent came
              // out spread down the sheet with a hole in the middle of it.
              // Stack from the top and let the rest of the detent be space.
              "content-start",
              "transition-[height] duration-[var(--duration-sheet)] ease-[var(--spring-sheet)]",
              dragHeight !== null && "transition-none",
            ]
          : "max-h-[calc(85dvh_-_var(--jn-keyboard-inset))]",
        "data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8",
        // Desktop: the ordinary centred dialog — no keyboard to dodge, and no
        // detent to rest at.
        "sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:max-w-lg",
        "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6",
        className
      )}
      style={
        {
          "--jn-keyboard-inset": `${keyboardInset}px`,
          "--jn-sheet-height":
            dragHeight !== null
              ? `${dragHeight}px`
              : `calc(${restingFraction * 100}dvh - var(--jn-keyboard-inset))`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Grab handle — phones only; a centred dialog doesn't need one. With
          detents it is a real control: drag it between heights or off the
          bottom to dismiss, tap it to step to the next height. The button
          sits in the sheet's own top padding, so the grab area costs no
          height. */}
      {detented ? (
        <button
          type="button"
          aria-label="Resize this sheet"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          className="-mx-4 -mt-4 mb-1 flex h-11 touch-none items-center justify-center sm:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </button>
      ) : (
        <div
          className="mx-auto -mt-1 mb-1 h-1 w-10 rounded-full bg-border sm:hidden"
          aria-hidden
        />
      )}

      {/* What a dismiss gesture actually presses. Hidden from everyone: the
          visible close is the X the dialog already draws. */}
      <DialogPrimitive.Close ref={closeRef} hidden aria-hidden tabIndex={-1} />

      {children}
    </DialogContent>
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type Detent,
}
