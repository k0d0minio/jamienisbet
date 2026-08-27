import * as React from "react"

import { cn } from "../../lib/utils"

// The "rolling deploy" — the one decorative loop the brand licenses. A hairline
// track with a quarter arc rolling around it, sized and coloured from whatever
// it sits inside (`currentColor`, `size-4` by default) so it drops into a button
// label without any co-ordination. The spin duration and its reduced-motion
// slow-down live in tokens/motion.css as `.jn-spin`.
function Spinner({
  className,
  // Announced while it's on screen. Set it to "" for a spinner sitting beside
  // text that already says what's happening — otherwise a screen reader hears
  // the state twice.
  label = "Loading",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      data-slot="spinner"
      role="status"
      // Sized on the wrapper so a call site can override it with one class;
      // the svg fills whatever that ends up being.
      className={cn("inline-flex size-4 items-center justify-center", className)}
      {...props}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className="jn-spin size-full"
      >
        {/* The track: the same hairline weight the borders use. */}
        <circle
          cx="8"
          cy="8"
          r="6.5"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        {/* The rolling quarter. */}
        <path
          d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

export { Spinner }
