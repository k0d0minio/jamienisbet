import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"

import { LogoFull } from "@jamie-nisbet/ui"

import { site } from "@/lib/site"
import { routing } from "@jamie-nisbet/app-shell/i18n"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Dynamic Open Graph card, set on the dark reading: the logo's ink as the
// canvas, paper for the type.
//
// The colours are written literally because Satori resolves this at build time,
// with no stylesheet to read a custom property from; they are the [data-theme="dark"]
// values of --bg, --text-1 and --text-2 (tokens/colors.css).
//
// The mark is the full lockup from the design system — vector paths traced from
// the artwork, which Satori draws as it draws any SVG. It cannot resolve
// `currentColor` or a token, so the component takes its ink as a literal here.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: 80,
          background: "#1E1E1E",
          color: "#FFFEFA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.05,
            }}
          >
            {t("og.headline")}
          </div>
          <div style={{ fontSize: 30, color: "#B9B8B2" }}>
            {`${t("role")} · ${site.location}`}
          </div>
        </div>

        <LogoFull ink="#FFFEFA" width={220} height={220} style={{ flexShrink: 0 }} />
      </div>
    ),
    { ...size }
  )
}
