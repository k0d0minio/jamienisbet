"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"

import { Button } from "./button"
import { Spinner } from "./spinner"

// A submit that shows it's working, so no call site has to wire the spinner and
// the disabled state by hand again.
//
// Two ways in, because the app writes in two shapes:
//   * inside a `<form action={…}>` — drop it in and `useFormStatus` supplies the
//     pending flag for free;
//   * driving a server action from `useTransition` — pass `pending` explicitly
//     and it wins over the form status.
//
// The label stays put while pending — the spinner is added ahead of it rather
// than swapped in, so the button keeps roughly its width and the thumb keeps its
// target. `pendingLabel` replaces the words for the cases worth narrating
// ("Saving…"), which is also how a call site drops an icon it doesn't want
// sitting next to the spinner.
function PendingButton({
  children,
  pending: pendingProp,
  pendingLabel,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Overrides the enclosing form's status — for `useTransition` callers. */
  pending?: boolean
  /** Replaces the label while pending. Defaults to keeping `children`. */
  pendingLabel?: React.ReactNode
}) {
  // Safe outside a form: `useFormStatus` simply reports `false` there.
  const { pending: formPending } = useFormStatus()
  const pending = pendingProp ?? formPending

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      // Disabled already dims it; this says *why*, for anything watching.
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
      {...props}
    >
      {pending ? <Spinner label="" /> : null}
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </Button>
  )
}

export { PendingButton }
