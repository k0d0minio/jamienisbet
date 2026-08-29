"use client"

import { useOptimistic, useTransition } from "react"
import { Check } from "lucide-react"

import { ActionCircle, toast } from "@jamie-nisbet/ui"

import { markTouched } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// "I spoke to them today." Status changes and profile edits already stamp the
// lead as worked; this covers the call or email that happened somewhere else,
// which is what keeps the staleness sort on the leads list honest.
//
// One of the discs in the lead's action row — a thing you tap once, on a
// phone, on the day it happens.
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
  // The disc is its own receipt: it fills on the tap and stays filled, because
  // that is what the server will say too. If the write fails the optimistic
  // layer falls away onto `lastWorked` and it reads as it did before.
  const [worked, setWorked] = useOptimistic(lastWorked)
  const touchedToday = worked === "today"

  return (
    <ActionCircle
      icon={<Check />}
      label="Touched"
      on={touchedToday}
      // Tapping it again is harmless (it re-stamps today), so it stays live
      // while in flight; only a second tap during the same round-trip is lost,
      // and it would have been a no-op.
      aria-busy={pending || undefined}
      aria-pressed={touchedToday}
      title={touchedToday ? "Last worked today" : `Last worked ${worked} ago`}
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
    />
  )
}
