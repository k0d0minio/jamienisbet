"use client"

import { useTransition } from "react"
import { Check } from "lucide-react"

import { Button } from "@jamie-nisbet/ui"

import { markTouched } from "@/app/(app)/actions"

// "I spoke to them today." Status changes and profile edits already stamp the
// lead as worked; this covers the call or email that happened somewhere else,
// which is what keeps the staleness sort on the leads list honest.
export function MarkTouchedButton({
  id,
  // Pre-formatted on the server ("today", "12 days") — the elapsed time can't
  // be worked out here without calling Date.now() during a render.
  lastWorked,
}: {
  id: string
  lastWorked: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => markTouched(id))}
      title={`Last worked ${lastWorked === "today" ? "today" : `${lastWorked} ago`}`}
    >
      <Check />
      {pending ? "Saving…" : "Mark touched"}
    </Button>
  )
}
