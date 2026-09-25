"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

// DESK TIER — the dense segmented control.
//
// Two to four mutually exclusive views of the same thing, shown at once:
// Table / Board, All / Open / Clients. A sunken track with a 2px inset; the
// chosen option sits on the surface with a hairline — flat, no lift.
//
//   <DeskSegmentedControl
//     aria-label="Leads view"
//     value={view}
//     onValueChange={setView}
//     options={[{ value: "table", label: "Table" }, { value: "board", label: "Board" }]}
//   />
//
// A radio group, operated like one: Tab reaches the chosen option, the arrow
// keys (and Home / End) move the choice and the focus together. A URL-backed
// view does its navigation in onValueChange.
//
// Requires "@jamie-nisbet/ui/desk.css".

type DeskSegmentedOption<T extends string> = {
  value: T
  label: React.ReactNode
  /** How many things are behind this option. Set in mono. */
  count?: number
  disabled?: boolean
}

type DeskSegmentedControlProps<T extends string> = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  options: DeskSegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
}

function DeskSegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: DeskSegmentedControlProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const enabled = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled)

  // The roving tab stop: the checked option, or the first enabled one when
  // nothing enabled is checked — so Tab always reaches the group.
  const checkedEnabled = enabled.some(({ option }) => option.value === value)
  const stop = checkedEnabled
    ? options.findIndex((option) => option.value === value)
    : (enabled[0]?.index ?? -1)

  // Moves from the focused option, not from `value`: a URL-backed caller
  // updates `value` only after navigating, and two quick presses must still
  // move two steps.
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, from: number) {
    const at = enabled.findIndex(({ index }) => index === from)
    let next: number | null = null
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (at + 1) % enabled.length
        break
      case "ArrowLeft":
      case "ArrowUp":
        next = (at - 1 + enabled.length) % enabled.length
        break
      case "Home":
        next = 0
        break
      case "End":
        next = enabled.length - 1
        break
    }
    if (next == null || enabled.length === 0) return
    event.preventDefault()
    const target = enabled[next]
    onValueChange(target.option.value)
    refs.current[target.index]?.focus()
  }

  return (
    <div
      role="radiogroup"
      data-slot="desk-segmented-control"
      className={cn(
        "inline-flex w-max items-stretch gap-0.5 rounded-desk-control bg-desk-sunken p-0.5",
        className
      )}
      {...props}
    >
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === stop ? 0 : -1}
            disabled={option.disabled}
            data-slot="desk-segmented-item"
            data-checked={checked || undefined}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex h-desk-control-sm items-center justify-center gap-1.5 rounded-desk-key border px-3 text-desk-ui whitespace-nowrap transition-colors duration-100 disabled:opacity-50",
              checked
                ? "border-desk-line bg-desk-surface text-desk-fg"
                : "border-transparent text-desk-fg-2 hover:text-desk-fg"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="font-mono text-desk-micro text-desk-fg-3 tabular-nums">
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export {
  DeskSegmentedControl,
  type DeskSegmentedControlProps,
  type DeskSegmentedOption,
}
