"use client"

import { useActionState } from "react"
import { TriangleAlert } from "lucide-react"

import { Input, Label, PendingButton } from "@jamie-nisbet/ui"

import { login, type LoginState } from "@/app/login/actions"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-app-subhead">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          // What the phone should do with the field: offer the saved password,
          // never capitalise or autocorrect a secret, and label the return key
          // for what it actually does. `type="password"` already picks the
          // keyboard, so there is no inputMode to declare.
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          // One field, one purpose: the keyboard should already be up.
          autoFocus
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
        />
      </div>

      {/* The app's own way of saying a write was refused — the line under the
          field it belongs to, not a boxed alert on the marketing tier. It is a
          live region because the field it explains keeps focus: without one,
          the only thing a screen reader hears after a wrong password is
          silence. */}
      {state.error ? (
        <p
          id="password-error"
          role="alert"
          className="flex items-center gap-1.5 text-app-footnote text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <PendingButton pending={pending} pendingText="Signing in…" className="w-full">
        Sign in
      </PendingButton>
    </form>
  )
}
