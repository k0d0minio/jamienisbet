import type { Metadata } from "next"

import { LogoFull } from "@jamie-nisbet/ui"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

// The one screen outside the shell, and the first thing a phone sees after the
// splash — so it is the screen that decides whether the app reads as native
// before any data has loaded. It used to be a shadcn Card on the marketing
// tier, which is exactly the "website with a login" the redesign was against.
//
// One deliberate departure from the checklist that cut this pass: **the panel
// is a lifted surface, not a material.** A material's whole job is blurring
// what scrolls beneath it, and nothing is behind this one: over a flat canvas,
// `material-thick` resolves to within a percent of `--app-group` and costs a
// backdrop-filter to get there. Blur for decoration is the one thing the tier's
// amendment did not license.
//
// The second departure has since closed. The field was left on the design
// system's marketing `Input` because giving login its own would have made it
// the odd screen out again, just differently — and it now uses `AppField` and
// `AppInput` along with every other form in the admin, which is what that
// ticket was waiting for.
//
// Everything else the screen owns was settled here: the identity above the
// panel, the native type scale, the tier's radius and elevation, the safe areas
// a standalone window needs, and the keyboard attributes on the field.
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-app-gutter pt-screen-safe pb-screen-safe">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {/* The full lockup — the one screen in the app with room to say the
            whole name. In currentColor on the canvas, which is the logo's own
            paper (or ink), so it reads as the artwork does; and it flips with
            the appearance where the installed icon — a static PNG baked to
            the dark reading — cannot. */}
        <LogoFull className="size-32" />
        <div className="flex flex-col gap-1">
          <h1 className="text-app-title-1 font-bold text-app-label">
            Consultancy JN
          </h1>
          <p className="text-app-subhead text-app-label-2">
            Sign in to operate the business.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-app-card border border-app-separator bg-app-group p-5 shadow-app-raised">
        <LoginForm />
      </div>
    </main>
  )
}
