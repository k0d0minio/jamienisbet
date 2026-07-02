"use client"

import { useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { cancelInvoice, sendInvoice } from "@/app/(app)/invoices/actions"
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

  function onSend() {
    if (!confirm("Finalize this invoice and email it to the customer?")) return
    startTransition(() => sendInvoice(id))
  }

  function onCancel() {
    const verb = isDraft ? "Delete this draft invoice?" : "Void this invoice? This can't be undone."
    if (!confirm(verb)) return
    startTransition(() => cancelInvoice(id, isDraft))
  }

  return (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      {hostedInvoiceUrl ? <CopyButton value={hostedInvoiceUrl} /> : null}
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
