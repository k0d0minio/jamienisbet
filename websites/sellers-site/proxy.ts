import createMiddleware from "next-intl/middleware"
import { routing } from "@jamie-nisbet/app-shell/i18n"

export default createMiddleware(routing)

export const config = {
  // Skip Next internals, static files, and API routes (Stripe webhooks etc.
  // must NOT be locale-prefixed).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
