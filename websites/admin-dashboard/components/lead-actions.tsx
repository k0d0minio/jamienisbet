"use client"

import { useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import {
  archiveContact,
  archiveReferral,
  removeContact,
  removeReferral,
} from "@/app/(app)/leads/actions"

type Kind = "contact" | "referral"

const setArchived = (kind: Kind, id: string, archived: boolean) =>
  kind === "contact"
    ? archiveContact(id, archived)
    : archiveReferral(id, archived)

const remove = (kind: Kind, id: string) =>
  kind === "contact" ? removeContact(id) : removeReferral(id)

export function LeadActions({
  id,
  kind,
  archived,
}: {
  id: string
  kind: Kind
  archived: boolean
}) {
  const [pending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    startTransition(() => remove(kind, id))
  }

  return (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(() => setArchived(kind, id, !archived))
        }
      >
        {archived ? "Restore" : "Archive"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        Delete
      </Button>
    </div>
  )
}
