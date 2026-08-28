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

// Mirrors clientStatuses in @jamie-nisbet/services (the server action is the
// authority — it re-validates). Kept local so this client component doesn't
// pull the services barrel (and its DB client) into the browser bundle.
const STATUSES = ["new", "talking", "client", "lost"] as const

export function ClientStatusSelect({
  id,
  value,
  // Callers size the trigger: a phone row wants it narrow, a lead's page wants
  // it full-width so it's a proper target rather than a desktop-sized dropdown.
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
    <Select
      // Controlled by the optimistic value rather than `defaultValue`, or the
      // trigger would keep showing whatever it was first mounted with.
      value={status}
      // Still readable while it's in flight — only a second change is refused.
      aria-busy={pending || undefined}
      onValueChange={(next) =>
        startTransition(async () => {
          setStatus(next)
          try {
            await updateClientStatus(id, next)
          } catch {
            toast.error("Couldn't change the status — put it back")
          }
        })
      }
    >
      <SelectTrigger size="sm" className={cn("capitalize", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((option) => (
          <SelectItem key={option} value={option} className="capitalize">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
