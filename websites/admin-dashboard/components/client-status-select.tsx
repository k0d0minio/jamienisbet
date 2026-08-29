"use client"

import { useOptimistic, useTransition } from "react"

import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  toast,
} from "@jamie-nisbet/ui"

import { updateClientStatus } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Mirrors clientStatuses (and their labels) in @jamie-nisbet/services — the
// server action is the authority (it re-validates). Kept local so this client
// component doesn't pull the services barrel (and its DB client) into the
// browser bundle.
const STATUSES = [
  { value: "lead", label: "Lead" },
  { value: "discussing", label: "In discussion" },
  { value: "active", label: "Active client" },
  { value: "past", label: "Past client" },
  { value: "not_won", label: "Not won" },
] as const

// Where a lead sits on the ladder, changed without leaving the list. It is the
// desktop row's affordance: from `md` up the row has width for the status to
// be a control rather than a word, and a menu anchored to it beats a sheet on a
// pointer — the desktop half of "one design that grows".
//
// A menu button in a row, not a form field: no box, no shadow, the value set in
// the tint with a chevron after it, the way a pull-down menu reads on this
// tier. That is the app tier select's `plain` trigger — it used to be ten lines
// of overrides stripping the marketing field back down to this. It is 44px by
// construction now, rather than by the coarse-pointer floor that used to lift
// every select trigger in the app, so an iPad at this width can still hit it.
//
// On a phone the same change is made on the lead's own page, where it is the
// first row of the first group and opens a sheet of five full-width rungs
// (components/lead-status-row.tsx) — one tap away, and hittable without aiming.
export function ClientStatusSelect({
  id,
  value,
  // A fixed column rather than a control that shrinks to its word. The rows
  // are one flex line each, so a "Lead" three characters shorter than an
  // "In discussion" moved everything to its left — and the values, which are
  // the one thing on this screen you read *down*, came out ragged.
  className = "w-36",
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
    <AppSelect
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
      <AppSelectTrigger variant="plain" className={className}>
        <AppSelectValue />
      </AppSelectTrigger>
      <AppSelectContent>
        {STATUSES.map((option) => (
          <AppSelectItem key={option.value} value={option.value}>
            {option.label}
          </AppSelectItem>
        ))}
      </AppSelectContent>
    </AppSelect>
  )
}
