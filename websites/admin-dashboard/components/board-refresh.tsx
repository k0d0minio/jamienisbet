"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { Spinner, cn } from "@jamie-nisbet/ui"

import { refreshBoard } from "@/app/(app)/tickets/actions"

// The board's "is this current?" answer. Pull-to-refresh re-renders but the
// GitHub reads ride a 60-second cache; this button busts the cache first, so
// what comes back is main as of right now.
//
// It used to sit in a right-aligned strip under the header, which spent a whole
// row of the board on one icon. It is a bar button now — the trailing edge of
// the screen's own title bar, beside the app menu, where the archive switch
// sits on Leads. That means it rides the bar's material and takes the
// vibrancy-safe label colour rather than the page's.
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
    <button
      type="button"
      aria-label="Refresh the board from GitHub"
      title="Refresh the board from GitHub"
      onClick={onRefresh}
      disabled={pending}
      className={cn(
        // A 44px target on the bar, matching the app menu beside it.
        "flex size-app-touch shrink-0 items-center justify-center rounded-app-control",
        "text-material-label transition-colors spring-press active:bg-app-press",
        "disabled:pointer-events-none disabled:opacity-50"
      )}
    >
      {pending ? (
        <Spinner
          className="size-5"
          role={undefined}
          aria-label={undefined}
          aria-hidden="true"
        />
      ) : (
        <RefreshCw className="size-5" aria-hidden />
      )}
    </button>
  )
}
