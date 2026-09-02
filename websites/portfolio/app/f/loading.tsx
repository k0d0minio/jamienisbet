import { LogoLoader } from "@jamie-nisbet/ui"

// What a route shows while its server render is still on its way: the JN icon,
// drawing itself in and breathing, centred in the space the page will take.
// A questionnaire is rendered per request (it reads the record it belongs to),
// so this is the first thing a customer sees on a slow network — and it should
// say who the form belongs to.
export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center" aria-busy="true">
      <LogoLoader className="size-12 text-muted-foreground" />
    </div>
  )
}
