import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"

// DESK TIER — the status dot.
//
// State is a dot, not a colour field (D-3). Five states, one mark each:
//
//   next     filled ink — runnable now, its dependencies are met
//   open     a hollow ring — queued behind something
//   running  warning — launched, or a run and draft PR exist
//   blocked  danger — the row says why
//   done     a small check in success — shown dimmed in an epic
//
// The mark is decoration; the state is always spoken as text beside it
// (visually hidden by default), so colour never carries meaning alone. Pass
// `label` to say more than the state's name ("Blocked — waiting on deposit").
//
// Requires "@jamie-nisbet/ui/desk.css".

type DeskStatus = "next" | "open" | "running" | "blocked" | "done"

const statusLabels: Record<DeskStatus, string> = {
  next: "Next",
  open: "Open",
  running: "Running",
  blocked: "Blocked",
  done: "Done",
}

const dotStyles: Record<Exclude<DeskStatus, "done">, string> = {
  next: "bg-desk-ink",
  open: "border-(length:--desk-dot-ring) border-desk-fg-3",
  running: "bg-desk-running",
  blocked: "bg-desk-blocked",
}

type StatusDotProps = React.ComponentProps<"span"> & {
  status: DeskStatus
  /** The spoken state. Defaults to the state's name. */
  label?: string
  /** Show the label beside the mark instead of hiding it. */
  showLabel?: boolean
}

function StatusDot({
  status,
  label,
  showLabel = false,
  className,
  ...props
}: StatusDotProps) {
  const text = label ?? statusLabels[status]

  return (
    <span
      data-slot="status-dot"
      data-status={status}
      className={cn("inline-flex shrink-0 items-center gap-2", className)}
      {...props}
    >
      {status === "done" ? (
        <CheckIcon
          aria-hidden
          strokeWidth={2.5}
          className="size-desk-check shrink-0 text-desk-done"
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "size-desk-dot shrink-0 rounded-full",
            dotStyles[status]
          )}
        />
      )}
      <span className={showLabel ? undefined : "sr-only"}>{text}</span>
    </span>
  )
}

export { StatusDot, statusLabels, type DeskStatus, type StatusDotProps }
