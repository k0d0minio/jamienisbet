import "server-only"
import { cookies } from "next/headers"

import { SESSION_COOKIE, sessionSecret, verifySessionToken } from "./auth"

/**
 * Route handlers live under /api, which the proxy (middleware) matcher skips —
 * so every API route validates the same signed session cookie itself. Returns
 * a 401 Response to send back, or null when the owner is authenticated.
 */
export async function requireSession(): Promise<Response | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const ok = await verifySessionToken(token, sessionSecret())
  if (!ok) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }
  return null
}
