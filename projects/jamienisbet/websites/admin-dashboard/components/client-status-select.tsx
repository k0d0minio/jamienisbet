"use client"

import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
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

  return (
    <Select
      defaultValue={value}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(() => updateClientStatus(id, next))
      }
    >
      <SelectTrigger size="sm" className={cn("capitalize", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="capitalize">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
