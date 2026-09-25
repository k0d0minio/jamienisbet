"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

// DESK TIER — tabs.
//
// Several bodies in one place, one shown at a time: a record's Activity,
// Draft, Forms and Notes. A row of labels on a hairline; the current one in
// the ink with a 2px underline resting on it, the rest muted. Flat — no
// track, no pill. (The underline sits inside the row rather than over the
// hairline: the row scrolls sideways on a narrow screen, and a scroller clips
// anything hung below it.)
//
//   <DeskTabs
//     aria-label="Lead"
//     value={tab}
//     onValueChange={setTab}
//     tabs={[{ value: "activity", label: "Activity" }, { value: "forms", label: "Forms", count: 2 }]}
//   />
//   <div role="tabpanel" id={deskTabPanelId("lead", tab)} aria-labelledby={deskTabId("lead", tab)}>…</div>
//
// A tablist, operated like one: Tab reaches the current tab, the arrow keys
// (and Home / End) move focus and selection together. The panel is the
// caller's; `idBase` ties each tab to its panel through the two id helpers.
//
// Requires "@jamie-nisbet/ui/desk.css".

type DeskTab<T extends string> = {
  value: T
  label: React.ReactNode
  /** How many things are behind this tab. Set in mono; hidden at 0. */
  count?: number
}

/** The id of the tab for `value` — a panel's `aria-labelledby`. */
function deskTabId(idBase: string, value: string) {
  return `${idBase}-tab-${value}`
}

/** The id of the panel for `value` — the tab's `aria-controls`. */
function deskTabPanelId(idBase: string, value: string) {
  return `${idBase}-panel-${value}`
}

type DeskTabsProps<T extends string> = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  tabs: DeskTab<T>[]
  value: T
  onValueChange: (value: T) => void
  /** Prefix for the tab and panel ids. */
  idBase: string
}

function DeskTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  idBase,
  className,
  ...props
}: DeskTabsProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  function move(from: number, to: number) {
    const count = tabs.length
    if (count === 0) return
    const index = ((to % count) + count) % count
    if (index === from) return
    const next = tabs[index]
    if (!next) return
    onValueChange(next.value)
    refs.current[index]?.focus()
  }

  return (
    <div
      role="tablist"
      data-slot="desk-tabs"
      className={cn(
        "flex min-w-0 items-stretch gap-5 overflow-x-auto border-b border-desk-line [scrollbar-width:none]",
        className
      )}
      {...props}
    >
      {tabs.map((tab, index) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            id={deskTabId(idBase, tab.value)}
            aria-controls={deskTabPanelId(idBase, tab.value)}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(tab.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") move(index, index + 1)
              else if (event.key === "ArrowLeft") move(index, index - 1)
              else if (event.key === "Home") move(index, 0)
              else if (event.key === "End") move(index, tabs.length - 1)
              else return
              event.preventDefault()
            }}
            className={cn(
              "flex h-desk-toolbar shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-0.5 text-desk-ui font-medium transition-colors duration-100",
              selected
                ? "border-desk-ink text-desk-fg"
                : "border-transparent text-desk-fg-3 hover:text-desk-fg"
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="font-mono text-desk-micro text-desk-fg-3">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { DeskTabs, deskTabId, deskTabPanelId, type DeskTab, type DeskTabsProps }
