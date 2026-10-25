"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "../../lib/utils"
import { LOGO_FRAME_INSET, LOGO_LETTERS_PATH, LOGO_VIEWBOX } from "./logo-artwork"

// The JN icon as a loading indicator — the brand's second sanctioned loop,
// beside the rolling-deploy Spinner that stays on buttons.
//
// The frame draws itself in once (a quick, ease-out stroke around the tile),
// the letters fade in behind it, and then the letters breathe: a slow, calm
// dip to 40% and back on the shimmer clock, nothing faster. No bounce, no
// spin, no scale. Under reduced motion nothing moves — the icon simply stands
// where the loader would, which is still a truthful "this is loading" because
// the surrounding region is aria-busy and the label says so.
//
// Draws in currentColor at icon size, so it sits in a title bar's label colour
// or a page's muted text exactly like the Spinner did. Standalone it announces
// itself; inside a labelled region pass aria-hidden and let the region speak.

const EASE_OUT = [0.2, 0, 0, 1] as const
const INSET = LOGO_FRAME_INSET / 2

function LogoLoader({
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "viewBox" | "children">) {
  const reduced = useReducedMotion()

  return (
    <svg
      data-slot="logo-loader"
      role="status"
      aria-label="Loading"
      viewBox={LOGO_VIEWBOX}
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      {reduced ? (
        <>
          <rect
            x={INSET}
            y={INSET}
            width={100 - LOGO_FRAME_INSET}
            height={100 - LOGO_FRAME_INSET}
            fill="none"
            stroke="currentColor"
            strokeWidth={LOGO_FRAME_INSET}
          />
          <path d={LOGO_LETTERS_PATH} fill="currentColor" />
        </>
      ) : (
        <>
          <motion.rect
            x={INSET}
            y={INSET}
            width={100 - LOGO_FRAME_INSET}
            height={100 - LOGO_FRAME_INSET}
            fill="none"
            stroke="currentColor"
            strokeWidth={LOGO_FRAME_INSET}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.26, ease: EASE_OUT }}
          >
            <motion.path
              d={LOGO_LETTERS_PATH}
              fill="currentColor"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{
                delay: 0.7,
                duration: 1.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </motion.g>
        </>
      )}
    </svg>
  )
}

export { LogoLoader }
