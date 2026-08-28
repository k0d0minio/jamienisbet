import * as React from "react"

import { cn } from "../../lib/utils"

// The "rolling deploy" — the one decorative loop BRAND.md licenses. A ring of
// six discrete segments turning at a steady rate: instances cycling through an
// update, in the dashed idiom of the mono accent. Draws in currentColor and
// defaults to icon size, so it slots into buttons as-is; under
// prefers-reduced-motion the ring stands still (motion-safe here, and the
// global kill switch in tokens/base.css) and the accompanying label carries
// "busy". Standalone it announces itself ("Loading"); inside a labelled
// control (see PendingButton) pass aria-hidden and let the label speak.
//
// Dash arithmetic: r=6.25 gives a circumference of ~39.27, split into six
// 4.5-unit segments with 2.045-unit gaps.
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0 motion-safe:animate-roll", className)}
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4.5 2.045"
      />
    </svg>
  )
}

export { Spinner }
