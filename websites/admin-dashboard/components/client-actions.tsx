"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ArchiveRestore, Archive, Trash2 } from "lucide-react"

import { Button, GroupedRow, cn } from "@jamie-nisbet/ui"

import { archiveClient, removeClient } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

export function ClientActions({
  id,
  archived,
  // When true (the detail page), a delete sends the user back to the list since
  // the record they're viewing no longer exists.
  redirectOnDelete = false,
  // Icon-only, for a row in either list — the phone one has no width for
  // labels, and on the desktop table a spelled-out "Archive"/"Delete" gave the
  // rarest column the widest cell. The buttons keep their accessible names via
  // aria-label.
  compact = false,
  // Two red rows for a grouped danger zone — the lead's own profile, where
  // these sit at the very bottom of the page in a group of their own.
  grouped = false,
  className,
}: {
  id: string
  archived: boolean
  redirectOnDelete?: boolean
  compact?: boolean
  grouped?: boolean
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const archiveLabel = archived ? "Restore" : "Archive"
  const ArchiveIcon = archived ? ArchiveRestore : Archive

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
      if (redirectOnDelete) router.push("/")
    })
  }

  if (grouped) {
    return (
      <>
        <GroupedRow
          icon={<ArchiveIcon />}
          label={archived ? "Restore this lead" : "Archive this lead"}
          variant="destructive"
          chevron={false}
          disabled={pending}
          onClick={onArchive}
        />
        <GroupedRow
          icon={<Trash2 />}
          label="Delete this lead"
          variant="destructive"
          chevron={false}
          disabled={pending}
          onClick={onDelete}
        />
      </>
    )
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
          onClick={onArchive}
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
        onClick={onArchive}
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
