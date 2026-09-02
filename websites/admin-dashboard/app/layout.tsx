import type { Metadata, Viewport } from "next"

import { ServiceWorkerRegister } from "@/components/service-worker-register"

import "./globals.css"

export const metadata: Metadata = {
  applicationName: "Consultancy JN",
  title: {
    default: "Consultancy JN",
    template: "%s — Consultancy JN",
  },
  description: "Owner-only environment for operating the business.",
  robots: { index: false, follow: false },
  icons: {
    // 64px so the browser downscales by whole factors to the 32 and 16 it
    // actually paints. Cropped flush to the logo's frame, unlike the installed
    // icons — at tab size the artwork's outer margin is pixels spent on nothing.
    icon: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  // iOS standalone: launch fullscreen from the home screen under the app name.
  //
  // `default` rather than `black-translucent`, deliberately. Translucent would
  // run the window under the status bar — the more native reading, and what the
  // collapsing header's `env(safe-area-inset-top)` padding is already built
  // for — but it also fixes the status bar's glyphs white on older iOS, which
  // over this tier's light canvas is white on near-white. `default` keeps the
  // bar above the window with the page's own background behind it, so it
  // matches the canvas in whichever appearance the system is in. Revisit it
  // when the floor is an iOS that reliably reads the colour scheme there.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Consultancy JN",
  },
}

export const viewport: Viewport = {
  // The status bar and the browser's own chrome take the app's canvas colour
  // in whichever mode the system is in — the app follows the OS appearance, so
  // a fixed bar would be the one part of it that didn't. These are the canvas
  // (`--bg`) in each theme — the logo's paper and its ink — written literally
  // because a meta tag is resolved by the OS long before a stylesheet exists
  // to read a token from.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFEFA" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1E1E" },
  ],
  width: "device-width",
  initialScale: 1,
  // Fill the screen under the notch / home indicator when installed.
  viewportFit: "cover",
  // Let the on-screen keyboard shrink the layout viewport rather than sit over
  // it, so a bottom sheet is pushed up by the browser itself. Chrome-only for
  // now; the Sheet primitive measures `visualViewport` for everywhere else
  // (iOS especially), and with this on that measurement simply reads zero.
  interactiveWidget: "resizes-content",
}

// Two things the document has to know before it paints, in one script.
//
// 1. **Appearance follows the system**, with no in-app toggle — the app tier's
//    rule (BRAND.md § App tier), and what every native app does. The design
//    system flips on [data-theme="dark"], so all this has to do is mirror the
//    media query onto that attribute.
//
// 2. **Whether this device can afford the blur.** A material is a
//    backdrop-filter over whatever is scrolling under it, and that is the most
//    expensive thing the app tier asks of a GPU. On a weak phone it is paid for
//    in dropped frames on the leads list — the screen that is scrolled most.
//    So the chrome degrades to translucency-without-blur where the hardware
//    says it should: `data-materials="opaque"` on the root, which
//    packages/ui/tokens/app.css reads. A capability check, not a setting —
//    nobody should have to find a toggle to make their own phone scroll. The
//    reader's own "reduce transparency" is handled separately and reactively,
//    in CSS.
//
//    `deviceMemory` is the honest signal and it is Chromium-only, which is the
//    right shape here: iOS never reports it, and iOS is where blur is cheapest.
//    A device that admits to 4GB or less is where two blurring surfaces over a
//    long list start costing frames. `hardwareConcurrency` catches the engines
//    with no deviceMemory at all, at a threshold no phone worth blurring is
//    under.
//
// Inline and blocking on purpose: a theme resolved in an effect is a theme
// applied one paint too late, which is the white flash every dark-mode app is
// judged by, and a material that stops blurring one frame in is worse than one
// that never started. The server renders neither attribute — :root is already
// the light theme with materials on — so there is nothing to disagree with at
// hydration.
const beforeFirstPaint = `(function(){var d=document.documentElement;try{var m=window.matchMedia("(prefers-color-scheme: dark)");var set=function(){d.setAttribute("data-theme",m.matches?"dark":"light")};set();if(m.addEventListener){m.addEventListener("change",set)}else{m.addListener(set)}}catch(e){}try{var mem=navigator.deviceMemory,cpu=navigator.hardwareConcurrency;if((typeof mem==="number"&&mem<=4)||(typeof cpu==="number"&&cpu<=2)){d.setAttribute("data-materials","opaque")}}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* `app-tier` is the tier's switch, applied once at the top of the tree:
          below it text sets in the system stack at the native body size and
          the page reads as the grouped-content canvas. */}
      <body className="app-tier min-h-dvh">
        <script
          // First thing in the document, and the only inline script in the
          // app: it runs before anything paints, which is the whole point.
          // Its source is the constant above — no interpolation, nothing from
          // a request.
          dangerouslySetInnerHTML={{ __html: beforeFirstPaint }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
