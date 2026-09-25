"use client"

import { useOptimistic, useTransition } from "react"
import { Check } from "lucide-react"

import { DeskButton, toast } from "@jamie-nisbet/ui"

import { KeyHint } from "@/components/lead-profile"

import { markTouched } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// "I spoke to them today." Status changes and profile edits already stamp the
// lead as worked; this covers the call or email that happened somewhere else,
// which is what keeps the staleness sort on the leads list honest.
//
// One of the buttons in the lead's action bar — a thing you press once, on the
// day it happens; T at the desk.
export function MarkTouchedButton({
  id,
  // Pre-formatted on the server ("today", "12 days") — the elapsed time can't
  // be worked out here without calling Date.now() during a render.
  lastWorked,
}: {
  id: string
  lastWorked: string
}) {
  const [pending, startTransition] = useTransition()
  // The button is its own receipt: it takes the check on the press and keeps
  // it, because that is what the server will say too. If the write fails the optimistic
  // layer falls away onto `lastWorked` and it reads as it did before.
  const [worked, setWorked] = useOptimistic(lastWorked)
  const touchedToday = worked === "today"

  return (
    <DeskButton
      variant="secondary"
      data-lead-shortcut="t"
      aria-keyshortcuts="T"
      // Pressing it again is harmless (it re-stamps today), so it stays live
      // while in flight; only a second press during the same round-trip is
      // lost, and it would have been a no-op.
      aria-busy={pending || undefined}
      aria-pressed={touchedToday}
      title={touchedToday ? "Last worked today" : `Last worked ${worked} ago`}
      className={touchedToday ? "bg-desk-sunken" : undefined}
      onClick={() =>
        startTransition(async () => {
          setWorked("today")
          hapticTick()
          try {
            await markTouched(id)
          } catch {
            toast.error("Couldn't mark them touched")
          }
        })
      }
    >
      {touchedToday ? <Check aria-hidden /> : null}
      Touched today
      <KeyHint>T</KeyHint>
    </DeskButton>
  )
}
