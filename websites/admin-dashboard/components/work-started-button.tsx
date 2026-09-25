"use client"

import { useOptimistic, useTransition } from "react"
import { Hammer } from "lucide-react"

import { DeskButton, toast } from "@jamie-nisbet/ui"

import { setWorkStarted } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// "I've started." A flag of its own rather than another status, because it is
// orthogonal to where the deal sits: delivery often begins on a handshake
// before anything is signed, and on a barter or equity-only engagement there is
// no first invoice in Stripe to mark the moment. It sits in the lead's action
// bar beside Touched — this is something you tap once, on a phone, on the day
// it happens, not a field you'd scroll down to the profile to edit and save.
export function WorkStartedButton({
  id,
  // Pre-formatted on the server, or null when work hasn't started — the date
  // can't be rendered here without formatting during a render.
  startedOn,
}: {
  id: string
  startedOn: string | null
}) {
  const [pending, startTransition] = useTransition()
  // The label flips on the press. `startedOn !== null` is the server's
  // answer underneath, so a refused write puts the button back where it was.
  const [started, setStarted] = useOptimistic(startedOn !== null)

  return (
    <DeskButton
      variant="ghost"
      aria-busy={pending || undefined}
      aria-pressed={started}
      title={
        started
          ? `Work started${startedOn ? ` ${startedOn}` : ""} — press to undo`
          : "Mark the work as begun"
      }
      onClick={() =>
        startTransition(async () => {
          setStarted(!started)
          hapticTick()
          try {
            await setWorkStarted(id, !started)
          } catch {
            toast.error("Couldn't change whether work has started")
          }
        })
      }
    >
      <Hammer aria-hidden />
      {/* Named for the state it is in — the same "this is on" cue the
          Started badge gives on the leads list. */}
      {started ? `Started${startedOn ? ` ${startedOn}` : ""}` : "Start work"}
    </DeskButton>
  )
}
