import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"

import { site } from "@/lib/site"
import { routing } from "@/i18n/routing"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Dynamic Open Graph card in the brand palette (slate #3A5A78 on dark surface).
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
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#14181D",
          color: "#EAECEF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#3A5A78",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <g
                stroke="#FFFFFF"
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M28 32 H44 M40 32 V58 Q40 69 29 69 Q21 69 21 60" />
                <path d="M56 70 V34 L78 70 V34" />
              </g>
            </svg>
          </div>
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
