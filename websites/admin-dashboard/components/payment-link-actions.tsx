"use client"

import { useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { deactivatePaymentLink } from "@/app/(app)/payment-links/actions"
import { CopyButton } from "@/components/copy-button"

// Per-row payment-link controls: copy the URL, or deactivate it (links can't be
// deleted in Stripe, only switched off).
export function PaymentLinkActions({
  id,
  url,
  active,
}: {
  id: string
  url: string
  active: boolean
}) {
  const [pending, startTransition] = useTransition()

  function onDeactivate() {
    if (!confirm("Deactivate this link? It will stop accepting payments.")) return
    startTransition(() => deactivatePaymentLink(id))
  }

  return (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      <CopyButton value={url} />
      {active ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onDeactivate}
          className="text-destructive hover:text-destructive"
        >
          Deactivate
        </Button>
      ) : null}
    </div>
  )
}
