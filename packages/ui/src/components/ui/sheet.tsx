"use client"

import * as React from "react"

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

function SheetContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const keyboardInset = useKeyboardInset()

  // Keep the field you're typing in above the keyboard. The sheet scrolls
  // itself (`overflow-y-auto`), so `block: "nearest"` moves the field the least
  // it can rather than yanking the form to the top — and it fires on the
  // keyboard's own resize too, since focus lands before the keyboard is up.
  const contentRef = React.useRef<HTMLDivElement>(null)

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

  return (
    <DialogContent
      ref={contentRef}
      className={cn(
        // Phone: pinned to the bottom edge, full-width, capped height with its
        // own scroll, padded past the home indicator.
        "top-auto left-0 w-full max-w-none translate-x-0 translate-y-0",
        "overflow-y-auto rounded-b-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        // Ride above the keyboard rather than behind it, and give up the height
        // it took so the sheet still scrolls to its own end.
        "bottom-[var(--jn-keyboard-inset)] max-h-[calc(85dvh_-_var(--jn-keyboard-inset))]",
        "data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8",
        // Desktop: the ordinary centred dialog — no keyboard to dodge.
        "sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85vh] sm:max-w-lg",
        "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6",
        className
      )}
      style={
        {
          "--jn-keyboard-inset": `${keyboardInset}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Grab handle — phones only; a centred dialog doesn't need one. */}
      <div
        className="mx-auto -mt-1 mb-1 h-1 w-10 rounded-full bg-border sm:hidden"
        aria-hidden
      />
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
}
