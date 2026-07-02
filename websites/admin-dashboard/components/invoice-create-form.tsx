"use client"

import { useActionState, useEffect, useRef } from "react"

import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Textarea,
} from "@jamie-nisbet/ui"

import { createInvoice, type InvoiceFormState } from "@/app/(app)/invoices/actions"

// Raise a new invoice. Creates a *draft* — the owner reviews it in the list and
// clicks "Finalize & send" to email it. Clears itself after a successful create.
export function InvoiceCreateForm() {
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    createInvoice,
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="customerName">Customer name</Label>
          <Input id="customerName" name="customerName" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="customerEmail">Customer email</Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="off"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          placeholder="e.g. AI infrastructure consulting — June 2026"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="1500.00"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue="eur" maxLength={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="daysUntilDue">Due in (days)</Label>
          <Input
            id="daysUntilDue"
            name="daysUntilDue"
            type="number"
            min={0}
            defaultValue={14}
          />
        </div>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert variant="success">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create draft invoice"}
      </Button>
    </form>
  )
}
