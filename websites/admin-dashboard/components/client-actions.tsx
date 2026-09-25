"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { archiveClient, removeClient } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

/** Archive (or restore) and delete, with the confirmation delete asks for —
 *  the handlers behind the profile's menu. */
export function useClientActions({
  id,
  archived,
  redirectOnDelete = null,
}: {
  id: string
  archived: boolean
  /** Where to go once the record is gone — the profile leaves a page that no
   *  longer exists. */
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
