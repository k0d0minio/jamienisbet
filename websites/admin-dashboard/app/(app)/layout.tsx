import { Toaster } from "@jamie-nisbet/ui"

import { Sidebar, TabBar } from "@/components/nav"
import { PullToRefresh } from "@/components/pull-to-refresh"

// Chrome for the authenticated area. Access is gated by proxy.ts, so anything
// rendered here is already behind a valid session.
//
// One shell, two readings of it: a phone gets a floating tab bar hovering over
// the content, an iPad-or-wider gets the same three destinations as a leading
// sidebar. Everything else — the title bar, the content column — is identical
// on both, which is the point of the scale-up.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col md:pl-60">
      <Sidebar />
      {/* Every screen is a live read with no reload button once installed —
          pulling down from the top re-fetches the lot. */}
      <PullToRefresh>
        {/* No horizontal padding: the screen's title bar is a material that
            has to reach both edges of the column, so the gutter belongs to
            AppScreen and not to <main>. `pb-tabs` clears the floating bar and
            leaves the last row somewhere to scroll to; from `md` the bar is
            gone and so is the allowance. */}
        <main className="mx-auto w-full max-w-5xl flex-1 pb-tabs md:pb-8">
          {children}
        </main>
      </PullToRefresh>
      <TabBar />
      {/* Confirmations for what you can't see from where you're standing — a
          row archived out of the list, a link copied, an edit the server
          refused. `--toaster-offset` lifts them over the floating tab bar: the
          Toaster adds the safe-area inset itself, so this is the bar and the
          gap under it and nothing else. */}
      <Toaster
        style={
          {
            "--toaster-offset":
              "calc(var(--admin-tab-height) + var(--admin-tab-gap))",
          } as React.CSSProperties
        }
      />
    </div>
  )
}
