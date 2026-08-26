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
  themeColor: "#3A5A78",
  width: "device-width",
  initialScale: 1,
  // Fill the screen under the notch / home indicator when installed.
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Theming keys off [data-theme] to match @jamie-nisbet/ui; the admin runs light.
  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
