import * as React from "react"

import { cn } from "../../lib/utils"

// APP TIER — the glance row.
//
// What a screen adds up to, under its large title: two or three figures set
// side by side in mono with a word under each. It is the app tier's answer to
// the subtitle sentence — a sentence has to be *read*, and the point of a
// masthead figure is that you take it in without reading.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <LargeTitleHeader title="Leads">
//     <GlanceRow>
//       <GlanceFigure value="€12,400" label="In play" />
//       <GlanceFigure value="€2,100" label="Per month" />
//     </GlanceRow>
//   </LargeTitleHeader>
//
// It is deliberately not `Stat`: that one is the marketing tier's tile — a
// display-size figure with a delta and a sparkline, sized to hold a card of
// its own. This is chrome. Three of these have to fit across a phone under a
// 34px title without pushing the list off the screen, so they run at the app
// tier's title-3 step and carry nothing but the number and its word.
//
// A figure the screen has none of is *omitted* here rather than shown as a
// zero, which is the opposite of the ActionCircle rule next door — an action
// is a fixed vocabulary whose shape should be learnable, while a total of
// nothing is noise, not news.

function GlanceRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glance-row"
      // Wraps rather than scrolls: there are never enough of these to need a
      // rail, and a masthead that scrolls sideways is a masthead you can lose.
      className={cn("mt-2 flex flex-wrap items-start gap-x-6 gap-y-2", className)}
      {...props}
    />
  )
}

function GlanceFigure({
  value,
  valueLabel,
  label,
  tone = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** The figure, pre-formatted by the caller (currency, units, compaction). */
  value: React.ReactNode
  /** Spoken form, when the rendered figure is compacted or symbol-led. */
  valueLabel?: string
  /** One or two words under it, sentence case — "In play", "Per month". */
  label: React.ReactNode
  /** `attention` tints the figure with the muted destructive step, for a
   *  total that is a problem rather than a fact (overdue, unpaid). */
  tone?: "default" | "attention"
}) {
  return (
    <div
      data-slot="glance-figure"
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    >
      <span
        data-slot="glance-figure-value"
        // Mono, tabular, and the tier's title-3 step: big enough to be the
        // thing you see after the title, small enough that three fit.
        className={cn(
          "font-mono text-app-title-3 font-semibold tabular-nums",
          tone === "attention" ? "text-destructive" : "text-app-label"
        )}
        aria-hidden={valueLabel ? true : undefined}
      >
        {value}
      </span>
      {valueLabel && <span className="sr-only">{valueLabel}</span>}
      <span
        data-slot="glance-figure-label"
        className="truncate text-app-caption text-app-label-3"
      >
        {label}
      </span>
    </div>
  )
}

export { GlanceRow, GlanceFigure }
