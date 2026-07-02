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
      {/* pb-24 clears the fixed mobile tab bar; desktop drops back to normal. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
    </div>
  )
}
