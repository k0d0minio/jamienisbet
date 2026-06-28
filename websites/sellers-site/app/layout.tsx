import type { Metadata } from "next"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { site } from "@/lib/site"

const title = `${site.name} — ${site.role}`

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_GB",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Theming is driven by the [data-theme] attribute (not .dark) — that's
            what @jamie-nisbet/ui's dark variant keys off. */}
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Per-route-group layouts supply the chrome: the affiliate site
              ((site)) wears the seller header/footer; the customer pitch
              ((pitch)) wears its own minimal brand bar. */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
