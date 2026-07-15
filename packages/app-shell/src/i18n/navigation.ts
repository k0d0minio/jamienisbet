import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Locale-aware Link/router/redirect/pathname. ALWAYS import these instead of
// next/link and next/navigation so the active locale prefix is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
