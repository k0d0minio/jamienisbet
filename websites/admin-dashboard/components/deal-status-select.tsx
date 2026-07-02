"use client"

import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jamie-nisbet/ui"

import { updateDealStatusAction } from "@/app/(app)/deals/actions"

// Mirrors dealStatuses in @jamie-nisbet/services (the server action is the
// authority — it re-validates). Kept local so this client component doesn't
// pull the services barrel (and its DB client) into the browser bundle.
const STATUSES = ["new", "qualified", "proposed", "won", "lost"] as const

export function DealStatusSelect({ id, value }: { id: string; value: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Select
      defaultValue={value}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(() => updateDealStatusAction(id, next))
      }
    >
      <SelectTrigger size="sm" className="w-32 capitalize">
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
