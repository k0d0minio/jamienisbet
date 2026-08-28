"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"

import { Button } from "./button"
import { Spinner } from "./spinner"

// The pending-action affordance: a Button that shows the rolling-deploy
// spinner and disables itself while its action is in flight, so a submit
// acknowledges the press for free. Two ways in:
//
//   - Inside a <form action={…}> it reads useFormStatus() on its own:
//       <PendingButton>Send brief</PendingButton>
//   - For useTransition flows, pass the flag:
//       <PendingButton pending={isPending} pendingText="Saving…">Mark touched</PendingButton>
//
// `pendingText` replaces the children while pending (use it when the resting
// label carries an icon); without it the spinner slots in ahead of the label.
function PendingButton({
  pending: pendingProp,
  pendingText,
  type = "submit",
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Overrides the surrounding form's status (e.g. from useTransition). */
  pending?: boolean
  /** Label shown while pending, in place of the children. */
  pendingText?: React.ReactNode
}) {
  // Outside a <form> this reports { pending: false }, so the prop decides.
  const formStatus = useFormStatus()
  const pending = pendingProp ?? formStatus.pending

  return (
    <Button
      type={type}
      data-pending={pending || undefined}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? (
        <>
          {/* aria-busy on the button already tells the story. */}
          <Spinner aria-hidden="true" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { PendingButton }
