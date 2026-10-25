import * as React from "react"

import { cn } from "../../lib/utils"

// Brand primitive: the mono, uppercase, wide-tracked label that opens
// sections and cards (e.g. "SELECTED WORK"). No shadcn equivalent.
function Eyebrow({
  className,
  rule = false,
  primary = false,
  index,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  /** Prepend a short horizontal rule. */
  rule?: boolean
  /** Tint with the brand primary instead of muted. */
  primary?: boolean
  /** Optional leading index, e.g. "01". */
  index?: React.ReactNode
}) {
  return (
    <span
      data-slot="eyebrow"
      className={cn(
        "inline-flex items-center gap-2 font-mono text-2xs font-medium tracking-[0.12em] uppercase",
        primary ? "text-primary" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {rule && <span aria-hidden className="h-px w-6 bg-current opacity-60" />}
      {index != null && <span className="text-foreground">{index}</span>}
      {children}
    </span>
  )
}

export { Eyebrow }
