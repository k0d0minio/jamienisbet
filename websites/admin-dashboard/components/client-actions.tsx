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
  // Two red rows for a grouped danger zone — the lead's own profile, where
  // these sit at the very bottom of the page in a group of their own.
  grouped = false,
  className,
}: {
  id: string
  archived: boolean
  redirectOnDelete?: boolean
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
      if (redirectOnDelete) router.push("/inbox")
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

  // The list row's pair. Icon-only — spelling out "Archive" and "Delete" gave
  // the rarest thing on a row the widest cell — and *always rendered*, never
  // revealed on hover: a control you can only find with a mouse is a control
  // half the surfaces here can't reach. Quiet at rest and full strength on
  // hover or focus, which is a different thing from hidden.
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
