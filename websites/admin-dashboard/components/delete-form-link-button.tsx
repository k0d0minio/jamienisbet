"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

import { DeskButton } from "@jamie-nisbet/ui"

import { removeFormLink } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Deleting a link takes any answers on it with it, so this asks first — the same
// confirm-then-act shape as the lead's own danger zone.
export function DeleteFormLinkButton({
  id,
  clientId,
  answered,
}: {
  id: string
  clientId: string
  answered: boolean
}) {
  const [pending, startTransition] = useTransition()

  function onDelete() {
    const message = answered
      ? "Delete this form and the answers on it? This can't be undone."
      : "Delete this form link? Anyone holding the URL will get a dead end."
    if (!confirm(message)) return
    hapticTick()
    startTransition(() => removeFormLink(id, clientId))
  }

  return (
    <DeskButton
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={onDelete}
      className="text-desk-blocked hover:text-desk-blocked"
    >
      <Trash2 />
      Delete
    </DeskButton>
  )
}
