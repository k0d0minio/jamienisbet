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
import {
  dealComponents,
  type DealTerms,
  type DealType,
} from "@jamie-nisbet/services"

import { saveDealTerms } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"
import { formatMoney } from "@/lib/money"
import { bpsToPercentInput, formatBps } from "@/lib/percent"

// What was agreed, read as rows and edited in a sheet.
//
// A deal is components — a fee, a swap, a stake, a cut — and any one of them is
// a whole deal. So the rows are built from `dealComponents` rather than from
// the columns: only the terms that are actually set take a line, none of them
// waits on another, and an engagement paid entirely in equity reads as a deal
// here rather than as an empty card asking for euros it will never have.

/** The deal columns this card reads and writes, plus the row it writes them
 *  back to. Billing and deal type arrive as the plain strings the Client row
 *  carries; narrowing them is the model's job, not this card's. */
export type DealDetails = DealTerms & { id: string }

export function LeadDealCard({ client }: { client: DealDetails }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  // Held in state only so the barter box can appear the moment "Exchange of
  // services" is picked; posted through the hidden input below.
  const [dealType, setDealType] = useState<DealType>(
    client.dealType === "barter" ? "barter" : "cash"
  )

  // Every figure is mono — numbers are the brand's signature on every tier.
  const components = dealComponents(client)
  const facts: { label: string; value: string }[] = []
  for (const component of components) {
    switch (component.kind) {
      case "cash": {
        const amount = formatMoney(component.valueMinor, "eur")
        facts.push({
          label: "Value",
          value: component.billingType === "monthly" ? `${amount}/mo` : amount,
        })
        break
      }
      case "barter": {
        // A swap is a term whether or not anyone has put a figure on it, so the
        // row is always there and the amount only joins it once it exists.
        if (component.valueMinor > 0) {
          facts.push({
            label: "Value (in kind)",
            value: formatMoney(component.valueMinor, "eur"),
          })
        }
        facts.push({ label: "Paid in", value: "Exchange of services" })
        break
      }
      case "equity":
        facts.push({ label: "Equity", value: formatBps(component.bps) })
        break
      case "commission":
        facts.push({ label: "Commission", value: formatBps(component.bps) })
        break
    }
  }

  const barter = client.dealType === "barter" ? client.barterTerms : null

  return (
    <GroupedSection
      header="Deal"
      footer="Your own record of what was agreed — any combination of a fee, a swap, a stake and a cut. Stripe stays the authority on what was invoiced and paid."
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

      {components.length === 0 ? (
        <GroupedBlock>
          Nothing agreed yet. A deal is any of these — a fee, a swap, a stake in
          the company, a cut of their revenue — and one of them is enough.
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
              Fill in whatever this deal is made of — none of it is required,
              and any one of them is a deal. Stripe stays the authority on what
              was actually invoiced and paid, and an exchange of services counts
              separately as <em>in kind</em>.
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
              <AppField label="Value (€)" hint="Empty if there's no fee.">
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

            <AppField label="Paid in" hint="How to read the figure above.">
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
