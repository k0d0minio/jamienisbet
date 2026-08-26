import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "./lib/auth"

// Gate every page on a valid session cookie. Unauthenticated requests are sent to
// /login; an already-authenticated user hitting /login is bounced to the dashboard.
export default async function proxy(req: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const authed = Boolean(secret) && (await verifySessionToken(token, secret as string))

  const isLoginRoute = req.nextUrl.pathname === "/login"

  if (!authed && !isLoginRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (authed && isLoginRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip Next internals, static files, and API routes.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
