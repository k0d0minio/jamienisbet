"use client"

import { cn } from "@jamie-nisbet/ui"

import { ChannelGlyph } from "@/components/channel-glyph"
import { CHANNELS, type ChannelValue } from "@/lib/touches"

// Which door it happened through — the five channels this pool actually uses,
// and a catch-all.
//
// A grid of glyph buttons rather than a segmented control or a select: six
// options do not fit side by side on a phone, and the glyph is what makes the
// right one findable without reading. Three columns, two rows, every target
// over the 44px floor.
//
// A radio group, not a set of links or submits: it chooses a value. The group
// carries its own accessible name because a `<label>` above a set of buttons
// has no single control to point at.
//
// Shared by the two sheets that ask the question — logging a touch, and logging
// a reply — which ask it about opposite directions and want the same grid.

export function ChannelPicker({
  value,
  onChange,
  /** What a screen reader calls the group, and what the label above it says. */
  label = "Channel",
}: {
  value: ChannelValue | null
  onChange: (channel: ChannelValue) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {CHANNELS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex min-h-app-touch flex-col items-center justify-center gap-1 px-2 py-2",
            "rounded-app-control text-app-caption transition-colors spring-press",
            value === option.value
              ? "bg-app-group font-semibold text-app-label shadow-app-raised"
              : "bg-app-track font-medium text-app-label-2 active:bg-app-press"
          )}
        >
          <ChannelGlyph channel={option.value} />
          {option.label}
        </button>
      ))}
    </div>
  )
}
