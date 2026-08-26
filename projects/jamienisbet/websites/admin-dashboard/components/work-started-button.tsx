"use client"

import { useTransition } from "react"
import { Hammer } from "lucide-react"

import { Button } from "@jamie-nisbet/ui"

import { setWorkStarted } from "@/app/(app)/actions"

// "I've started." A flag of its own rather than another status, because it is
// orthogonal to where the deal sits: delivery often begins on a handshake
// before anything is signed, and on a barter or equity-only engagement there is
// no first invoice in Stripe to mark the moment. It sits in the action rail
// beside Mark touched — this is something you tap once, on a phone, on the day
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
  const started = startedOn !== null

  return (
    <Button
      type="button"
      // Filled while running, outlined while not — the same "this is on" cue the
      // Started badge gives on the leads list.
      variant={started ? "default" : "outline"}
      size="sm"
      className="shrink-0"
      aria-pressed={started}
      disabled={pending}
      onClick={() => startTransition(() => setWorkStarted(id, !started))}
      title={
        started
          ? `Work started ${startedOn} — tap to undo`
          : "Mark the work as begun"
      }
    >
      <Hammer />
      {pending ? "Saving…" : started ? "Working" : "Work started"}
    </Button>
  )
}
