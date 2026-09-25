import { Toaster } from "@jamie-nisbet/ui"

import { PaletteProvider } from "@/components/command-palette"
import { Rail, TabBar } from "@/components/nav"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { countInbox } from "@/lib/inbox"

// Chrome for the authenticated area. Access is gated by proxy.ts, so anything
// rendered here is already behind a valid session.
//
// One shell, two readings of it, both on the desk tier (D-5): from `md` a 56px
// icon rail on the leading edge, below it a flat tab bar on the bottom one —
// and the command palette over either, one ⌘K away. The screens inside keep
// their own tier until each is moved; only the chrome changed here.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The Inbox badge: follow-ups plus gates. Not awaited: it streams into the
  // rail and the tab bar as a promise, so no screen's first paint waits on a
  // Neon or GitHub read for a number — and the GitHub half is the 60-second
  // cached read the Inbox itself makes. It never rejects (lib/inbox.ts), so a
  // failed read hides the badge rather than taking the shell's error boundary
  // with it.
  const inboxCount = countInbox()

  return (
    <PaletteProvider>
      <div className="flex min-h-dvh flex-col md:pl-rail-safe">
        <Rail inboxCount={inboxCount} />
        {/* Every screen is a live read with no reload button once installed —
            pulling down from the top re-fetches the lot. */}
        <PullToRefresh>
          {/* The content takes the rest of the window. No horizontal padding
              and no width cap here: a screen's title bar has to reach both
              edges of its column, so the gutter belongs to DeskScreen — and so
              does the reading width, which every screen but Work keeps
              (DeskScreen's `wide`). `pb-tabs` clears the tab bar and leaves the
              last row somewhere to scroll to; from `md` the bar is gone and so
              is the allowance. */}
          <main className="w-full flex-1 pb-tabs md:pb-8">{children}</main>
        </PullToRefresh>
        <TabBar inboxCount={inboxCount} />
        {/* Confirmations for what you can't see from where you're standing — a
            row archived out of the list, a link copied, an edit the server
            refused. `--toaster-offset` lifts them over the tab bar: the
            Toaster adds the safe-area inset itself, so this is the bar and
            nothing else. */}
        <Toaster
          style={
            {
              "--toaster-offset":
                "calc(var(--admin-tab-height) + var(--admin-tab-gap))",
            } as React.CSSProperties
          }
        />
      </div>
    </PaletteProvider>
  )
}
