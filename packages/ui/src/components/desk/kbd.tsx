import * as React from "react"

import { cn } from "../../lib/utils"

// DESK TIER — the key hint.
//
// Everything is one keystroke away, and the hint says which. A key is a
// small mono cap on the surface with a strong hairline and a heavier bottom
// edge, so it reads as something pressed rather than a badge.
//
//   <Kbd>esc</Kbd>
//   <Kbd keys={["⌘", "K"]} />     ← a combo: adjacent keys, one <kbd>
//
// A combo nests one <kbd> per key inside an outer <kbd>, which is how HTML
// spells "press these together".
//
// Requires "@jamie-nisbet/ui/desk.css".

const keyClass =
  "inline-flex min-w-desk-badge items-center justify-center rounded-desk-key border border-b-2 border-desk-line-strong bg-desk-surface px-1 font-mono text-desk-micro text-desk-fg-2"

type KbdProps = React.ComponentProps<"kbd"> & {
  /** Keys pressed together, rendered as adjacent caps. */
  keys?: string[]
}

function Kbd({ keys, className, children, ...props }: KbdProps) {
  if (keys && keys.length > 0) {
    return (
      <kbd
        data-slot="kbd"
        className={cn("inline-flex items-center gap-0.5", className)}
        {...props}
      >
        {keys.map((key, index) => (
          <kbd key={`${key}-${index}`} className={keyClass}>
            {key}
          </kbd>
        ))}
      </kbd>
    )
  }

  return (
    <kbd data-slot="kbd" className={cn(keyClass, className)} {...props}>
      {children}
    </kbd>
  )
}

export { Kbd, type KbdProps }
