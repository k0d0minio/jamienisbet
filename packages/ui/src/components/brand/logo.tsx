import * as React from "react"

import { cn } from "../../lib/utils"
import {
  LOGO_FRAME_INSET,
  LOGO_FRAME_PATH,
  LOGO_LETTERS_BOX,
  LOGO_LETTERS_PATH,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_PATH,
} from "./logo-artwork"

// The 2026 Jamie Nisbet logo, in its three forms:
//
//   LogoMark       the JN letters alone, in currentColor — a glyph beside text
//   LogoMarkSolid  the icon form: framed tile + letters, paper/ink, theme-flipped
//   LogoFull       the full form: framed tile + the "Jamie Nisbet." wordmark and
//                  its circle. In currentColor on a transparent tile by default
//                  (the reading the artwork has on paper), or `tile` for the
//                  solid paper/ink tile that flips with the theme.
//
// Every path is the artwork itself — traced from the reference PNGs and
// pixel-diffed back against them (see ./logo-artwork.ts) — so all three forms
// are vector, sharp at any size, and read as one logo. Nothing here is drawn by
// hand, and nothing here should be: a change to the logo is a new trace.
//
// The frame is the one place the artwork is *helped*: at 2.09% of the tile its
// stroke drops under a pixel below ~48px and renders as a grey smear. A 1px
// hairline on the ring's centreline, exempt from scaling, keeps it crisp at
// icon size; at hero size it disappears inside the ring. Rasterisers without
// `vector-effect` (Satori) simply draw the ring, which at their sizes is plenty.

type LogoSvgProps = Omit<React.ComponentProps<"svg">, "viewBox" | "children">

// A plain helper, not a component: called directly (`{Frame({ ink })}`) so its
// two elements land as direct `<path>`/`<rect>` children of the enclosing
// `<svg>` rather than behind a component or Fragment boundary. Satori's OG
// renderer (next/og, Next 16.3+) only resolves intrinsic elements nested
// inside an `<svg>` — a custom component there fails prerendering with
// "Only intrinsic elements are supported inside <svg>".
function Frame({ ink }: { ink: string }) {
  const inset = LOGO_FRAME_INSET / 2
  return [
    <path key="frame-path" d={LOGO_FRAME_PATH} fillRule="evenodd" fill={ink} />,
    <rect
      key="frame-rect"
      x={inset}
      y={inset}
      width={100 - LOGO_FRAME_INSET}
      height={100 - LOGO_FRAME_INSET}
      fill="none"
      stroke={ink}
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    />,
  ]
}

// The letters alone are centred in a square at the width they hold inside the
// frame (75.5%), so a LogoMark and a LogoMarkSolid at the same size agree on
// how big the JN is.
const LETTERS_VIEWBOX = (() => {
  const cx = LOGO_LETTERS_BOX.x + LOGO_LETTERS_BOX.width / 2
  const cy = LOGO_LETTERS_BOX.y + LOGO_LETTERS_BOX.height / 2
  return `${(cx - 50).toFixed(2)} ${(cy - 50).toFixed(2)} 100 100`
})()

/** The JN letters alone, in the current text colour. Size via className. */
function LogoMark({ className, ...props }: LogoSvgProps) {
  return (
    <svg
      role="img"
      aria-label="Jamie Nisbet"
      viewBox={LETTERS_VIEWBOX}
      className={cn("inline-block size-6 shrink-0", className)}
      {...props}
    >
      <path d={LOGO_LETTERS_PATH} fill="currentColor" />
    </svg>
  )
}

/** The icon form — framed tile + letters — in paper/ink, flipped by the theme
 *  through --logo-tile / --logo-ink. Logins, favicons' on-page twin, anything
 *  that stands alone on the canvas rather than leading a line of text. */
function LogoMarkSolid({ className, ...props }: LogoSvgProps) {
  return (
    <svg
      role="img"
      aria-label="Jamie Nisbet"
      viewBox={LOGO_VIEWBOX}
      className={cn("block size-9 shrink-0", className)}
      {...props}
    >
      <rect width="100" height="100" fill="var(--logo-tile)" />
      {Frame({ ink: "var(--logo-ink)" })}
      <path d={LOGO_LETTERS_PATH} fill="var(--logo-ink)" />
    </svg>
  )
}

/** The full form — framed tile, the "Jamie Nisbet." wordmark and the circle.
 *
 *  Default: currentColor on a transparent tile, which on the page's own paper
 *  or ink canvas is exactly the artwork's reading, and flips with the theme
 *  because the text colour does. `tile` paints the solid paper/ink tile
 *  instead (--logo-tile / --logo-ink). `ink` and `paper` override both for
 *  surfaces with no stylesheet to read a token from — an OG card rasterised
 *  by Satori passes literals. */
function LogoFull({
  className,
  tile = false,
  ink,
  paper,
  ...props
}: LogoSvgProps & {
  /** Paint the solid tile behind the mark instead of leaving it transparent. */
  tile?: boolean
  /** Literal ink colour, for rasterisers that cannot resolve currentColor or tokens. */
  ink?: string
  /** Literal tile colour (only drawn with `tile`). */
  paper?: string
}) {
  const inkFill = ink ?? (tile ? "var(--logo-ink)" : "currentColor")
  return (
    <svg
      role="img"
      aria-label="Jamie Nisbet"
      viewBox={LOGO_VIEWBOX}
      className={cn("block size-16 shrink-0", className)}
      {...props}
    >
      {tile && <rect width="100" height="100" fill={paper ?? "var(--logo-tile)"} />}
      {Frame({ ink: inkFill })}
      <path d={LOGO_WORDMARK_PATH} fill={inkFill} />
    </svg>
  )
}

export { LogoMark, LogoMarkSolid, LogoFull }
