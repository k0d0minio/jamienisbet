import type { Metadata } from "next"

import { LogoMarkSolid } from "@jamie-nisbet/ui"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

// The one screen outside the shell, and the first thing a phone sees after the
// splash — so it is the screen that decides whether the app reads as native
// before any data has loaded. It used to be a shadcn Card on the marketing
// tier, which is exactly the "website with a login" the redesign was against.
//
// Two deliberate departures from the checklist that cut this pass:
//
//   - **The panel is a lifted surface, not a material.** A material's whole job
//     is blurring what scrolls beneath it, and nothing is behind this one: over
//     a flat canvas, `material-thick` resolves to within a percent of
//     `--app-group` and costs a backdrop-filter to get there. Blur for
//     decoration is the one thing the tier's amendment did not license.
//   - **The field is the app's ordinary field.** Every form in the admin — add
//     a lead, the todo sheet, the profile's edit sheets — uses the design
//     system's `Input`; giving login its own would make it the odd screen out
//     again, just differently. App-tier form controls are a package-wide
//     question, filed as its own ticket.
//
// What did change is everything the screen owns: the identity above the panel,
// the native type scale, the tier's radius and elevation, the safe areas a
// standalone window needs, and the keyboard attributes below.
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-app-gutter pt-screen-safe pb-screen-safe">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {/* The installed icon, at the size it sits on a home screen — the same
            tile the splash showed a second ago, so the app is recognisably
            the thing that was just launched. */}
        <LogoMarkSolid className="size-14" />
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
