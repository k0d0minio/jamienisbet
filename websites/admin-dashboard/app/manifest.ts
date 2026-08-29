import type { MetadataRoute } from "next"

// PWA manifest — served by Next at /manifest.webmanifest (dotted path, so
// proxy.ts lets it through without a session). Makes the admin installable to a
// phone home screen as "Consultancy JN". Icons are the generated PNG routes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // The identity the browser files the installed app under. Without it that
    // job falls to start_url, which means the day start_url moves the OS treats
    // it as a different app and offers to install a second copy.
    id: "/",
    name: "Consultancy JN",
    short_name: "Consultancy JN",
    description: "Owner-only environment for operating the business.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Not locked to portrait. The app is phone-first, but from `md` up it is a
    // deliberate iPad-style scale-up — a leading sidebar and a wider grouped
    // column — and an installed tablet app told "portrait" can never reach it.
    orientation: "any",
    // The splash and the installed chrome take the app's light canvas
    // (--bg), not the brand slate: the admin follows the system appearance
    // and its chrome is a material over that canvas, so a slate bar would be
    // the one edge that never matched the app. A manifest cannot carry a
    // media query, so this is the light reading; the mode-reactive value is
    // the <meta name="theme-color"> pair in app/layout.tsx, which wins
    // wherever both are read.
    background_color: "#F7F8F9",
    theme_color: "#F7F8F9",
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
