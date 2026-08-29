"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"

import {
  Alert,
  AlertDescription,
  GroupedRow,
  Input,
  Label,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"

import {
  createPaymentLink,
  type PaymentLinkFormState,
} from "@/app/(app)/money/actions"
import { hapticTick } from "@/lib/haptics"
import { CopyButton } from "@/components/copy-button"

// Mint a reusable link for a fixed amount. Unlike an invoice it is addressed to
// nobody and emails nobody — it only becomes outbound when it is copied and
// shared, which is why it is safe to create in one step.
//
// The sheet stays open after a successful mint, which is the one place this
// differs from every other create flow here: the URL is the thing you came for
// and it has to be copyable before it goes anywhere. Everything else about the
// link is already in the list behind.

export function PaymentLinkCreateForm() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <GroupedRow icon={<Plus />} label="New payment link" />
      </SheetTrigger>

      {/* Three short fields fit the half sheet with the list still visible
          behind it; the drag up is there for the minted URL, which wraps. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>New payment link</SheetTitle>
          <SheetDescription>
            A reusable link for a fixed amount. Nothing is sent — it goes out
            when you copy it.
          </SheetDescription>
        </SheetHeader>

        {/* Mounted only while the sheet is open, so its action state starts
            clean each time rather than reopening on the last result. */}
        <PaymentLinkForm />
      </SheetContent>
    </Sheet>
  )
}

function PaymentLinkForm() {
  const [state, formAction, pending] = useActionState<
    PaymentLinkFormState,
    FormData
  >(createPaymentLink, {})
  const formRef = useRef<HTMLFormElement>(null)

  // The link itself stays on screen below — it is the thing you came for — so
  // the toast only says it worked, and the fields clear for the next one.
  const toasted = useRef<PaymentLinkFormState | null>(null)
  useEffect(() => {
    if (state.success && toasted.current !== state) {
      toasted.current = state
      formRef.current?.reset()
      toast.success("Payment link created")
    }
  }, [state])

  return (
    <form
      ref={formRef}
      // Minting a link is a state change, so the glass answers the tap. It
      // rides on the action rather than on the button, so a submit the browser
      // refuses for a missing field never buzzes.
      action={(formData) => {
        hapticTick()
        formAction(formData)
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
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
        <div className="flex flex-col gap-1.5">
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
            <span className="font-mono text-app-caption break-all">{state.url}</span>
            <CopyButton value={state.url} what="Payment link" />
          </AlertDescription>
        </Alert>
      ) : null}

      <PendingButton pending={pending} pendingText="Creating…" className="w-full">
        Create payment link
      </PendingButton>
    </form>
  )
}
