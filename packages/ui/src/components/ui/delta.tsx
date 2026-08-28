import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Brand: the "↗ +12%" idiom — mono figure, unicode arrow, muted semantic
// colour. Up is not always good, so the caller declares the polarity and the
// component picks the tone from it. Nothing here fetches or derives data.
const deltaVariants = cva(
  "inline-flex items-baseline gap-1 font-mono tabular-nums whitespace-nowrap",
  {
    variants: {
      tone: {
        positive: "text-success",
        negative: "text-destructive",
        neutral: "text-muted-foreground",
      },
      size: {
        sm: "text-2xs",
        md: "text-xs",
        lg: "text-sm",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
)

/** Which direction of change is the good one. */
type DeltaPolarity = "up-good" | "up-bad" | "none"

const ARROW = { up: "↗", down: "↘", flat: "→" } as const
const DIRECTION_WORD = { up: "Up", down: "Down", flat: "No change" } as const

function toneFor(
  direction: keyof typeof ARROW,
  polarity: DeltaPolarity
): NonNullable<VariantProps<typeof deltaVariants>["tone"]> {
  if (direction === "flat" || polarity === "none") return "neutral"
  const good = polarity === "up-good" ? "up" : "down"
  return direction === good ? "positive" : "negative"
}

// Fixed locale so the server and client render the same string.
function formatSigned(value: number, precision?: number) {
  const digits =
    precision ?? (Number.isInteger(value) ? 0 : Math.abs(value) < 10 ? 1 : 0)
  return new Intl.NumberFormat("en-GB", {
    signDisplay: "exceptZero",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function Delta({
  value,
  polarity = "up-good",
  unit = "",
  precision,
  format,
  comparison,
  size,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  Pick<VariantProps<typeof deltaVariants>, "size"> & {
    /** The change itself, signed. `0` renders flat and always reads neutral. */
    value: number
    /** Whether a rise is good news. Default `"up-good"`; `"none"` never tints. */
    polarity?: DeltaPolarity
    /** Suffix on the default figure, e.g. `"%"` or `" pts"`. */
    unit?: string
    /** Fractional digits for the default figure. Default: 0 for integers, else 1. */
    precision?: number
    /** Replace the figure entirely, e.g. `(v) => currency(v)`. Sign and arrow still come from `value`. */
    format?: (value: number) => string
    /** What the change is measured against, e.g. "vs last week". Muted, and read out after the figure. */
    comparison?: React.ReactNode
  }) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat"
  const tone = toneFor(direction, polarity)
  const figure = format ? format(value) : `${formatSigned(value, precision)}${unit}`

  return (
    <span
      data-slot="delta"
      data-direction={direction}
      data-tone={tone}
      className={cn(deltaVariants({ tone, size }), className)}
      {...props}
    >
      <span aria-hidden>{ARROW[direction]}</span>
      {/* The arrow is decorative; the direction still has to be spoken. */}
      <span className="sr-only">{DIRECTION_WORD[direction]}</span>
      <span>{figure}</span>
      {comparison != null && (
        <span className="font-normal text-muted-foreground">{comparison}</span>
      )}
    </span>
  )
}

export { Delta, deltaVariants, type DeltaPolarity }
