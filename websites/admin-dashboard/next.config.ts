import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Shared packages ship TS/TSX source (no build step), so Next must transpile them.
  transpilePackages: ["@jamie-nisbet/ui", "@jamie-nisbet/services", "@jamie-nisbet/icm"],

  // The ICM runtime (@jamie-nisbet/icm) reads Layer 2–3 repo files at request
  // time — stage contracts, templates, brand voice, rates, design tokens.
  // File tracing can't see fs reads, so ship them with the AI routes
  // explicitly, preserving their repo-relative layout. pnpm-workspace.yaml is
  // included as the repo-root marker findRepoRoot() walks up to.
  outputFileTracingIncludes: {
    "/api/ai/*": [
      "../../pnpm-workspace.yaml",
      "../../_config/**",
      "../../shared/templates/**",
      "../../workspaces/*/stages/*/CONTEXT.md",
      "../../workspaces/*/references/**",
      "../../workspaces/*/setup/output/**",
      "../../packages/ui/tokens/**",
    ],
  },
}

export default nextConfig
