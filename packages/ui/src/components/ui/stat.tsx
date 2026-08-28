import * as React from "react"

import { cn } from "../../lib/utils"

// Brand: the canonical way a number appears on an operating screen — mono
// figure carrying the weight, sentence-case label above it, and optional
// delta and sparkline beside it. Renders from plain props; no data fetching.
const valueSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const

const labelSize = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
} as const

function Stat({
  label,
  value,
  valueLabel,
  unit,
  delta,
  trend,
  caption,
  size = "md",
  bordered = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Sentence case, no trailing colon — e.g. "Collected this month". */
  label: React.ReactNode
  /** The figure. Pre-formatted by the caller (currency, compaction, units). */
  value: React.ReactNode
  /** Spoken form of a compacted figure, e.g. "12,940" behind a rendered "12.9K". */
  valueLabel?: string
  /** Small mono suffix set beside the figure, e.g. "%" or "leads". */
  unit?: React.ReactNode
  /** A `<Delta />`, baseline-aligned with the figure. */
  delta?: React.ReactNode
  /** A `<Sparkline />` under the figure. */
  trend?: React.ReactNode
  /** Muted supporting line, e.g. "vs the 30 days before". */
  caption?: React.ReactNode
  size?: keyof typeof valueSize
  /** Wrap in the brand's hairline card instead of sitting bare in a grid. */
  bordered?: boolean
}) {
  return (
    <div
      data-slot="stat"
      className={cn(
        "flex min-w-0 flex-col gap-1.5",
        bordered && "rounded-lg border bg-card p-5",
        className
      )}
      {...props}
    >
      <span data-slot="stat-label" className={cn("text-muted-foreground", labelSize[size])}>
        {label}
      </span>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          data-slot="stat-value"
          // Proportional mono, not tabular: a standalone figure at display
          // size shouldn't be padded out to uniform digit widths.
          className={cn(
            "font-mono font-semibold tracking-tight text-foreground",
            valueSize[size]
          )}
          aria-hidden={valueLabel ? true : undefined}
        >
          {value}
          {unit != null && (
            <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
          )}
        </span>
        {valueLabel && (
          <span className="sr-only">
            {valueLabel}
            {typeof unit === "string" ? ` ${unit}` : ""}
          </span>
        )}
        {delta}
      </div>

      {trend != null && <div data-slot="stat-trend" className="pt-0.5">{trend}</div>}

      {caption != null && (
        <p data-slot="stat-caption" className="text-xs text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  )
}

export { Stat }
