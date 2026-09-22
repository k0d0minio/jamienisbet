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
}

export default nextConfig
