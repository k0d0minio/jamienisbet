"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import {
  AppField,
  AppInput,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppTextarea,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"
import type { DealType } from "@jamie-nisbet/services"

import { saveDealTerms } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"
import { formatMoney } from "@/lib/money"
import { bpsToPercentInput, formatBps } from "@/lib/percent"

// What the engagement is worth and how it settles — read as rows, edited in a
// sheet. Only the terms that are actually set take a row, so a plain cash deal
// reads as one line rather than a group of dashes.

// Billing and deal type arrive as the plain strings the Client row carries;
// this card normalises (anything unrecognised reads as a one-off cash deal,
// matching the server action's own fallback).
export type DealDetails = {
  id: string
  valueMinor: number
  billingType: string
  dealType: string
  barterTerms: string | null
  commissionBps: number | null
  equityBps: number | null
}

export function LeadDealCard({ client }: { client: DealDetails }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  // Held in state only so the barter box can appear the moment "Exchange of
  // services" is picked; posted through the hidden input below.
  const [dealType, setDealType] = useState<DealType>(
    client.dealType === "barter" ? "barter" : "cash"
  )

  // Every figure is mono — numbers are the brand's signature on every tier.
  const facts: { label: string; value: string }[] = []
  if (client.valueMinor > 0) {
    const amount = formatMoney(client.valueMinor, "eur")
    facts.push({
      label: client.dealType === "barter" ? "Value (in kind)" : "Value",
      value: client.billingType === "monthly" ? `${amount}/mo` : amount,
    })
  }
  if (client.dealType === "barter") {
    facts.push({ label: "Paid in", value: "Exchange of services" })
  }
  if ((client.commissionBps ?? 0) > 0) {
    facts.push({ label: "Commission", value: formatBps(client.commissionBps!) })
  }
  if ((client.equityBps ?? 0) > 0) {
    facts.push({ label: "Equity", value: formatBps(client.equityBps!) })
  }

  const barter = client.dealType === "barter" ? client.barterTerms : null

  return (
    <GroupedSection
      header="Deal"
      footer="Your own figure for what this is worth — Stripe stays the authority on what was invoiced and paid."
    >
      {facts.map((fact) => (
        <GroupedRow
          key={fact.label}
          label={fact.label}
          chevron={false}
          value={<span className="font-mono">{fact.value}</span>}
        />
      ))}

      {barter ? (
        <GroupedBlock>
          <span className="mb-1 block text-app-footnote text-app-label-3">
            What&apos;s being exchanged
          </span>
          <p className="whitespace-pre-wrap">{barter}</p>
        </GroupedBlock>
      ) : null}

      {facts.length === 0 && !barter ? (
        <GroupedBlock>
          No deal terms yet — price it below once the shape firms up.
        </GroupedBlock>
      ) : null}

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          // Re-arm the barter toggle from the record on the way in, so a
          // half-edited, cancelled sheet doesn't leak state into the next one.
          if (next) setDealType(client.dealType === "barter" ? "barter" : "cash")
        }}
      >
        <SheetTrigger asChild>
          <GroupedRow icon={<Pencil />} label="Edit deal" />
        </SheetTrigger>
        <SheetContent detents={["medium", "large"]}>
          <SheetHeader>
            <SheetTitle>Edit deal</SheetTitle>
            <SheetDescription>
              Your own figure for what this is worth — Stripe stays the
              authority on what was actually invoiced and paid. An exchange of
              services counts separately as <em>in kind</em>.
            </SheetDescription>
          </SheetHeader>
          <form
            action={(formData) =>
              startTransition(async () => {
                hapticTick()
                try {
                  await saveDealTerms(client.id, formData)
                  setOpen(false)
                } catch {
                  // The sheet stays open on a failure, so the fields you
                  // typed are still there to try again with.
                  toast.error("Couldn't save the deal terms")
                }
              })
            }
            className="grid gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <AppField label="Value (€)">
                <AppInput
                  name="value"
                  inputMode="decimal"
                  defaultValue={
                    client.valueMinor > 0
                      ? (client.valueMinor / 100).toFixed(2)
                      : ""
                  }
                  placeholder="0.00"
                />
              </AppField>
              <AppField label="Billed">
                <AppSelect
                  name="billingType"
                  defaultValue={
                    client.billingType === "monthly" ? "monthly" : "one_off"
                  }
                >
                  <AppSelectTrigger className="w-full">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value="one_off">One-off</AppSelectItem>
                    <AppSelectItem value="monthly">Every month</AppSelectItem>
                  </AppSelectContent>
                </AppSelect>
              </AppField>
            </div>

            <AppField label="Paid in">
              <AppSelect
                value={dealType}
                onValueChange={(next) => setDealType(next as DealType)}
              >
                <AppSelectTrigger className="w-full">
                  <AppSelectValue />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="cash">Cash</AppSelectItem>
                  <AppSelectItem value="barter">
                    Exchange of services
                  </AppSelectItem>
                </AppSelectContent>
              </AppSelect>
              <input type="hidden" name="dealType" value={dealType} />
            </AppField>

            {dealType === "barter" ? (
              <AppField label="What's being exchanged">
                <AppTextarea
                  name="barterTerms"
                  rows={3}
                  defaultValue={client.barterTerms ?? ""}
                  placeholder="What you're doing for them, and what you're getting back…"
                />
              </AppField>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <AppField label="Commission (%)">
                <AppInput
                  name="commission"
                  inputMode="decimal"
                  defaultValue={bpsToPercentInput(client.commissionBps)}
                  placeholder="—"
                />
              </AppField>
              <AppField label="Equity (%)">
                <AppInput
                  name="equity"
                  inputMode="decimal"
                  defaultValue={bpsToPercentInput(client.equityBps)}
                  placeholder="—"
                />
              </AppField>
            </div>

            <PendingButton
              pending={pending}
              pendingText="Saving…"
              className="w-full sm:w-fit"
            >
              Save
            </PendingButton>
          </form>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
