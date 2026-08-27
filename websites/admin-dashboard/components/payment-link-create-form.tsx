"use client"

import { useActionState, useEffect, useRef } from "react"

import {
  Alert,
  AlertDescription,
  Input,
  Label,
  PendingButton,
  toast,
} from "@jamie-nisbet/ui"

import {
  createPaymentLink,
  type PaymentLinkFormState,
} from "@/app/(app)/money/actions"
import { CopyButton } from "@/components/copy-button"

// Mint a reusable payment link for a fixed amount. On success the new URL is
// shown with a copy button so it can be shared straight away.
export function PaymentLinkCreateForm() {
  const [state, formAction, pending] = useActionState<PaymentLinkFormState, FormData>(
    createPaymentLink,
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)

  // The link itself stays on screen in the alert below — it's the thing you
  // came for and it has to be copyable — so the toast only says it worked.
  const toastedFor = useRef<PaymentLinkFormState | null>(null)
  useEffect(() => {
    if (state.success && toastedFor.current !== state) {
      toastedFor.current = state
      formRef.current?.reset()
      toast.success("Payment link created")
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 sm:col-span-1">
          <Label htmlFor="name">Product / service</Label>
          <Input
            id="name"
            name="name"
            placeholder="Discovery call"
            required
            enterKeyHint="next"
            autoCapitalize="sentences"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            enterKeyHint="next"
            placeholder="250.00"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue="eur"
            maxLength={3}
            enterKeyHint="done"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success && state.url ? (
        <Alert variant="success">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span className="break-all font-mono text-xs">{state.url}</span>
            <CopyButton value={state.url} what="Payment link" />
          </AlertDescription>
        </Alert>
      ) : null}

      <PendingButton pending={pending} pendingLabel="Creating…" className="self-start">
        Create payment link
      </PendingButton>
    </form>
  )
}
