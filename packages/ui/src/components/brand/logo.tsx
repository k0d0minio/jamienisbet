import * as React from "react"

import { cn } from "../../lib/utils"

// Geometric J-N lockup (2026 logo rollout): the J is a bar with a filled
// diamond foot, the N is two bars joined by a falling diagonal bar — all set
// inside a thin frame tile. The brand palette here is deliberately monochrome
// paper/ink (--neutral-0 / --neutral-900); the tile form flips via the
// --logo-tile / --logo-ink semantic pair, slate blue never appears inside a
// tile. SVG sources of truth: assets/logo/logo-mark.svg,
// assets/logo/logo-mark-solid.svg, assets/logo/logo-full.svg. The earlier
// stroke monogram (assets/logo/mark-monogram.svg) is retired — do not
// reintroduce it.

function MarkShapes() {
  return (
    <>
      <rect x="26.1" y="28" width="9.6" height="49.7" />
      <rect x="43.9" y="28" width="9.6" height="50.7" />
      <rect x="74.8" y="28" width="9.6" height="50.7" />
      <path d="M47.1 34.1 L54.9 27.9 L79.9 59.9 L72.1 66.1 Z" />
      <path d="M21.8 70.5 L34.5 75.2 L21.8 79.9 L9.0 75.2 Z" />
    </>
  )
}

/** Geometric JN mark that inherits the current text colour. Size via className. */
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("size-6", className)}
      {...props}
    >
      <MarkShapes />
    </svg>
  )
}

/** Tile lockup — thin frame + mark, theme-driven via --logo-tile / --logo-ink.
 *  Favicons, logins, app sidebars, slide footers. */
function LogoMarkSolid({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("size-9", className)}
      {...props}
    >
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="2"
        fill="var(--logo-tile)"
        stroke="var(--logo-ink)"
        strokeWidth="2"
      />
      <g fill="var(--logo-ink)">
        <MarkShapes />
      </g>
    </svg>
  )
}

export { LogoMark, LogoMarkSolid }