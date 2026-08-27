import * as React from "react"

import { cn } from "../../lib/utils"

// Brand: part-of-whole as a thin bar — hairline track, flat brand fill,
// no gradients. The figures around it stay mono.
type MeterTone = "primary" | "success" | "warning" | "danger" | "muted"

const fillClass: Record<MeterTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-muted-foreground",
}

const sizeClass = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
} as const

function Meter({
  value,
  max = 100,
  label,
  valueLabel,
  tone = "primary",
  size = "md",
  className,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** The filled part. Clamped to `0…max`. */
  value: number
  /** The whole. Default 100, so a bare `value` reads as a percentage. */
  max?: number
  /** Caption on the left of the bar. Doubles as the bar's accessible name when it's a string. */
  label?: React.ReactNode
  /** Mono figure on the right, e.g. "€3,120 of €12,480". Also the spoken value. */
  valueLabel?: React.ReactNode
  tone?: MeterTone
  size?: keyof typeof sizeClass
}) {
  const safeMax = max > 0 ? max : 0
  const safeValue = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax)
  const percent = safeMax === 0 ? 0 : (safeValue / safeMax) * 100

  // The bar itself carries the accessible name: a string `label` names it,
  // and an explicit `aria-label` moves onto the bar rather than the wrapper.
  const name = ariaLabel ?? (typeof label === "string" ? label : undefined)
  const spoken =
    typeof valueLabel === "string"
      ? valueLabel
      : `${safeValue} of ${safeMax}`

  return (
    <div
      data-slot="meter"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {(label != null || valueLabel != null) && (
        <div className="flex items-baseline justify-between gap-3">
          {label != null && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
          {valueLabel != null && (
            <span className="ml-auto font-mono text-xs tabular-nums text-foreground">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <div
        data-slot="meter-track"
        role="meter"
        aria-label={name}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuetext={spoken}
        className={cn(
          "w-full overflow-hidden rounded-full border border-border bg-muted",
          sizeClass[size]
        )}
      >
        <div
          data-slot="meter-fill"
          className={cn("h-full rounded-full", fillClass[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export { Meter, type MeterTone }
