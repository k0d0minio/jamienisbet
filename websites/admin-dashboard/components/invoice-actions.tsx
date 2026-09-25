"use client"

import { useState, useTransition } from "react"
import { Copy, ExternalLink, Send, Trash2 } from "lucide-react"

import {
  RecordRow,
  RecordSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { cancelInvoice, sendInvoice } from "@/app/(app)/money/actions"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { copyToClipboard } from "@/lib/clipboard"
import { hapticTick } from "@/lib/haptics"
import { invoiceStateLabel, type InvoiceState } from "@/lib/invoice-state"

// One invoice, as a row you can read at a glance and a sheet you open to act.
//
// It used to be a row with three buttons wedged into it — Copy, Finalize &
// send, Delete — repeated down a table, so the eye met a wall of controls
// before it met a single figure. Now the row carries only what you scan for
// (who, how much, where it stands) and the four things you can do to it live
// in an action sheet behind it, which is where a native list puts them.
//
// Nothing about the money changed: the same two server actions, the same
// confirm before anything leaves for a customer. If anything the send is more
// deliberate than it was — it is now a tap to open, a tap to choose, and the
// confirm — which is the direction the estate's "no outbound action without
// review" rule points in.

/** Everything the row shows and the sheet repeats, formatted by the server
 *  page. No figure is computed here — amounts come from Stripe, via the page. */
export type InvoiceView = {
  id: string
  /** A draft is deleted; a finalized invoice can only be voided. */
  isDraft: boolean
  state: InvoiceState
  /** Who it is addressed to, already fallen back to the number or a dash. */
  who: string
  /** What the row shows, pre-formatted — it sets in mono. What is still owed
   *  while anything is owed; what the invoice was for once it is settled, so a
   *  paid invoice reads as its own value rather than as €0.00. */
  amount: string
  /** The invoice total, when it differs from the figure on the row — a paid or
   *  part-paid invoice. Null when the two are the same. */
  total: string | null
  number: string | null
  created: string
  due: string | null
  email: string | null
  hostedInvoiceUrl: string | null
}

export function InvoiceActions({ invoice }: { invoice: InvoiceView }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const { id, isDraft, state, who, amount, hostedInvoiceUrl } = invoice
  const canSend = isDraft || state === "open" || state === "overdue"
  const canCancel = canSend

  // Each of these ends with this row being something else, or gone. The sheet
  // closes on the way out and the toast says which of the two happened — the
  // row it was opened from may not be there to look at any more.
  function onSend() {
    if (!confirm("Finalize this invoice and email it to the customer?")) return
    hapticTick()
    startTransition(async () => {
      try {
        await sendInvoice(id)
        setOpen(false)
        toast.success(isDraft ? "Invoice finalized and sent" : "Invoice resent")
      } catch {
        toast.error("Couldn't send the invoice")
      }
    })
  }

  function onCancel() {
    const question = isDraft
      ? "Delete this draft invoice?"
      : "Void this invoice? This can't be undone."
    if (!confirm(question)) return
    hapticTick()
    startTransition(async () => {
      try {
        await cancelInvoice(id, isDraft)
        setOpen(false)
        toast(isDraft ? "Draft deleted" : "Invoice voided")
      } catch {
        toast.error(
          isDraft ? "Couldn't delete the draft" : "Couldn't void the invoice"
        )
      }
    })
  }

  // The second line of the row: the state as a tint, then the clock. A draft
  // has no number and no due date, so it says when it was raised — which is
  // the only thing about a draft that ages.

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <RecordRow
          label={who}
          description={
            <span className="flex items-center gap-1.5">
              <InvoiceStatusBadge state={state} />
              {/* A machine identifier, so it sets in mono — and it waits for
                  the width to hold it. On a phone the 250px of second line
                  goes to the clock, which is what you are scanning for; the
                  number is one tap away in the sheet, and back on the row as
                  soon as there is room. */}
              {invoice.number ? (
                <span className="hidden shrink-0 font-mono sm:inline">
                  {invoice.number} ·
                </span>
              ) : null}
              <span className="truncate">
                {invoice.due ? `due ${invoice.due}` : `raised ${invoice.created}`}
              </span>
            </span>
          }
          value={
            <span
              className={cn(
                "font-mono tabular-nums",
                // Late money is the one figure on this screen that is a
                // problem rather than a fact, so it is the one that is tinted.
                state === "overdue" && "font-medium text-destructive"
              )}
            >
              {amount}
            </span>
          }
        />
      </SheetTrigger>

      {/* Two detents: the actions alone fit the half sheet with the list still
          visible behind, and a drag up brings the whole record into view. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>{who}</SheetTitle>
          <SheetDescription>
            <span className="font-mono">{amount}</span> ·{" "}
            {invoiceStateLabel(state).toLowerCase()}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* The record itself — everything the retired desktop table had a
              column for, read-only, where reading it belongs. */}
          <RecordSection>
            <RecordRow
              label="Number"
              chevron={false}
              value={
                invoice.number ? (
                  <span className="font-mono">{invoice.number}</span>
                ) : (
                  "Not yet issued"
                )
              }
            />
            {/* Only when it differs from the figure on the row — an invoice
                whose total and outstanding are the same number does not need
                to say it twice. */}
            {invoice.total ? (
              <RecordRow
                label="Total"
                chevron={false}
                value={<span className="font-mono">{invoice.total}</span>}
              />
            ) : null}
            <RecordRow
              label="Created"
              chevron={false}
              value={<span className="font-mono">{invoice.created}</span>}
            />
            {invoice.due ? (
              <RecordRow
                label="Due"
                chevron={false}
                value={
                  <span
                    className={cn(
                      "font-mono",
                      state === "overdue" && "font-medium text-destructive"
                    )}
                  >
                    {invoice.due}
                  </span>
                }
              />
            ) : null}
            {invoice.email ? (
              <RecordRow
                label="Email"
                chevron={false}
                value={invoice.email}
              />
            ) : null}
          </RecordSection>

          {/* What you can do with it. The send is tinted because it is the
              affirmative action of this sheet; it is also the only one that
              reaches a customer, so it says so under its own label. */}
          <RecordSection
            footer={
              canSend
                ? "Nothing leaves for the customer until you confirm."
                : undefined
            }
          >
            {hostedInvoiceUrl ? (
              <RecordRow
                icon={<ExternalLink />}
                label="Open the hosted invoice"
                href={hostedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                chevron={false}
              />
            ) : null}
            {hostedInvoiceUrl ? (
              <RecordRow
                icon={<Copy />}
                label="Copy the link"
                chevron={false}
                onClick={() => {
                  void copyToClipboard(hostedInvoiceUrl, "Invoice link")
                }}
              />
            ) : null}
            {canSend ? (
              <RecordRow
                icon={<Send />}
                variant="tint"
                label={isDraft ? "Finalize and send" : "Resend"}
                description={
                  isDraft
                    ? "Issues the invoice and emails it"
                    : "Emails the same invoice again"
                }
                chevron={false}
                disabled={pending}
                onClick={onSend}
              />
            ) : null}
            {/* A paid or voided invoice has nothing left to do to it — say so
                rather than leaving an empty slab. */}
            {!canSend && !hostedInvoiceUrl ? (
              <RecordRow
                label="Nothing left to do"
                description="This invoice is settled."
                chevron={false}
              />
            ) : null}
          </RecordSection>

          {/* The one that can't be taken back keeps its own group, the way a
              native sheet separates it. */}
          {canCancel ? (
            <RecordSection>
              <RecordRow
                icon={<Trash2 />}
                variant="destructive"
                label={isDraft ? "Delete this draft" : "Void this invoice"}
                chevron={false}
                disabled={pending}
                onClick={onCancel}
              />
            </RecordSection>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
