"use client"

import { useActionState } from "react"

import { DeskField, DeskInput, PendingButton } from "@jamie-nisbet/ui"

import { login, type LoginState } from "@/app/login/actions"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* The refusal is the field's own error line — under the box it belongs
          to, marking it invalid and announcing itself, rather than a boxed
          alert on the marketing tier. It used to be hand-wired here; it is
          what DeskField does for every field in the app now. */}
      <DeskField label="Password" error={state.error}>
        <DeskInput
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
        />
      </DeskField>

      <PendingButton pending={pending} pendingText="Signing in…" className="w-full">
        Sign in
      </PendingButton>
    </form>
  )
}
