import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

// The questionnaires the Forms card sends are markdown files at the repo root
// (`.icm/onboarding/`), outside this app's folder — so the workspace root has to
// be named explicitly (Next would otherwise infer it from the lockfile) and the
// folder traced into the serverless bundle, or the files simply wouldn't be
// there at runtime. `lib/onboarding.ts` falls back to reading them over the
// GitHub contents API if this ever misses.
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url))

const nextConfig: NextConfig = {
  // Shared packages ship TS/TSX source (no build step), so Next must transpile them.
  transpilePackages: ["@jamie-nisbet/ui", "@jamie-nisbet/services"],
  outputFileTracingRoot: workspaceRoot,
  // Keyed on every route rather than just the lead profile: the send action is
  // bundled with its own entry, and two small markdown files are not worth
  // being clever about.
  outputFileTracingIncludes: {
    "/**": ["../../.icm/onboarding/**"],
  },
}

export default nextConfig
