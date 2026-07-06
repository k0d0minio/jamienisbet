"use client"

import { useFormStatus } from "react-dom"

import { Button, Input, Label } from "@jamie-nisbet/ui"

import { createDealAction } from "@/app/(app)/deals/actions"
import { DealBillingFields } from "@/components/deal-billing-fields"

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-fit">
      {pending ? "Creating…" : "New deal"}
    </Button>
  )
}

// Opens a deal (one opportunity) on the client — the entry point of the
// pipeline. For a one-off, value is optional (the proposal's payment structure
// sets it); for a retainer, the monthly amount is entered here.
export function DealCreateForm({ clientId }: { clientId: string }) {
  const create = createDealAction.bind(null, clientId)

  return (
    <form action={create} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 flex-1 gap-2">
        <Label htmlFor="deal-title">Deal</Label>
        <Input
          id="deal-title"
          name="title"
          required
          placeholder="e.g. Booking automation for the studio"
        />
      </div>
      <div className="grid w-32 gap-2">
        <Label htmlFor="deal-value">Value (€)</Label>
        <Input id="deal-value" name="value" inputMode="decimal" placeholder="0" />
      </div>
      <DealBillingFields />
      <CreateButton />
    </form>
  )
}
