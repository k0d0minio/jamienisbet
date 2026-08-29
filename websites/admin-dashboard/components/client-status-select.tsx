"use client"

import { useOptimistic, useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { updateClientStatus } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Mirrors clientStatuses in @jamie-nisbet/services (the server action is the
// authority — it re-validates). Kept local so this client component doesn't
// pull the services barrel (and its DB client) into the browser bundle.
const STATUSES = ["new", "talking", "client", "lost"] as const

// Where a lead sits on the ladder, changed without leaving the list. It is the
// desktop row's affordance: from `md` up the row has width for the status to
// be a control rather than a word, and a menu anchored to it beats a sheet on a
// pointer — the desktop half of "one design that grows".
//
// A menu button in a row, not a form field: no box, no shadow, the value set in
// the tint with a chevron after it, the way a pull-down menu reads on this
// tier. The 44px floor still applies on a coarse pointer (globals.css lifts
// every select trigger), so an iPad at this width can hit it.
//
// On a phone the same change is made on the lead's own page, where it is the
// first row of the first group and opens a sheet of four full-width rungs
// (components/lead-status-row.tsx) — one tap away, and hittable without aiming.
export function ClientStatusSelect({
  id,
  value,
  // A fixed column rather than a control that shrinks to its word. The rows
  // are one flex line each, so a "New" three characters shorter than a
  // "Talking" moved everything to its left — and the values, which are the
  // one thing on this screen you read *down*, came out ragged.
  className = "w-28",
}: {
  id: string
  value: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  // The trigger reads as the new status the moment the sheet closes, not a
  // round-trip later. `value` is the server's answer: when the action lands the
  // optimistic layer falls away onto it, so a rejected change rolls back on its
  // own and only the toast has to be written by hand.
  const [status, setStatus] = useOptimistic(value)

  return (
    <Select
      // Controlled by the optimistic value rather than `defaultValue`, or the
      // trigger would keep showing whatever it was first mounted with.
      value={status}
      // Still readable while it's in flight — only a second change is refused.
      aria-busy={pending || undefined}
      onValueChange={(next) =>
        startTransition(async () => {
          setStatus(next)
          hapticTick()
          try {
            await updateClientStatus(id, next)
          } catch {
            toast.error("Couldn't change the status — put it back")
          }
        })
      }
    >
      <SelectTrigger
        size="sm"
        className={cn(
          // Strip the field: a row's control is the value plus a chevron.
          // Left-aligned inside its fixed column, so the chevron stays with
          // the word instead of drifting to the far edge of the slot.
          "justify-start gap-1 rounded-app-control border-0 bg-transparent px-2 shadow-none",
          "min-h-app-touch text-app-subhead font-medium text-app-tint capitalize",
          "transition-colors spring-press hover:bg-app-press active:bg-app-press",
          "dark:bg-transparent dark:hover:bg-app-press",
          "[&_svg:not([class*='text-'])]:text-app-tint",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-app-control shadow-app-popover">
        {STATUSES.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="text-app-subhead capitalize"
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
