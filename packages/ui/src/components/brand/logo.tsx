import * as React from "react"

import { cn } from "../../lib/utils"
import { LOGO_LETTERS_MASK } from "./logo-letters"

// The 2026 JN logo: typographic letters — a J with a hooked descender and an N
// — inside a thin frame tile, in monochrome paper/ink. Slate blue never appears
// inside the mark (BRAND.md § Colour); the tile flips via the --logo-tile /
// --logo-ink semantic pair.
//
// **The letters are the artwork, not a redrawing of it.** They come through as
// an alpha mask cut from the reference PNGs (see ./logo-letters.ts), because
// the mark is a typeface and the geometric approximation that shipped before
// this — three bars, a diagonal and a diamond — did not read as the logo. The
// frame stays vector: it is a rectangle, it was never the part that was wrong,
// and drawn in CSS it takes the theme's tokens directly.
//
// Painting the letters through a mask rather than as an image is what keeps
// `currentColor` working, which call sites depend on — the marketing header and
// the sellers pitch both tint the mark with `text-primary`, and the admin's
// chrome takes its label colour.

// Geometry, measured off the 2000px source and expressed as a share of the
// element. Inside the framed tile the letters sit where the artwork puts them;
// standing alone they are centred, which is what a glyph beside a line of text
// wants. Both keep the artwork's 75.4% width, so the two forms agree.
const LETTERS_W = 75.41
const TILE_LETTERS = {
  left: "9.06%",
  top: "28.09%",
  width: `${LETTERS_W}%`,
  height: "51.87%",
}

/** The letters alone, painted in whatever colour is passed to `color`. */
function letterMaskStyle(color: string): React.CSSProperties {
  const url = `url("${LOGO_LETTERS_MASK}")`
  return {
    backgroundColor: color,
    maskImage: url,
    WebkitMaskImage: url,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  }
}

/** JN mark that inherits the current text colour. Size via className. */
function LogoMark({ className, style, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("inline-block size-6", className)}
      style={{
        ...letterMaskStyle("currentColor"),
        // Width-driven so the letters keep their aspect inside a square box,
        // landing at the same 75.4% x 51.9% the artwork holds inside its frame.
        maskSize: `${LETTERS_W}% auto`,
        WebkitMaskSize: `${LETTERS_W}% auto`,
        ...style,
      }}
      {...props}
    />
  )
}

/** Tile lockup — thin frame + letters, theme-driven via --logo-tile /
 *  --logo-ink. Favicons, logins, app sidebars, slide footers. */
function LogoMarkSolid({ className, style, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="img"
      aria-label="Jamie Nisbet"
      className={cn("relative block size-9", className)}
      style={{
        backgroundColor: "var(--logo-tile)",
        // A hairline rather than the artwork's 2%-of-tile stroke: this form is
        // used between 32px and 56px, where 2% is under a pixel and renders
        // muddy. An inset shadow keeps it off the box model, and a hairline is
        // the design system's own structural line anyway.
        boxShadow: "inset 0 0 0 1px var(--logo-ink)",
        borderRadius: "2%",
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden
        className="absolute"
        style={{
          ...TILE_LETTERS,
          ...letterMaskStyle("var(--logo-ink)"),
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      />
    </span>
  )
}

export { LogoMark, LogoMarkSolid }
