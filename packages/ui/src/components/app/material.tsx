import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — the translucent surface floating chrome is made of.
//
// A material blurs and lightly saturates whatever scrolls beneath it, so
// content reads as passing *under* the chrome rather than stopping at it.
// That is the app tier's structural move: on the marketing sites blur is
// reserved for the sticky header, here it is how depth is expressed.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <Material asChild level="thick" elevation="chrome" edge="top">
//     <nav className="…">…</nav>
//   </Material>
//
// The three levels differ only in how much of the page below survives:
// `thin` for a scrim you can still read through, `regular` for a title bar,
// `thick` for a tab bar or sheet that has to hold its own text. Text placed
// on one takes the vibrancy-safe colours (`text-material-label`,
// `text-material-label-2`), which run a stop stronger than the page's —
// a scrolling page underneath eats contrast a flat surface would keep.

const materialVariants = cva("", {
  variants: {
    level: {
      thin: "material-thin",
      regular: "material-regular",
      thick: "material-thick",
    },
    // Elevation says how far above the page this floats. `none` is the
    // honest default: a material inside a sheet has already been lifted
    // by the sheet, and stacking shadows only muddies the edge.
    elevation: {
      none: "",
      raised: "shadow-app-raised",
      chrome: "shadow-app-chrome",
      sheet: "shadow-app-sheet",
      popover: "shadow-app-popover",
    },
    // The hairline where the material meets content. Softer than the
    // page's --border, because the blur is already separating them.
    edge: {
      none: "",
      top: "border-t border-material-hairline",
      bottom: "border-b border-material-hairline",
    },
  },
  defaultVariants: {
    level: "regular",
    elevation: "none",
    edge: "none",
  },
})

function Material({
  className,
  level = "regular",
  elevation = "none",
  edge = "none",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof materialVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="material"
      data-level={level}
      data-elevation={elevation}
      className={cn(materialVariants({ level, elevation, edge }), className)}
      {...props}
    />
  )
}

export { Material, materialVariants }
