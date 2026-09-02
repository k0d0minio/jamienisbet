"use client"

import { LogOut } from "lucide-react"
import { useFormStatus } from "react-dom"

import {
  GroupedList,
  GroupedRow,
  GroupedSection,
  LogoMark,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

// The app-level control, and the only thing left of the old brand bar: the JN
// mark, sitting on the trailing edge of every screen's compact title bar. The
// wordmark stopped leading each page when the screen's own name took that job —
// the mark is what remains of it, and it is where anything that belongs to the
// app rather than to a screen lives. Today that is sign out; the sheet is a
// list because the next one will just be another row.
//
// Phones only. From `md` up the sidebar carries the mark and sign out outright,
// and a second copy in the bar would be one sign-out too many.

function SignOutRow() {
  const { pending } = useFormStatus()

  return (
    <GroupedRow
      asChild
      variant="destructive"
      icon={<LogOut />}
      label={pending ? "Signing out…" : "Sign out"}
      chevron={false}
    >
      <button type="submit" disabled={pending} />
    </GroupedRow>
  )
}

export function AppMenu({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="App menu"
          className={cn(
            // A 44px target on the bar's trailing edge; the negative margin
            // keeps the glyph optically on the gutter rather than a finger's
            // worth of padding inside it.
            "-mr-2 flex size-app-touch items-center justify-center rounded-app-control",
            "text-material-label transition-colors spring-press active:bg-app-press",
            "md:hidden",
            className
          )}
        >
          {/* The mark in currentColor, so it takes the bar's material-safe
              label colour rather than sitting on a tile of its own — a tile
              over a translucent title bar would read as a second surface. */}
          <LogoMark className="size-5" aria-hidden />
        </button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          {/* Stays type, not the full lockup. The lockup reads "Jamie Nisbet."
              — the person — where this names the app; the sidebar carries it
              from `md` up, and this sheet is the phone's. And SheetTitle is
              the sheet's accessible name, which wants a string. */}
          <SheetTitle>Consultancy JN</SheetTitle>
          <SheetDescription>
            This device stays signed in until you sign out of it.
          </SheetDescription>
        </SheetHeader>

        {/* The sheet owns its own padding, so the list drops the page gutter
            it would add on a screen. */}
        <form action={logout} className="mt-4">
          <GroupedList className="px-0">
            <GroupedSection>
              <SignOutRow />
            </GroupedSection>
          </GroupedList>
        </form>
      </SheetContent>
    </Sheet>
  )
}
