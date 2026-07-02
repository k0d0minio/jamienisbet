"use client"

import { useFormStatus } from "react-dom"

import { Button, Input, Label, Textarea } from "@jamie-nisbet/ui"
import type { Client } from "@jamie-nisbet/services"

import { saveClientProfile } from "@/app/(app)/clients/actions"

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

// The editable core of a client's profile. Intake provenance (source, service,
// referral code, received date) is shown read-only elsewhere — this is where the
// owner enriches the record and keeps working notes as the relationship grows.
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
        <Field id="budget" label="Budget">
          <Input
            id="budget"
            name="budget"
            defaultValue={client.budget ?? ""}
            placeholder="—"
          />
        </Field>
        <Field id="preferredCallTime" label="Preferred call time">
          <Input
            id="preferredCallTime"
            name="preferredCallTime"
            defaultValue={client.preferredCallTime ?? ""}
            placeholder="—"
          />
        </Field>
      </div>

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
