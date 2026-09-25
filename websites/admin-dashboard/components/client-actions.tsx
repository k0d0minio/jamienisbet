"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ArchiveRestore, Archive, Trash2 } from "lucide-react"

import { Button, cn } from "@jamie-nisbet/ui"

import { archiveClient, removeClient } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

/** Archive (or restore) and delete, with the confirmation delete asks for —
 *  one set of handlers for the list's two icons and the profile's menu. */
export function useClientActions({
  id,
  archived,
  redirectOnDelete = null,
}: {
  id: string
  archived: boolean
  /** Where to go once the record is gone — the profile leaves a page that no
   *  longer exists; the list stays where it is. */
  redirectOnDelete?: string | null
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onArchive() {
    startTransition(async () => {
      hapticTick()
      await archiveClient(id, !archived)
    })
  }

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    startTransition(async () => {
      hapticTick()
      await removeClient(id)
      if (redirectOnDelete) router.push(redirectOnDelete)
    })
  }

  return { pending, onArchive, onDelete }
}

export function ClientActions({
  id,
  archived,
  className,
}: {
  id: string
  archived: boolean
  className?: string
}) {
  const { pending, onArchive, onDelete } = useClientActions({ id, archived })
  const archiveLabel = archived ? "Restore" : "Archive"
  const ArchiveIcon = archived ? ArchiveRestore : Archive

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={archiveLabel}
        title={archiveLabel}
        disabled={pending}
        onClick={onArchive}
        className="rounded-app-control text-app-label-3 hover:bg-app-press hover:text-app-label focus-visible:text-app-label"
      >
        <ArchiveIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete lead"
        title="Delete lead"
        disabled={pending}
        onClick={onDelete}
        className="rounded-app-control text-destructive/70 hover:bg-app-press hover:text-destructive focus-visible:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )
}
