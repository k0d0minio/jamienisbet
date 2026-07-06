"use client"

import { useState } from "react"

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jamie-nisbet/ui"

// Mirrors billingTypes in @jamie-nisbet/services (the server action re-validates,
// so this stays a local list rather than pulling the services barrel — and its
// DB client — into the browser bundle).
const BILLING_TYPES = [
  { value: "one_off", label: "One-off" },
  { value: "retainer", label: "Retainer" },
] as const

// The billing controls shared by the create and edit deal forms: how a deal is
// billed, and — only when it's a retainer — the monthly amount and an optional
// end date. The retainer fields reveal on selection so a plain project stays a
// two-field form.
export function DealBillingFields({
  billingType = "one_off",
  recurringMinor = 0,
  activeUntil = "",
}: {
  billingType?: string
  recurringMinor?: number
  activeUntil?: string
}) {
  const [type, setType] = useState(billingType)
  const isRetainer = type === "retainer"

  return (
    <>
      <div className="grid w-36 gap-2">
        <Label htmlFor="deal-billing-type">Billing</Label>
        <Select name="billingType" value={type} onValueChange={setType}>
          <SelectTrigger id="deal-billing-type" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BILLING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isRetainer ? (
        <>
          <div className="grid w-32 gap-2">
            <Label htmlFor="deal-recurring">Monthly (€)</Label>
            <Input
              id="deal-recurring"
              name="recurringAmount"
              inputMode="decimal"
              defaultValue={
                recurringMinor > 0 ? (recurringMinor / 100).toFixed(2) : ""
              }
              placeholder="0"
            />
          </div>
          <div className="grid w-40 gap-2">
            <Label htmlFor="deal-active-until">Active until</Label>
            <Input
              id="deal-active-until"
              name="activeUntil"
              type="date"
              defaultValue={activeUntil}
            />
          </div>
        </>
      ) : null}
    </>
  )
}
