"use client"

import { useState } from "react"
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
import type { Client, DealType } from "@jamie-nisbet/services"

import { saveClientProfile } from "@/app/(app)/actions"
import { bpsToPercentInput } from "@/lib/percent"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    // Full-width on a phone: the last thing on the form and the only thing to
    // hit there, so it shouldn't be a small button floating at the left edge.
    <Button type="submit" disabled={pending} className="w-full sm:w-fit">
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
//
// Two halves: who they are, then what the deal is. The second half is more than
// a number, because not every engagement is euros invoiced — some are work
// traded for work, some pay a cut of the client's revenue, some pay in a slice
// of the company, and any of those can be true at once.
export function ClientProfileForm({ client }: { client: Client }) {
  const save = saveClientProfile.bind(null, client.id)

  // Only the deal type is held in state, and only so the barter terms box can
  // appear the moment "Exchange of services" is picked — asking what is being
  // swapped on a cash deal is a question with no answer.
  const [dealType, setDealType] = useState<DealType>(
    client.dealType === "barter" ? "barter" : "cash"
  )

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
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            defaultValue={client.email ?? ""}
            placeholder="—"
          />
        </Field>
        <Field id="phone" label="Phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={client.phone ?? ""}
            placeholder="—"
          />
        </Field>
      </div>

      <section className="grid gap-4 border-t pt-4">
        <h3 className="text-xs font-medium text-muted-foreground">Deal</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          {/* Controlled, and posted by the hidden input below: a Radix Select
              driven by `value` doesn't submit itself. */}
          <Field id="dealType" label="Paid in">
            <Select
              value={dealType}
              onValueChange={(next) => setDealType(next as DealType)}
            >
              <SelectTrigger id="dealType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="barter">Exchange of services</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="dealType" value={dealType} />
          </Field>

          <Field id="commission" label="Commission (%)">
            <Input
              id="commission"
              name="commission"
              inputMode="decimal"
              defaultValue={bpsToPercentInput(client.commissionBps)}
              placeholder="—"
            />
          </Field>
          <Field id="equity" label="Equity (%)">
            <Input
              id="equity"
              name="equity"
              inputMode="decimal"
              defaultValue={bpsToPercentInput(client.equityBps)}
              placeholder="—"
            />
          </Field>
        </div>

        {dealType === "barter" ? (
          <Field id="barterTerms" label="What's being exchanged">
            <Textarea
              id="barterTerms"
              name="barterTerms"
              rows={3}
              defaultValue={client.barterTerms ?? ""}
              placeholder="What you're doing for them, and what you're getting back…"
            />
          </Field>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Your own figure for what this is worth. A monthly one counts toward the
          recurring total on the leads list; an exchange of services is counted
          separately as <em>in kind</em>, since nothing lands in the bank for it.
          Commission is the cut of their revenue taken through Stripe, equity the
          stake in their company — both show on the leads list. Stripe stays the
          authority on what was actually invoiced and paid.
        </p>
      </section>

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
