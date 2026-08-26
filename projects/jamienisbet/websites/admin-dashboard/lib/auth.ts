// Single-owner session auth. The admin has exactly one user, so "logged in" is a
// signed, tamper-proof cookie rather than a user table. Signing uses Web Crypto
// (HMAC-SHA256) so the same code runs in both the Node server actions and the
// proxy (middleware) runtime.

export const SESSION_COOKIE = "admin_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days, in seconds

const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return toBase64Url(new Uint8Array(signature))
}

// Length-independent comparison to avoid leaking match position via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

// A token is `v1.<expiryEpochSeconds>.<hmac>`.
export async function createSessionToken(secret: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `v1.${expires}`
  const signature = await sign(payload, secret)
  return `${payload}.${signature}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [version, expiresStr, signature] = parts
  const payload = `${version}.${expiresStr}`
  const expected = await sign(payload, secret)
  if (!safeEqual(signature, expected)) return false
  const expires = Number(expiresStr)
  if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false
  return true
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(input, expected)
}

export function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set — admin auth cannot run (see .env.example)."
    )
  }
  return secret
}
