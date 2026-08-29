"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"

import {
  Alert,
  AlertDescription,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  Input,
  Label,
  PendingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
  toast,
} from "@jamie-nisbet/ui"

import { createInvoice, type InvoiceFormState } from "@/app/(app)/money/actions"
import { hapticTick } from "@/lib/haptics"

// Raise a new invoice against an existing lead. It creates a *draft* and
// nothing else: finalizing it and emailing it is a separate, deliberate click
// on the invoice's own sheet, which is the estate's "no outbound action without
// review" boundary drawn where it can be seen.
//
// It used to be a fold-out card sitting between the Invoices heading and the
// invoices themselves — open, it pushed what was owed off the screen; closed,
// it was a row of chrome above the only thing you came to read. Now it is the
// first row of the section and the form is a sheet, the way every other create
// flow in this app works.
//
// The lead picker still only offers leads that are in the database. An invoice
// is addressed to a record, never to a name typed into a box, so the Stripe
// customer can be resolved (and linked back onto the lead) server-side.

/** The slice of a client the picker needs. Kept to plain fields so this client
 *  component never imports the services package (and its DB client) — the page
 *  maps the full rows down to this before passing them in. */
export type InvoiceClientOption = {
  id: string
  name: string
  email: string | null
  company: string | null
}

export function InvoiceCreateForm({ clients }: { clients: InvoiceClientOption[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <GroupedRow icon={<Plus />} label="New invoice" />
      </SheetTrigger>

      {/* One `large` detent rather than two: five fields and a submit is taller
          than a half sheet, so resting it at half height would open it already
          scrolling. The handle still drags it off the bottom to dismiss. */}
      <SheetContent detents={["large"]}>
        <SheetHeader>
          <SheetTitle>New invoice</SheetTitle>
          <SheetDescription>
            It is created as a draft. Emailing it is a separate step, from the
            invoice itself.
          </SheetDescription>
        </SheetHeader>

        {clients.length === 0 ? (
          <GroupedSection>
            <GroupedBlock>
              No leads yet. Add someone under{" "}
              <Link
                href="/leads"
                className="text-app-tint underline underline-offset-2"
              >
                Leads
              </Link>{" "}
              before raising an invoice — an invoice is always addressed to a
              record, never to a name typed into a box.
            </GroupedBlock>
          </GroupedSection>
        ) : (
          // Mounted only while the sheet is open, so its action state starts
          // clean every time: an error from the attempt before would otherwise
          // still be sitting there when the sheet is opened again.
          <InvoiceForm clients={clients} onCreated={() => setOpen(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function InvoiceForm({
  clients,
  onCreated,
}: {
  clients: InvoiceClientOption[]
  onCreated: () => void
}) {
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    createInvoice,
    {}
  )

  // The draft lands in the list behind this sheet, so the confirmation is a
  // toast and the sheet gets out of the way. The ref keeps it to one: `state`
  // is a fresh object per submit, and an effect that runs twice (development's
  // strict double-invoke) would otherwise say it twice.
  const toasted = useRef<InvoiceFormState | null>(null)
  useEffect(() => {
    if (state.success && toasted.current !== state) {
      toasted.current = state
      toast.success(state.success)
      onCreated()
    }
  }, [state, onCreated])

  return (
    <form
      // Raising a draft is a state change, so the glass answers the tap. It
      // rides on the action rather than on the button, so a submit the browser
      // refuses for a missing field never buzzes.
      action={(formData) => {
        hapticTick()
        formAction(formData)
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          autoCapitalize="sentences"
          placeholder="e.g. AI infrastructure consulting — June 2026"
          required
        />
      </div>

      {/* The amount takes the full width: it is the figure this whole form is
          about, and it should not have to share a line with a currency code. */}
      <div className="flex flex-col gap-1.5">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue="eur"
            maxLength={3}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
        </div>
        <div className="flex flex-col gap-1.5">
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

      {/* Full-width and last, so the thumb lands on it. */}
      <PendingButton pending={pending} pendingText="Creating…" className="w-full">
        Create draft invoice
      </PendingButton>
    </form>
  )
}
