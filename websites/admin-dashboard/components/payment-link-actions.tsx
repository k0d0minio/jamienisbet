"use client"

import { useState, useTransition } from "react"
import { Ban, Copy, ExternalLink } from "lucide-react"

import {
  Badge,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"

import { deactivatePaymentLink } from "@/app/(app)/money/actions"
import { copyToClipboard } from "@/lib/clipboard"
import { hapticTick } from "@/lib/haptics"

// One payment link, read as a row and operated from a sheet — the same shape
// as an invoice row next door, because they are the same kind of thing: a
// standing request for money you occasionally do something to.
//
// A link that is switched on says nothing about it. Nearly all of them are,
// and a column of identical green "Active" pills is noise rather than news —
// so only the exception is marked, and the sheet carries the full state for
// anyone who came to check.
//
// The URL itself lives in the sheet rather than on the row: it is 60 characters
// of machine text that would crowd out the two things worth scanning, and what
// you actually want to do with it is copy it.

export type PaymentLinkView = {
  id: string
  url: string
  active: boolean
  /** What it charges for, already fallen back to a dash by the page. */
  product: string
  /** The amount, pre-formatted, or null when the price can't be resolved. */
  amount: string | null
}

export function PaymentLinkActions({ link }: { link: PaymentLinkView }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const { id, url, active, product, amount } = link

  function onDeactivate() {
    if (!confirm("Deactivate this link? It will stop accepting payments.")) return
    hapticTick()
    startTransition(async () => {
      try {
        await deactivatePaymentLink(id)
        setOpen(false)
        toast("Payment link deactivated")
      } catch {
        toast.error("Couldn't deactivate the link")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <GroupedRow
          label={product}
          // A live link says nothing about being live: nearly all of them are,
          // and a name and an amount is the whole of what a working link is.
          // Only the exception is marked.
          description={
            active ? undefined : (
              <span className="flex items-center gap-1.5">
                <Badge variant="secondary" className="shrink-0 rounded-full px-2">
                  Inactive
                </Badge>
                <span className="truncate">No longer accepting payments</span>
              </span>
            )
          }
          value={
            amount ? <span className="font-mono tabular-nums">{amount}</span> : "—"
          }
        />
      </SheetTrigger>

      {/* One short list of actions and the URL above it — the half sheet holds
          all of it, and the drag up is there for a link long enough to wrap. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>{product}</SheetTitle>
          <SheetDescription>
            {amount ? (
              <>
                <span className="font-mono">{amount}</span> ·{" "}
              </>
            ) : null}
            {active ? "accepting payments" : "deactivated"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <GroupedSection header="The link">
            {/* Machine text, so it sets in mono and is allowed to wrap — this
                is the one place the whole URL is meant to be legible. */}
            <GroupedBlock className="font-mono break-all">{url}</GroupedBlock>
          </GroupedSection>

          <GroupedSection>
            <GroupedRow
              icon={<Copy />}
              variant="tint"
              label="Copy the link"
              chevron={false}
              onClick={() => {
                void copyToClipboard(url, "Payment link")
              }}
            />
            <GroupedRow
              icon={<ExternalLink />}
              label="Open the pay page"
              href={url}
              target="_blank"
              rel="noreferrer"
              chevron={false}
            />
          </GroupedSection>

          {active ? (
            <GroupedSection footer="A link can't be deleted in Stripe, only switched off.">
              <GroupedRow
                icon={<Ban />}
                variant="destructive"
                label="Deactivate this link"
                chevron={false}
                disabled={pending}
                onClick={onDeactivate}
              />
            </GroupedSection>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
