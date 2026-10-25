"use client"

import * as React from "react"
import { motion, useAnimate, useReducedMotion } from "motion/react"

import { cn } from "../../lib/utils"

// The logo when it is a link — the header's and the footer's home link, the
// admin sidebar's head. Two small responses and nothing more:
//
//   hover / press   the mark quietens (80% then 65% opacity). Press is a
//                   colour change, never a shrink, and this is the closest a
//                   currentColor glyph on a bare canvas can come to "deepens".
//   the theme flips the reading crossfades — a 260ms ease-out from 35% back
//                   to full in the new paper/ink, keyed on `fadeKey`. The
//                   theme provider disables transitions during a flip, so the
//                   logo does this itself rather than with a CSS transition.
//
// Both stand still under reduced motion; the first resolved `fadeKey` (the
// theme arriving after hydration) is not a flip and does not play.

const EASE_OUT = [0.2, 0, 0, 1] as const

function LogoLockup({
  fadeKey,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** Changes when the mark's reading flips — pass the resolved theme. */
  fadeKey?: string | null
}) {
  const reduced = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const previous = React.useRef<string | null | undefined>(undefined)

  React.useEffect(() => {
    const was = previous.current
    previous.current = fadeKey
    if (reduced || was === undefined || was === fadeKey || !scope.current) return
    animate(scope.current, { opacity: [0.35, 1] }, { duration: 0.26, ease: EASE_OUT })
  }, [fadeKey, reduced, animate, scope])

  if (reduced) {
    return (
      <span className={cn("inline-flex", className)} {...props}>
        {children}
      </span>
    )
  }

  return (
    <motion.span
      ref={scope}
      className={cn("inline-flex", className)}
      whileHover={{ opacity: 0.8 }}
      whileTap={{ opacity: 0.65 }}
      transition={{ duration: 0.12, ease: EASE_OUT }}
      {...(props as object)}
    >
      {children}
    </motion.span>
  )
}

export { LogoLockup }
