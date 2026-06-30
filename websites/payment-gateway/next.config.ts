import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  // The design system ships TSX source (no build step), so Next must transpile it.
  transpilePackages: ["@jamie-nisbet/ui"],
}

export default withNextIntl(nextConfig)
