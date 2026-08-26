"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
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
const SheetTitle = DialogTitle
const SheetDescription = DialogDescription

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  // A sheet rises from the bottom edge, so its header reads as a left-aligned
  // title bar on every size — never the centred text of a floating dialog.
  return <DialogHeader className={cn("text-left", className)} {...props} />
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        // Phone: pinned to the bottom edge, full-width, capped height with its
        // own scroll, padded past the home indicator.
        "top-auto bottom-0 left-0 max-h-[85dvh] w-full max-w-none translate-x-0 translate-y-0",
        "overflow-y-auto rounded-b-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8",
        // Desktop: the ordinary centred dialog.
        "sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85vh] sm:max-w-lg",
        "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6",
        className
      )}
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
