import * as React from "react"

import { cn } from "../../lib/utils"

// DESK TIER — the priority tag.
//
// Priority reads as a mono tag, never a pill: P0 in the danger tint and
// bold, P1 in ink and bold, P2 muted. Anything else — no priority, an
// unknown value — renders nothing, so a row never shows an empty slot.
// Accepts the stub's own spelling ("p1", "P1").
//
// Requires "@jamie-nisbet/ui/desk.css".

const priorityStyles = {
  P0: "font-semibold text-desk-blocked",
  P1: "font-semibold text-desk-fg",
  P2: "font-normal text-desk-fg-3",
} as const

type DeskPriority = keyof typeof priorityStyles

type PriorityTagProps = Omit<React.ComponentProps<"span">, "children"> & {
  priority?: string | null
}

function PriorityTag({ priority, className, ...props }: PriorityTagProps) {
  const key = priority?.trim().toUpperCase()
  if (key !== "P0" && key !== "P1" && key !== "P2") return null

  return (
    <span
      data-slot="priority-tag"
      data-priority={key}
      className={cn(
        "shrink-0 font-mono text-desk-micro tabular-nums",
        priorityStyles[key],
        className
      )}
      {...props}
    >
      <span className="sr-only">Priority </span>
      {key}
    </span>
  )
}

export { PriorityTag, type DeskPriority, type PriorityTagProps }
