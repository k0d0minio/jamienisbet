"use client"

import { LogOut } from "lucide-react"
import { useFormStatus } from "react-dom"

import {
  LogoMark,
  RecordRow,
  RecordSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

// The account control, and the only thing left of the old brand bar: the JN
// mark, on the trailing edge of every screen's title bar on a phone. It is
// where anything that belongs to the app rather than to a screen lives. Today
// that is sign out; the sheet is a record list because the next one will just
// be another row. A bottom sheet rather than a menu: it is reached one-handed.
//
// Phones only. From `md` up the rail carries the mark and sign out outright,
// and a second copy in the bar would be one sign-out too many.

function SignOutRow() {
  const { pending } = useFormStatus()

  return (
    <RecordRow
      asChild
      variant="destructive"
      icon={<LogOut />}
      label={pending ? "Signing out…" : "Sign out"}
    >
      <button type="submit" disabled={pending} />
    </RecordRow>
  )
}

export function AccountMenu({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            // The control step (44px under a thumb) on the bar's trailing
            // edge; the negative margin keeps the glyph optically on the
            // gutter rather than a finger's worth of padding inside it.
            "-mr-2 flex size-desk-control items-center justify-center rounded-desk-control",
            "text-desk-fg transition-colors duration-100 hover:bg-desk-hover active:bg-desk-sunken",
            "md:hidden",
            className
          )}
        >
          {/* The mark in currentColor, so it reads as a bar glyph rather than
              a tile of its own. */}
          <LogoMark className="size-5" aria-hidden />
        </button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          {/* Stays type, not the full lockup. The lockup reads "Jamie Nisbet."
              — the person — where this names the app. And SheetTitle is the
              sheet's accessible name, which wants a string. */}
          <SheetTitle>Consultancy JN</SheetTitle>
          <SheetDescription>
            This device stays signed in until you sign out of it.
          </SheetDescription>
        </SheetHeader>

        <form action={logout} className="mt-4">
          <RecordSection>
            <SignOutRow />
          </RecordSection>
        </form>
      </SheetContent>
    </Sheet>
  )
}
