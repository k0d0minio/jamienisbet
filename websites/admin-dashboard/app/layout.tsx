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
  // title bars' `env(safe-area-inset-top)` padding is already built for — but it also fixes the status bar's glyphs white on older iOS, which
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
  // a fixed bar would be the one part of it that didn't. These are the desk
  // canvas (`--desk-canvas`, which is `--bg`) in each theme — the logo's paper
  // and its ink — written literally
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

// What the document has to know before it paints.
//
// **Appearance follows the system**, with no in-app toggle (BRAND.md § Desk
// tier), which is what every native app does. The design system flips on
// [data-theme="dark"], so all this has to do is mirror the media query onto
// that attribute.
//
// Inline and blocking on purpose: a theme resolved in an effect is a theme
// applied one paint too late, which is the white flash every dark-mode app is
// judged by. The server renders no attribute — :root is already the light
// theme — so there is nothing to disagree with at hydration.
const beforeFirstPaint = `(function(){var d=document.documentElement;try{var m=window.matchMedia("(prefers-color-scheme: dark)");var set=function(){d.setAttribute("data-theme",m.matches?"dark":"light")};set();if(m.addEventListener){m.addEventListener("change",set)}else{m.addListener(set)}}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* `desk-tier` is the tier's switch, applied once at the top of the
          tree: below it text sets in Hanken Grotesk on the dense scale, on
          the desk canvas, with focus drawn inside every control. */}
      <body className="desk-tier min-h-dvh">
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
