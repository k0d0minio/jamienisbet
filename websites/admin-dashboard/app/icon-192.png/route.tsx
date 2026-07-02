import { renderAppIcon } from "@/lib/app-icon"

// 192×192 PWA icon (referenced by app/manifest.ts). Named with a dotted path so
// proxy.ts's static-file matcher lets it through without an auth session.
export function GET() {
  return renderAppIcon(192)
}
