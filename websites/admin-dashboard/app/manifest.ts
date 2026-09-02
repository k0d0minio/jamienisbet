import type { MetadataRoute } from "next"

// PWA manifest — served by Next at /manifest.webmanifest (dotted path, so
// proxy.ts lets it through without a session). Makes the admin installable to a
// phone home screen as "Consultancy JN".
//
// The icons are static files in public/, cut from the brand artwork itself
// (packages/ui/assets/logo/reference/icon-dark.png, the icon form's dark
// reading at 2000px) rather than re-drawn — the mark is typographic, and a
// hand-written approximation of it is visibly not the logo. Two crops, both
// taken around the *frame's* centre (50, 47.75 in source %) rather than the
// image's, because the artwork sits 2.25% high in its own canvas:
//
//   any / apple  a 95.5%-wide square crop — the widest that stays on the source
//                — which puts the frame at 80% of the tile, corners 56.6% out
//                from centre, inside iOS's squircle (~61.5%).
//   maskable     the same crop at 70%, so the frame lands at 56% and its
//                corners at 39.6% — just inside the 40% radius a circular mask
//                guarantees. A square frame cannot go larger and survive.
//
// Regenerate by re-cutting those two crops if the artwork changes.
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
    // The splash and the installed chrome take the app's canvas (--bg) —
    // the logo's paper — so the icon's tile and the screen behind it are
    // the same sheet. A manifest cannot carry a media query, so this is the
    // light reading; the mode-reactive value is the <meta name="theme-color">
    // pair in app/layout.tsx, which wins wherever both are read.
    background_color: "#FFFEFA",
    theme_color: "#FFFEFA",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Its own file rather than the `any` icon reused: the frame has to shrink
      // to clear a circular mask, and shipping that padded reading as `any`
      // would waste a fifth of every unmasked tile on empty ink.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
