"use client"

import { useOptimistic, useState, useTransition } from "react"
import { Check, Signpost } from "lucide-react"

import {
  GroupedRow,
  GroupedSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

// Where the lead sits on the ladder — the field changed most often on this
// screen, so it is the first row of the first group and it opens a sheet
// rather than a dropdown: seven rungs as full-width rows, hittable one-handed
// without aiming, instead of a 36px menu at the top of the page. The sheet
// sizes to its content and scrolls if the last rung falls past the fold, which
// is the price of the two the cold pool added and cheaper than nesting them.
export function LeadStatusRow({ id, value }: { id: string; value: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  // The row reads as the new rung the moment the sheet closes, not a
  // round-trip later. `value` is the server's answer: when the action lands
  // the optimistic layer falls away onto it, so a rejected change rolls back
  // on its own and only the toast has to be written by hand.
  const [status, setStatus] = useOptimistic(value)

  const current = STATUSES.find((s) => s.value === status)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <GroupedRow
          icon={<Signpost />}
          label="Status"
          value={current?.label ?? status}
          aria-busy={pending || undefined}
        />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Status</SheetTitle>
          <SheetDescription>
            Where they sit on the ladder. Moving them also stamps them as
            worked today.
          </SheetDescription>
        </SheetHeader>
        <GroupedSection>
          {STATUSES.map((option) => (
            <GroupedRow
              key={option.value}
              label={option.label}
              description={option.hint}
              chevron={false}
              value={
                option.value === status ? (
                  <Check className="size-4 text-app-tint" aria-hidden />
                ) : undefined
              }
              aria-current={option.value === status || undefined}
              onClick={() => {
                setOpen(false)
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
            />
          ))}
        </GroupedSection>
      </SheetContent>
    </Sheet>
  )
}
