import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Admin — Jamie Nisbet",
    template: "%s — Admin",
  },
  description: "Owner-only admin environment for the business.",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Theming keys off [data-theme] to match @jamie-nisbet/ui; the admin runs light.
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
