import createMiddleware from "next-intl/middleware"
import { routing } from "@jamie-nisbet/app-shell/i18n"

export default createMiddleware(routing)

export const config = {
  // Skip Next internals, static files, and API routes (must NOT be
  // locale-prefixed) — plus `/f/…`, the customer questionnaires, which have
  // their own root layout and are authored in one language. The `f/` here needs
  // its slash: a bare `f` in this alternation would also swallow `/fr`.
  matcher: "/((?!api|f/|_next|_vercel|.*\\..*).*)",
}
