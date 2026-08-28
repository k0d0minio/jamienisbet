"use client"

import { useTransition } from "react"

import { Button, toast } from "@jamie-nisbet/ui"

import { cancelInvoice, sendInvoice } from "@/app/(app)/money/actions"
import { CopyButton } from "@/components/copy-button"

// Per-row invoice controls. A draft can be finalized+sent or discarded; a
// finalized invoice exposes its hosted link and can be voided. Sending is the
// deliberate outbound step, so it confirms before emailing the client.
export function InvoiceActions({
  id,
  isDraft,
  status,
  hostedInvoiceUrl,
}: {
  id: string
  isDraft: boolean
  status: string
  hostedInvoiceUrl: string | null
}) {
  const [pending, startTransition] = useTransition()
  const canCancel = isDraft || status === "open"

  // Each of these ends with the row re-rendering as something else, or gone —
  // the toast is what says which of the two happened, and whether the email
  // actually left.
  function onSend() {
    if (!confirm("Finalize this invoice and email it to the customer?")) return
    startTransition(async () => {
      try {
        await sendInvoice(id)
        toast.success(isDraft ? "Invoice finalized and sent" : "Invoice resent")
      } catch {
        toast.error("Couldn't send the invoice")
      }
    })
  }

  function onCancel() {
    const verb = isDraft ? "Delete this draft invoice?" : "Void this invoice? This can't be undone."
    if (!confirm(verb)) return
    startTransition(async () => {
      try {
        await cancelInvoice(id, isDraft)
        toast(isDraft ? "Draft deleted" : "Invoice voided")
      } catch {
        toast.error(isDraft ? "Couldn't delete the draft" : "Couldn't void the invoice")
      }
    })
  }

  return (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      {hostedInvoiceUrl ? (
        <CopyButton value={hostedInvoiceUrl} what="Invoice link" />
      ) : null}
      {isDraft || status === "open" ? (
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={pending}
          onClick={onSend}
        >
          {isDraft ? "Finalize & send" : "Resend"}
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onCancel}
          className="text-destructive hover:text-destructive"
        >
          {isDraft ? "Delete" : "Void"}
        </Button>
      ) : null}
    </div>
  )
}
