"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { IconButton, Spinner } from "@jamie-nisbet/ui"

import { refreshBoard } from "@/app/(app)/tickets/actions"

// The board's "is this current?" answer. Pull-to-refresh re-renders but the
// GitHub reads ride a 60-second cache; this button busts the cache first, so
// what comes back is main as of right now.
export function BoardRefresh() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onRefresh() {
    startTransition(async () => {
      await refreshBoard()
      router.refresh()
    })
  }

  return (
    <IconButton
      aria-label="Refresh the board from GitHub"
      onClick={onRefresh}
      disabled={pending}
    >
      {pending ? (
        <Spinner role={undefined} aria-label={undefined} aria-hidden="true" />
      ) : (
        <RefreshCw aria-hidden />
      )}
    </IconButton>
  )
}
