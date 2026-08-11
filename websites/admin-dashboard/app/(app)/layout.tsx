import { Nav } from "@/components/nav"

// Chrome for the authenticated area. Access is gated by proxy.ts, so anything
// rendered here is already behind a valid session.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      {/* The bottom padding clears the fixed tab bar (3.5rem) and the
          home-indicator inset, with room to scroll the last row clear of it;
          desktop drops back to normal spacing. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
    </div>
  )
}
