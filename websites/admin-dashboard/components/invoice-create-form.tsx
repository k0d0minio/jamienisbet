"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@jamie-nisbet/ui"

import { createInvoice, type InvoiceFormState } from "@/app/(app)/invoices/actions"

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

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No clients yet. Add one under{" "}
        <Link href="/clients" className="underline underline-offset-2">
          Clients
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
