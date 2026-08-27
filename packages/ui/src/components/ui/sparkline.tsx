import * as React from "react"

import { cn } from "../../lib/utils"

// Brand: a hairline shape, not a chart — no axes, no gridlines, no tooltips,
// no chart library. Inline SVG, stroke in currentColor so the tone class (a
// semantic token) drives the colour and it flips with the theme.
type SparklineTone = "primary" | "success" | "warning" | "danger" | "muted"

const toneClass: Record<SparklineTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  muted: "text-muted-foreground",
}

const round = (n: number) => Math.round(n * 100) / 100
const compact = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
})

function Sparkline({
  data,
  width = 96,
  height = 24,
  strokeWidth = 1.5,
  area = false,
  marker = false,
  fluid = false,
  tone = "primary",
  min,
  max,
  label,
  decorative = false,
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "children"> & {
  /** The series, oldest first. Non-finite entries are dropped. */
  data: number[]
  width?: number
  height?: number
  /** Hairline by default — the brand's 1.5px stroke. */
  strokeWidth?: number
  /** Wash the area under the line at 10% of the same hue. */
  area?: boolean
  /** Dot the latest point, ringed in the surface colour so it stays legible. */
  marker?: boolean
  /** Stretch to the container width. `width`/`height` then only set the aspect the shape is drawn at; the stroke stays hairline. */
  fluid?: boolean
  tone?: SparklineTone
  /** Fix the scale's floor/ceiling — otherwise it fits the data. */
  min?: number
  max?: number
  /** Spoken description. Defaults to a summary of the series. */
  label?: string
  /** Drop it from the accessibility tree when nearby text already says what it shows. */
  decorative?: boolean
}) {
  const values = data.filter((v) => Number.isFinite(v))
  const markerRadius = 2
  const pad = marker ? markerRadius + strokeWidth : strokeWidth
  const spanX = Math.max(width - pad * 2, 0)
  const spanY = Math.max(height - pad * 2, 0)

  const lo = min ?? (values.length ? Math.min(...values) : 0)
  const hi = max ?? (values.length ? Math.max(...values) : 0)
  const range = hi - lo

  const points = values.map((v, i) => ({
    x: round(values.length === 1 ? width / 2 : pad + (i * spanX) / (values.length - 1)),
    // A flat series (or a fixed scale with no range) sits on the mid-line
    // rather than pinning to the floor, which would read as a collapse.
    y: round(range === 0 ? height / 2 : height - pad - ((v - lo) / range) * spanY),
  }))

  // Under `fluid` the viewBox stretches non-uniformly, so strokes are kept in
  // screen space and the marker is drawn as a round-capped zero-length stroke
  // — a circle would come out an ellipse.
  const vectorEffect = fluid ? "non-scaling-stroke" : undefined

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ")
  const last = points[points.length - 1]

  const a11y: Pick<
    React.ComponentProps<"svg">,
    "role" | "aria-label" | "aria-hidden"
  > = decorative
    ? { "aria-hidden": true }
    : {
        role: "img",
        "aria-label":
          label ??
          (values.length
            ? `Trend: ${values.length} points, low ${compact.format(lo)}, high ${compact.format(hi)}, latest ${compact.format(values[values.length - 1])}.`
            : "Trend: no data."),
      }

  return (
    <svg
      data-slot="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? "none" : undefined}
      fill="none"
      className={cn(
        fluid ? "block w-full" : "block shrink-0",
        toneClass[tone],
        className
      )}
      {...a11y}
      {...props}
    >
      {values.length === 0 ? (
        // Empty state: a hairline baseline, so the slot keeps its shape
        // instead of collapsing into a gap.
        <line
          x1={pad}
          x2={width - pad}
          y1={height / 2}
          y2={height / 2}
          className="stroke-border"
          strokeWidth={1}
          vectorEffect={vectorEffect}
        />
      ) : (
        <>
          {area && points.length > 1 && (
            <path
              d={`${line} L${last.x} ${height} L${points[0].x} ${height} Z`}
              className="fill-current opacity-10"
            />
          )}
          <path
            d={points.length === 1 ? `${line} L${last.x} ${last.y}` : line}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect={vectorEffect}
          />
          {marker && (
            <>
              {/* A 2px ring in the surface colour, then the dot itself. */}
              <path
                d={`M${last.x} ${last.y} L${last.x} ${last.y}`}
                className="stroke-card"
                strokeWidth={markerRadius * 2 + 4}
                strokeLinecap="round"
                vectorEffect={vectorEffect}
              />
              <path
                d={`M${last.x} ${last.y} L${last.x} ${last.y}`}
                stroke="currentColor"
                strokeWidth={markerRadius * 2}
                strokeLinecap="round"
                vectorEffect={vectorEffect}
              />
            </>
          )}
        </>
      )}
    </svg>
  )
}

export { Sparkline, type SparklineTone }
