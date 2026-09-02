import { ImageResponse } from "next/og"

// The one place in the estate that re-draws the brand artwork by hand.
//
// `ImageResponse` rasterizes to PNG where no stylesheet exists, so it can read
// neither the design system's SVG assets nor the `--logo-tile` / `--logo-ink`
// pair that flips `LogoMarkSolid` between the themes. Both the geometry and the
// two brand values are therefore copied literally out of `packages/ui` and have
// to be re-derived whenever the mark moves. Sources:
// `packages/ui/src/components/brand/logo.tsx` (`MarkShapes`) and
// `packages/ui/assets/logo/logo-mark-solid.svg`.

// --neutral-900 (ink) and --neutral-0 (paper). The 2026 logo is monochrome
// paper/ink and slate blue never appears inside it (BRAND.md § Colour) — the
// old #3A5A78 tile went out with the stroke monogram it framed.
const INK = "#1E1E1E"
const PAPER = "#FFFEFA"

// The mark, baked to the dark reading — paper geometry over the ink tile below,
// the same reading `logo-mark-solid.svg` bakes for every PNG/favicon pipeline.
//
// The five paths are byte-identical to `MarkShapes`, so drift from the design
// system shows up as a diff rather than a judgement call. The `translate` is
// this file's own: the artwork sits low and left inside its 100-unit box (ink
// spans x 9.0→84.4 and y 27.9→79.9, putting its centre at 46.7, 53.9), which
// the framed tile composes around deliberately. A frameless icon has nothing to
// compose against, so the ink is pushed to the middle of the box — +3.3, -3.9 —
// and centring the box then centres the mark.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="${PAPER}" transform="translate(3.3 -3.9)"><rect x="26.1" y="28" width="9.6" height="49.7"/><rect x="43.9" y="28" width="9.6" height="50.7"/><rect x="74.8" y="28" width="9.6" height="50.7"/><path d="M47.1 34.1 L54.9 27.9 L79.9 59.9 L72.1 66.1 Z"/><path d="M21.8 70.5 L34.5 75.2 L21.8 79.9 L9.0 75.2 Z"/></g></svg>`

const MARK_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`

// Render a square app icon: the JN mark centred on a full-bleed ink tile.
//
// **No frame, deliberately.** The design system's icon form is a framed tile,
// but a maskable icon's safe zone is the circle of 80% diameter — a hairline
// drawn at the tile edge sits 50% out from the centre and is the first thing an
// OS mask eats. So the frame comes off here and the mask's own shape does its
// job; every surface that isn't masked (the favicon, the login screen) keeps
// the framed form.
//
// The scale then falls out of that 40% safe radius. At 70% of the tile the
// furthest ink — the top-right corner of the N's trailing bar, 45.7 units from
// the recentred middle — lands 32% of the tile from the centre, which leaves
// headroom for the tighter corners of iOS's own squircle. The ink reads 53% of
// the tile wide and 36% tall. Move the artwork and these are the numbers to
// recompute: the ink's extents, its centre, and its furthest point.
//
// That move is already booked. The furthest ink is the J's foot, which the 2026
// rebuild drew as a leftward spearhead where the reference artwork hooks back up
// — so the 45.7 above measures a defect, and this scale is conservative until it
// is re-cut. See
// `.icm/intake/triage/logo-mark-artwork-diverges-from-reference.md`.
export function renderAppIcon(size: number): ImageResponse {
  const inner = Math.round(size * 0.7)
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: INK,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={inner} height={inner} src={MARK_DATA_URI} alt="" />
      </div>
    ),
    { width: size, height: size }
  )
}
