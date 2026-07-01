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
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
