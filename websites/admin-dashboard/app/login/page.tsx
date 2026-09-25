import type { Metadata } from "next"

import { LogoFull } from "@jamie-nisbet/ui"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

// The one screen outside the shell, and the first thing a phone sees after the
// splash — so it is the screen that decides whether the app reads as a tool
// before any data has loaded, rather than as a "website with a login".
//
// It is on the desk tier like every screen behind it: the identity above a
// flat panel on a hairline — no shadow, since nothing floats — Hanken Grotesk
// on the dense scale, `DeskField` and `DeskInput` for the one field, the safe
// areas a standalone window needs, and the keyboard attributes on the field.
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 pt-screen-safe pb-screen-safe">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {/* The full lockup — the one screen in the app with room to say the
            whole name. In currentColor on the canvas, which is the logo's own
            paper (or ink), so it reads as the artwork does; and it flips with
            the appearance where the installed icon — a static PNG baked to
            the dark reading — cannot. */}
        <LogoFull className="size-32" />
        <div className="flex flex-col gap-1">
          <h1 className="text-desk-title font-bold text-desk-fg">
            Consultancy JN
          </h1>
          <p className="text-desk-ui text-desk-fg-2">
            Sign in to operate the business.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-desk-pane border border-desk-line bg-desk-surface p-5">
        <LoginForm />
      </div>
    </main>
  )
}
