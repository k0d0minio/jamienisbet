"use client"

import { useFormStatus } from "react-dom"

import { Button, Input, Label } from "@jamie-nisbet/ui"

import { updateDealDetailsAction } from "@/app/(app)/deals/actions"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  )
}

export function DealDetailsForm({
  id,
  title,
  valueMinor,
}: {
  id: string
  title: string
  valueMinor: number
}) {
  const save = updateDealDetailsAction.bind(null, id)

  return (
    <form action={save} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 flex-1 gap-2">
        <Label htmlFor="deal-edit-title">Title</Label>
        <Input id="deal-edit-title" name="title" defaultValue={title} required />
      </div>
      <div className="grid w-32 gap-2">
        <Label htmlFor="deal-edit-value">Value (€)</Label>
        <Input
          id="deal-edit-value"
          name="value"
          inputMode="decimal"
          defaultValue={valueMinor > 0 ? (valueMinor / 100).toFixed(2) : ""}
          placeholder="0"
        />
      </div>
      <SaveButton />
    </form>
  )
}
