import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"

import { site } from "@/lib/site"
import { routing } from "@jamie-nisbet/app-shell/i18n"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Dynamic Open Graph card, set on the dark theme's surface.
//
// The colours are written literally because Satori resolves this at build time,
// with no stylesheet to read a custom property from; they are the [data-theme="dark"]
// values of --surface, --text-1 and --text-2.
//
// The mark is the favicon file itself — the icon form's dark reading, cut from the
// brand artwork — inlined as a data URI. Satori has no CSS masking, so the mask the
// design system paints LogoMark through cannot be used here; embedding the artwork
// keeps the card off a second, hand-drawn copy of the logo, which is what stood here
// before. It carries the tile's own paper/ink, so the slate plate it used to sit on
// is gone with it: slate is the interaction tint and never appears in the mark.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const mark = await fetch(new URL("../icon.png", import.meta.url)).then((res) =>
    res.arrayBuffer()
  )

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#14181D",
          color: "#EAECEF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders
              to a PNG at build time; next/image has nothing to optimise here. */}
          <img
            src={`data:image/png;base64,${Buffer.from(mark).toString("base64")}`}
            width={64}
            height={64}
            alt=""
          />
          <div style={{ fontSize: 32, fontWeight: 600 }}>{site.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            {t("og.headline")}
          </div>
          <div style={{ fontSize: 30, color: "#A8B0BA" }}>
            {`${t("role")} · ${site.location}`}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
