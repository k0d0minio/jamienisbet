import type { NextConfig } from "next"

// The house questionnaires the Forms card sends used to be markdown at this
// repo's root (`.icm/onboarding/`), traced into the serverless bundle from
// here. They moved to icm-board's `workspaces/sell/references/forms/` on
// 2026-09-22 (the deal workspace owns them), so `lib/onboarding.ts` reads them
// over the read-only GitHub contents API — the same way it always read a
// client repo's own questionnaires — and nothing outside this app's folder
// needs tracing any more.
const nextConfig: NextConfig = {
  // Shared packages ship TS/TSX source (no build step), so Next must transpile them.
  transpilePackages: ["@jamie-nisbet/ui", "@jamie-nisbet/services"],
  // The board was /tickets until Work became home at `/` (D-6). Every old
  // link — a bookmark, a home-screen shortcut, a `?t=` pasted into a note —
  // lands on the same view: a redirect with no query in its destination
  // passes the request's query through untouched.
  async redirects() {
    return [{ source: "/tickets", destination: "/", permanent: true }]
  },
}

export default nextConfig
