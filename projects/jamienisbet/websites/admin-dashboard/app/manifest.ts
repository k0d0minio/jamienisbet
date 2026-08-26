import type { MetadataRoute } from "next"

// PWA manifest — served by Next at /manifest.webmanifest (dotted path, so
// proxy.ts lets it through without a session). Makes the admin installable to a
// phone home screen as "Consultancy JN". Icons are the generated PNG routes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Consultancy JN",
    short_name: "Consultancy JN",
    description: "Owner-only environment for operating the business.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#3A5A78",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
