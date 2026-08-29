"use client"

import { useId, useState } from "react"

import { SegmentedControl, SegmentedItem, cn } from "@jamie-nisbet/ui"

import {
  DEFAULT_LEAD_SEGMENT,
  LEAD_SEGMENTS,
  type LeadSegmentKey,
} from "@/lib/lead-segments"

// A lead's profile used to be nine groups down one page — every fact it holds,
// in working order, and by the fourth scroll you were reading the record to
// find the surface. It is two now, under the identity:
//
//   Person — the record. Who they are, where they stand, what was agreed, how
//            they came in, and the two red rows.
//   Work   — the surface you actually operate. Notes, todos, forms.
//
// Both are rendered and only one is shown, so switching costs nothing and a
// half-typed note survives a look at the deal. The choice rides in the URL as
// `?tab=` through `history.replaceState` rather than a navigation: the page is
// a dynamic server read, and a tab is not worth a round trip. It does mean a
// refresh, a share, or coming back through the browser's history lands on the
// segment you left.

export function LeadSegments({
  initial,
  person,
  work,
}: {
  /** Which segment the URL asked for. Read on the server so the first paint is
   *  already the right one. */
  initial: LeadSegmentKey
  person: React.ReactNode
  work: React.ReactNode
}) {
  const [active, setActive] = useState<LeadSegmentKey>(initial)
  const baseId = useId()

  const tabId = (key: LeadSegmentKey) => `${baseId}-${key}-tab`
  const panelId = (key: LeadSegmentKey) => `${baseId}-${key}-panel`

  function select(key: LeadSegmentKey) {
    setActive(key)
    // Not a navigation: `replaceState` keeps the rendered page and only
    // rewrites the address, so the two segments never re-read the database.
    const url = new URL(window.location.href)
    if (key === DEFAULT_LEAD_SEGMENT) url.searchParams.delete("tab")
    else url.searchParams.set("tab", key)
    window.history.replaceState(null, "", url)
  }

  // Left and right walk the tabs and take the focus with them, the way a
  // tablist is expected to — the pointer and the thumb both just tap.
  function onKeyDown(event: React.KeyboardEvent) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const index = LEAD_SEGMENTS.findIndex((s) => s.key === active)
    const next =
      LEAD_SEGMENTS[(index + step + LEAD_SEGMENTS.length) % LEAD_SEGMENTS.length]
    select(next.key)
    document.getElementById(tabId(next.key))?.focus()
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="px-app-gutter">
        <SegmentedControl
          role="tablist"
          aria-label="Profile sections"
          onKeyDown={onKeyDown}
        >
          {LEAD_SEGMENTS.map((segment) => (
            <SegmentedItem
              key={segment.key}
              // A tab, not a link and not a radio: it swaps a panel that is
              // already on the page. The control draws the selection; these
              // say what it means.
              role="tab"
              id={tabId(segment.key)}
              aria-selected={segment.key === active}
              aria-controls={panelId(segment.key)}
              tabIndex={segment.key === active ? 0 : -1}
              active={segment.key === active}
              label={segment.label}
              onClick={() => select(segment.key)}
            />
          ))}
        </SegmentedControl>
      </div>

      {LEAD_SEGMENTS.map((segment) => (
        <div
          key={segment.key}
          role="tabpanel"
          id={panelId(segment.key)}
          aria-labelledby={tabId(segment.key)}
          // `hidden` as a class, not the attribute: the panels hold flex
          // containers, whose own display would win over the UA rule.
          className={cn(segment.key !== active && "hidden")}
        >
          {segment.key === "person" ? person : work}
        </div>
      ))}
    </div>
  )
}
