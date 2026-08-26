import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

// The *house* questionnaires the Forms card sends are markdown files at the
// **repo** root (`.icm/onboarding/`), which is two levels above the *workspace*
// root: this app lives at `projects/jamienisbet/websites/admin-dashboard`, the
// pnpm workspace is `projects/jamienisbet/`, and `.icm/` sits with the ICM
// control layer at the top of the repo. Next only traces files inside
// `outputFileTracingRoot`, so that root is the repo root — not the workspace
// root — or the markdown simply wouldn't be in the serverless bundle at runtime.
// Naming it explicitly also stops Next inferring a root from the lockfile.
// `lib/onboarding.ts` falls back to reading them over the GitHub contents API if
// this ever misses — which is also how it reads the per-client questionnaires in
// each lead's own delivery repo, since those are never on this deployment's disk
// at all.
const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url))

const nextConfig: NextConfig = {
  // Shared packages ship TS/TSX source (no build step), so Next must transpile them.
  transpilePackages: ["@jamie-nisbet/ui", "@jamie-nisbet/services"],
  outputFileTracingRoot: repoRoot,
  // Keyed on every route rather than just the lead profile: the send action is
  // bundled with its own entry, and two small markdown files are not worth
  // being clever about.
  outputFileTracingIncludes: {
    "/**": ["../../../../.icm/onboarding/**"],
  },
}

export default nextConfig
