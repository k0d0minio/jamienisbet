"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"

import {
  Alert,
  AlertDescription,
  Input,
  Label,
  PendingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@jamie-nisbet/ui"

import { createInvoice, type InvoiceFormState } from "@/app/(app)/money/actions"

// The slice of a client the picker needs. Kept to plain fields so this client
// component never imports the services package (and its DB client) — the page
// maps the full client rows down to this before passing them in.
export type InvoiceClientOption = {
  id: string
  name: string
  email: string | null
  company: string | null
}

// Raise a new invoice against an existing client. Creates a *draft* — the owner
// reviews it in the list and clicks "Finalize & send" to email it. Clears itself
// after a successful create.
export function InvoiceCreateForm({ clients }: { clients: InvoiceClientOption[] }) {
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    createInvoice,
    {}
  )

  // Remount the form after a successful create to clear every field — including
  // the Radix select, which a native form.reset() wouldn't. `state` is a fresh
  // object per submit, so comparing it against the last one we handled bumps the
  // key exactly once per success; doing it during render (not an effect) keeps
  // clear of the no-setState-in-effect rule.
  const [formKey, setFormKey] = useState(0)
  const [lastState, setLastState] = useState<InvoiceFormState>(state)
  if (state !== lastState) {
    setLastState(state)
    if (state.success) setFormKey((k) => k + 1)
  }

  // The draft appears in the list further down the page — often below the fold,
  // and the form has just blanked itself — so the confirmation is a toast. The
  // ref is what keeps it to one: `state` is a fresh object per submit, and an
  // effect that runs twice (development's strict double-invoke) would otherwise
  // say it twice.
  const toastedFor = useRef<InvoiceFormState | null>(null)
  useEffect(() => {
    if (state.success && toastedFor.current !== state) {
      toastedFor.current = state
      toast.success(state.success)
    }
  }, [state])

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No leads yet. Add one under{" "}
        <Link href="/" className="underline underline-offset-2">
          Leads
        </Link>{" "}
        before raising an invoice.
      </p>
    )
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="clientId">Client</Label>
        <Select name="clientId">
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder="Choose a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem
                key={client.id}
                value={client.id}
                // No email means Stripe has nowhere to send the invoice — the
                // owner needs to add one on the client's profile first.
                disabled={!client.email}
              >
                {client.name}
                {client.company ? ` · ${client.company}` : ""}
                {client.email ? ` — ${client.email}` : " — add email first"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            enterKeyHint="next"
            placeholder="1500.00"
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="daysUntilDue">Due in (days)</Label>
          <Input
            id="daysUntilDue"
            name="daysUntilDue"
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
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
      <PendingButton pending={pending} pendingText="Creating…" className="self-start">
        Create draft invoice
      </PendingButton>
    </form>
  )
}
