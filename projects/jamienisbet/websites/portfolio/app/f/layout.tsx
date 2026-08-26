import type { Metadata } from "next"
import Link from "next/link"
import "../globals.css"

import { ThemeProvider } from "@jamie-nisbet/app-shell"
import { LogoMark } from "@jamie-nisbet/ui"

import { site } from "@/lib/site"

// A second root layout, for the customer questionnaires only.
//
// Everything else on this site lives under `/[locale]` and gets the full
// marketing chrome. A form doesn't want either: it is authored in one language
// (so the locale machinery has nothing to resolve) and it is a single task with
// a single button, so a nav bar offering "Work" and "About" is just somewhere
// else to click. What it keeps is the brand — the same tokens, the same type,
// the monogram at the top — so it reads as Jamie's, not as a form vendor's.

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // Questionnaires are private by construction (the token is the only way in);
  // this keeps a forwarded link out of an index as well.
  robots: { index: false, follow: false },
}

export default function FormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-dvh flex-col">
            <header className="border-b">
              <div className="mx-auto flex h-16 w-full max-w-2xl items-center px-5 sm:px-8">
                <Link
                  href="/"
                  aria-label={site.name}
                  className="inline-flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
                >
                  <LogoMark className="size-6" />
                  <span className="text-sm font-medium">{site.name}</span>
                </Link>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t">
              <div className="mx-auto w-full max-w-2xl px-5 py-6 text-xs text-muted-foreground sm:px-8">
                Something not right?{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {site.email}
                </a>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
