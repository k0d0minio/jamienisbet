"use client"

import { useOptimistic, useTransition } from "react"
import { Check } from "lucide-react"

import { Button, toast } from "@jamie-nisbet/ui"

import { markTouched } from "@/app/(app)/actions"

// "I spoke to them today." Status changes and profile edits already stamp the
// lead as worked; this covers the call or email that happened somewhere else,
// which is what keeps the staleness sort on the leads list honest.
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
  // The button is its own receipt: it flips to "Touched today" on the tap and
  // stays there, because that is what the server will say too. If the write
  // fails the optimistic layer falls away onto `lastWorked` and it reads as it
  // did before.
  const [worked, setWorked] = useOptimistic(lastWorked)
  const touchedToday = worked === "today"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      // The action rail scrolls sideways rather than squeezing its buttons —
      // with "Work started" alongside, an unpinned one would compress first.
      className="shrink-0"
      // Tapping it again is harmless (it re-stamps today), so it stays live
      // while in flight; only a second tap during the same round-trip is lost,
      // and it would have been a no-op.
      aria-busy={pending || undefined}
      onClick={() =>
        startTransition(async () => {
          setWorked("today")
          try {
            await markTouched(id)
          } catch {
            toast.error("Couldn't mark them touched")
          }
        })
      }
      title={
        touchedToday
          ? "Last worked today"
          : `Last worked ${worked} ago`
      }
    >
      <Check className={touchedToday ? "text-success" : undefined} />
      {touchedToday ? "Touched today" : "Mark touched"}
    </Button>
  )
}
