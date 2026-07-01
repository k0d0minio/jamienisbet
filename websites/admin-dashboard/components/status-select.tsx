"use client"

import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jamie-nisbet/ui"

import { updateReferralStatus } from "@/app/(app)/leads/actions"

const STATUSES = ["new", "contacted", "won", "lost"] as const

export function StatusSelect({ id, value }: { id: string; value: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Select
      defaultValue={value}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(() => updateReferralStatus(id, next))
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
