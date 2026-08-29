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
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  // iOS standalone: launch fullscreen from the home screen under the app name.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Consultancy JN",
  },
}

export const viewport: Viewport = {
  // The status bar and the browser's own chrome take the app's canvas colour
  // in whichever mode the system is in — the app follows the OS appearance, so
  // a fixed slate bar would be the one part of it that didn't. These are the
  // canvas (`--bg`) in each theme, written literally because a meta tag is
  // resolved by the OS long before a stylesheet exists to read a token from.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0E11" },
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

// Appearance follows the system, with no in-app toggle — the app tier's rule
// (BRAND.md § App tier), and what every native app does. The design system
// flips on [data-theme="dark"], so all this has to do is mirror the media
// query onto that attribute.
//
// Inline and blocking on purpose: a theme resolved in an effect is a theme
// applied one paint too late, which is the white flash every dark-mode app is
// judged by. The server renders no data-theme at all — :root is already the
// light theme — so there is nothing for this to disagree with at hydration.
const followSystemAppearance = `(function(){try{var m=window.matchMedia("(prefers-color-scheme: dark)");var set=function(){document.documentElement.setAttribute("data-theme",m.matches?"dark":"light")};set();if(m.addEventListener){m.addEventListener("change",set)}else{m.addListener(set)}}catch(e){}})()`

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
          dangerouslySetInnerHTML={{ __html: followSystemAppearance }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
