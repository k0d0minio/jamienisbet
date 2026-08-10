"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { archiveClient, removeClient } from "@/app/(app)/actions"

export function ClientActions({
  id,
  archived,
  // When true (the detail page), a delete sends the user back to the list since
  // the record they're viewing no longer exists.
  redirectOnDelete = false,
}: {
  id: string
  archived: boolean
  redirectOnDelete?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    startTransition(async () => {
      await removeClient(id)
      if (redirectOnDelete) router.push("/")
    })
  }

  return (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(() => archiveClient(id, !archived))
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
