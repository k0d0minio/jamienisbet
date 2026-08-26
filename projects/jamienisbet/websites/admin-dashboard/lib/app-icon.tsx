import { ImageResponse } from "next/og"

// The JN monogram (white strokes, transparent) — the same paths the design
// system's LogoMark uses (packages/ui/src/components/brand/logo.tsx). Kept as an
// inline SVG data URI so ImageResponse can rasterize it to PNG at any size
// without a build-time image pipeline.
const MONOGRAM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><g stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M28 32 H44 M40 32 V58 Q40 69 29 69 Q21 69 21 60"/><path d="M56 70 V34 L78 70 V34"/></g></svg>`

const MONOGRAM_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MONOGRAM)}`

// Brand blue-600 (see packages/ui/tokens). Hard-coded because the
// generated PNG can't read the theme's CSS custom properties.
const BRAND_BLUE = "#3A5A78"

// Render a square app icon: the JN monogram centered on the brand-blue tile.
// Full-bleed background so it also works as a maskable icon (safe-zone rules).
export function renderAppIcon(size: number): ImageResponse {
  const inner = Math.round(size * 0.66)
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND_BLUE,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={inner} height={inner} src={MONOGRAM_DATA_URI} alt="" />
      </div>
    ),
    { width: size, height: size }
  )
}
