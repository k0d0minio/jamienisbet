"use client"

import { useFormStatus } from "react-dom"

import {
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
import type { Client } from "@jamie-nisbet/services"

import { saveClientProfile } from "@/app/(app)/actions"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-fit">
      {pending ? "Saving…" : "Save changes"}
    </Button>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

/** Minor units back to the major-unit string the form edits ("150000" → "1500.00").
 * Zero shows as an empty field — "no figure yet" reads better than "€0.00". */
function toMajor(minor: number): string {
  return minor > 0 ? (minor / 100).toFixed(2) : ""
}

// The editable core of a lead's profile. How they came in (source, service,
// referral code, budget indicated, received date) is shown read-only under
// Intake — this is where the record is enriched, priced, and kept notes on.
export function ClientProfileForm({ client }: { client: Client }) {
  const save = saveClientProfile.bind(null, client.id)

  return (
    <form action={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name">
          <Input id="name" name="name" defaultValue={client.name} required />
        </Field>
        <Field id="company" label="Company">
          <Input
            id="company"
            name="company"
            defaultValue={client.company ?? ""}
            placeholder="—"
          />
        </Field>
        <Field id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
            placeholder="—"
          />
        </Field>
        <Field id="phone" label="Phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={client.phone ?? ""}
            placeholder="—"
          />
        </Field>
        <Field id="value" label="Value (€)">
          <Input
            id="value"
            name="value"
            inputMode="decimal"
            defaultValue={toMajor(client.valueMinor)}
            placeholder="0.00"
          />
        </Field>
        <Field id="billingType" label="Billed">
          <Select name="billingType" defaultValue={client.billingType}>
            <SelectTrigger id="billingType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_off">One-off</SelectItem>
              <SelectItem value="monthly">Every month</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Your own figure for what this is worth. A monthly one counts toward the
        recurring total on the leads list; Stripe stays the authority on what was
        actually invoiced and paid.
      </p>

      <Field id="notes" label="Notes">
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          defaultValue={client.notes ?? ""}
          placeholder="Working notes — calls, decisions, next steps…"
        />
      </Field>

      <SaveButton />
    </form>
  )
}
