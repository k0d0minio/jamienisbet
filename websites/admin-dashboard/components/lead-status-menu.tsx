"use client"

import { useOptimistic, useTransition } from "react"
import { Check, ChevronDown } from "lucide-react"

import {
  DeskMenu,
  DeskMenuContent,
  DeskMenuItem,
  DeskMenuTrigger,
  toast,
} from "@jamie-nisbet/ui"

import { updateClientStatus } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Mirrors clientStatuses (and their labels/hints, `clientStatusLabels` and
// `clientStatusHints`) in @jamie-nisbet/services — the server action is the
// authority (it re-validates). Kept local so this client component doesn't pull
// the services barrel (and its DB client) into the browser bundle. One of three
// copies of this vocabulary in the dashboard, and they are kept in the ladder's
// own order: the cold pool first, then the rungs a relationship climbs.
const STATUSES = [
  {
    value: "prospect",
    label: "Prospect",
    hint: "Imported, working the cadence, hasn't engaged",
  },
  { value: "nurture", label: "Nurture", hint: "Parked; wakes on a date" },
  { value: "lead", label: "Lead", hint: "Came in, not spoken to yet" },
  { value: "discussing", label: "In discussion", hint: "Conversation or negotiation running" },
  { value: "active", label: "Active client", hint: "Work agreed or under way" },
  { value: "past", label: "Past client", hint: "Engagement over, relationship kept" },
  { value: "not_won", label: "Not won", hint: "Didn't happen" },
] as const

/** Where they sit, said in the head as a word you can press: a menu of the
 *  rungs, each with what it means. Moving them also stamps them as worked
 *  today — the server action's doing, unchanged. */
export function LeadStatusMenu({ id, value }: { id: string; value: string }) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useOptimistic(value)

  const current = STATUSES.find((s) => s.value === status)

  return (
    <DeskMenu>
      <DeskMenuTrigger
        aria-busy={pending || undefined}
        aria-label={`Status: ${current?.label ?? status}. Change it`}
        className="-mx-1 inline-flex items-center gap-0.5 rounded-desk-control px-1 font-semibold text-desk-fg transition-colors duration-100 hover:bg-desk-sunken"
      >
        {current?.label ?? status}
        <ChevronDown className="size-3 text-desk-fg-3" aria-hidden />
      </DeskMenuTrigger>
      <DeskMenuContent align="start">
        {STATUSES.map((option) => (
          <DeskMenuItem
            key={option.value}
            description={option.hint}
            aria-current={option.value === status || undefined}
            onSelect={() => {
              if (option.value === status) return
              startTransition(async () => {
                setStatus(option.value)
                hapticTick()
                try {
                  await updateClientStatus(id, option.value)
                } catch {
                  toast.error("Couldn't change the status — put it back")
                }
              })
            }}
          >
            <span className="flex items-center gap-2">
              {option.label}
              {option.value === status ? (
                <Check className="size-3.5 text-desk-fg" aria-hidden />
              ) : null}
            </span>
          </DeskMenuItem>
        ))}
      </DeskMenuContent>
    </DeskMenu>
  )
}
