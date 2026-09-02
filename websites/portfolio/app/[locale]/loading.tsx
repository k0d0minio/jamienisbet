import { LogoLoader } from "@jamie-nisbet/ui"

// What a route shows while its server render is still on its way: the JN icon,
// drawing itself in and breathing, centred in the space the page will take.
// The marketing pages are static, so this is rarely seen — a slow network on a
// first visit — which is exactly when a page should say who it belongs to.
export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center" aria-busy="true">
      <LogoLoader className="size-12 text-muted-foreground" />
    </div>
  )
}
