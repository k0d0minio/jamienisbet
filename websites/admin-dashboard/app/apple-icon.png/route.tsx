import { renderAppIcon } from "@/lib/app-icon"

// 180×180 apple-touch-icon for iOS "Add to Home Screen" (iOS ignores SVG here,
// so it needs a PNG). Referenced from metadata.icons.apple in app/layout.tsx.
// Dotted path so proxy.ts serves it without an auth session.
export function GET() {
  return renderAppIcon(180)
}
