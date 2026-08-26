import * as React from "react"

import { cn } from "../../lib/utils"

// J-then-N typographic monogram. The brand's earlier abstract "node" mark was
// dropped (2026-06-15) — do not reintroduce it. SVG sources of truth:
// assets/logo/mark-monogram.svg and assets/logo/mark-monogram-solid.svg.

/** JN monogram that inherits the current text colour. Size via className. */
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("size-6", className)}
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M28 32 H44 M40 32 V58 Q40 69 29 69 Q21 69 21 60" />
        <path d="M56 70 V34 L78 70 V34" />
      </g>
    </svg>
  )
}

/** JN monogram on the fixed slate tile — favicons, app sidebars, slide footers.
 *  Stays slate + white in both themes (uses the raw ramp, not flipping aliases). */
function LogoMarkSolid({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("size-9", className)}
      {...props}
    >
      <rect x="2" y="2" width="96" height="96" rx="20" fill="var(--blue-600)" />
      <g
        stroke="var(--neutral-0)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M28 32 H44 M40 32 V58 Q40 69 29 69 Q21 69 21 60" />
        <path d="M56 70 V34 L78 70 V34" />
      </g>
    </svg>
  )
}

export { LogoMark, LogoMarkSolid }
