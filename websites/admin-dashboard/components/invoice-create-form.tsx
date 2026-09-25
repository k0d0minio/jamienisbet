"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"

import {
  Alert,
  AlertDescription,
  DeskField,
  DeskInput,
  DeskSelect,
  DeskSelectContent,
  DeskSelectItem,
  DeskSelectTrigger,
  DeskSelectValue,
  DeskTextarea,
  RecordBlock,
  RecordRow,
  RecordSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
        <RecordRow icon={<Plus />} label="New invoice" />
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
          <RecordSection>
            <RecordBlock>
              No leads yet. Add someone under{" "}
              <Link
                href="/leads"
                className="text-desk-ink underline underline-offset-2"
              >
                Leads
              </Link>{" "}
              before raising an invoice — an invoice is always addressed to a
              record, never to a name typed into a box.
            </RecordBlock>
          </RecordSection>
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
      <DeskField label="Client">
        <DeskSelect name="clientId">
          <DeskSelectTrigger className="w-full">
            <DeskSelectValue placeholder="Choose a client…" />
          </DeskSelectTrigger>
          <DeskSelectContent>
            {clients.map((client) => (
              <DeskSelectItem
                key={client.id}
                value={client.id}
                // No email means Stripe has nowhere to send the invoice — the
                // owner needs to add one on the client's profile first.
                disabled={!client.email}
              >
                {client.name}
                {client.company ? ` · ${client.company}` : ""}
                {client.email ? ` — ${client.email}` : " — add email first"}
              </DeskSelectItem>
            ))}
          </DeskSelectContent>
        </DeskSelect>
      </DeskField>

      <DeskField label="Description">
        <DeskTextarea
          name="description"
          rows={2}
          autoCapitalize="sentences"
          placeholder="e.g. AI infrastructure consulting — June 2026"
          required
        />
      </DeskField>

      {/* The amount takes the full width: it is the figure this whole form is
          about, and it should not have to share a line with a currency code. */}
      <DeskField label="Amount">
        <DeskInput
          name="amount"
          inputMode="decimal"
          enterKeyHint="next"
          placeholder="1500.00"
          required
        />
      </DeskField>

      <div className="grid grid-cols-2 gap-3">
        <DeskField label="Currency">
          <DeskInput
            name="currency"
            defaultValue="eur"
            maxLength={3}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
        </DeskField>
        <DeskField label="Due in (days)">
          <DeskInput
            name="daysUntilDue"
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            min={0}
            defaultValue={14}
          />
        </DeskField>
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
