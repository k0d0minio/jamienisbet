"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ArchiveRestore, Archive, Trash2 } from "lucide-react"

import { Button, cn } from "@jamie-nisbet/ui"

import { archiveClient, removeClient } from "@/app/(app)/actions"

export function ClientActions({
  id,
  archived,
  // When true (the detail page), a delete sends the user back to the list since
  // the record they're viewing no longer exists.
  redirectOnDelete = false,
  // Icon-only, for a row in the phone list where there is no width for labels.
  // The buttons keep their accessible names via aria-label.
  compact = false,
  className,
}: {
  id: string
  archived: boolean
  redirectOnDelete?: boolean
  compact?: boolean
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const archiveLabel = archived ? "Restore" : "Archive"
  const ArchiveIcon = archived ? ArchiveRestore : Archive

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    startTransition(async () => {
      await removeClient(id)
      if (redirectOnDelete) router.push("/")
    })
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={archiveLabel}
          disabled={pending}
          onClick={() => startTransition(() => archiveClient(id, !archived))}
        >
          <ArchiveIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete lead"
          disabled={pending}
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex justify-end gap-1 whitespace-nowrap", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => archiveClient(id, !archived))}
      >
        <ArchiveIcon />
        {archiveLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
        Delete
      </Button>
    </div>
  )
}
