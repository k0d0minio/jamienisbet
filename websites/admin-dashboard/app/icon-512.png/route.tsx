import { renderAppIcon } from "@/lib/app-icon"

// 512×512 PWA icon (referenced by app/manifest.ts, also used maskable). Dotted
// path so proxy.ts serves it without an auth session.
export function GET() {
  return renderAppIcon(512)
}
