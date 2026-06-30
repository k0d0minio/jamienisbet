import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  // Skip Next internals, static files, and API routes (must NOT be
  // locale-prefixed).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
