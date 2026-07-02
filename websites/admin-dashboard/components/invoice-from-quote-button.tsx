"use client"

import { useState, useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { createDraftInvoiceFromQuoteAction } from "@/app/(app)/deals/actions"

export function InvoiceFromQuoteButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Create a Stripe DRAFT invoice for this deal's value? It is not sent — you finalize and send it from Invoices."
            )
          )
            return
          startTransition(async () => {
            try {
              await createDraftInvoiceFromQuoteAction(dealId)
              setResult("Draft invoice created — review and send it from Invoices.")
            } catch (err) {
              setResult(
                err instanceof Error ? err.message : "Could not create the invoice."
              )
            }
          })
        }}
      >
        {pending ? "Creating…" : "Create draft invoice"}
      </Button>
      {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
    </div>
  )
}
