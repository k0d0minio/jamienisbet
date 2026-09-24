"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { LogoLoader, cn } from "@jamie-nisbet/ui"

import { refreshBoard, refreshBoardPosition } from "@/app/(app)/tickets/actions"

/** How long the app has to have been out of sight before coming back to it
 *  re-reads the board. Under it, a glance away is not worth a request. */
const RETURN_AFTER_MS = 5 * 60 * 1000

/** The board's `r` key asks the button to refresh through this, rather than
 *  running a refresh of its own: one refresh, one pending state, whether it
 *  was tapped or typed. The button lives in the title bar, outside the board,
 *  so an event is the shortest way across — the same idiom the swipe rows use
 *  to close one another. */
const REFRESH_EVENT = "jn:board-refresh"

/** Refresh the board exactly as its title-bar button does. Ignored while a
 *  refresh is already running. */
export function requestBoardRefresh() {
  window.dispatchEvent(new Event(REFRESH_EVENT))
}

// Europe/Lisbon, the operator's clock, pinned so the server's render and the
// browser's agree on the stamp whatever the device's own zone is.
const asOfFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Lisbon",
})

// The board's "is this current?" answer, in two parts: how old the board on
// screen is, and the control that makes it current.
//
// The button busts the cache first, so what comes back is main as of right
// now. The board is read once and every interaction after that is local, so
// this is the only way new data arrives — the tap, or the quiet version of it
// when the app comes back into view after five minutes or more away, which
// re-reads "what moved" (refreshBoardPosition) without asking. Both run in a
// transition, so the board stays on screen under them — never the loading
// skeleton — and whatever is open stays open; the quiet one shows no spinner.
//
// It is a bar button — the trailing edge of the screen's own title bar, beside
// the app menu, where the archive switch sits on Leads — with the stamp set
// small in front of it. That means both ride the bar's material and take the
// vibrancy-safe label colours rather than the page's.
export function BoardRefresh({
  readAt,
}: {
  /** When the board on screen was read, ISO. Absent on the loading skeleton,
   *  which has nothing to date yet. */
  readAt?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [, startQuietTransition] = useTransition()

  function onRefresh() {
    startTransition(async () => {
      await refreshBoard()
      router.refresh()
    })
  }

  // The keyboard's way in (requestBoardRefresh). Read through refs so the
  // listener, attached once, sees the refresh and its pending state as they
  // are now.
  const latest = useRef({ pending, onRefresh })
  useEffect(() => {
    latest.current = { pending, onRefresh }
  })
  useEffect(() => {
    // The skeleton has no board to refresh.
    if (!readAt) return
    function onRequest() {
      if (!latest.current.pending) latest.current.onRefresh()
    }
    window.addEventListener(REFRESH_EVENT, onRequest)
    return () => window.removeEventListener(REFRESH_EVENT, onRequest)
  }, [readAt])

  useEffect(() => {
    // The skeleton has no board to keep current.
    if (!readAt) return
    let hiddenAt: number | null =
      document.visibilityState === "hidden" ? Date.now() : null

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now()
        return
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt
      hiddenAt = null
      if (away < RETURN_AFTER_MS) return
      startQuietTransition(async () => {
        // Unasked-for, so it fails quietly: a phone back from a pocket may
        // not have its network yet, and an error thrown here would reach the
        // route's error boundary and replace the board you came back to. The
        // board and its "as of" stay put; the button is one tap away.
        try {
          await refreshBoardPosition()
          router.refresh()
        } catch {
          // Nothing to do — see above.
        }
      })
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [router, readAt])

  const asOf = readAt ? asOfFormat.format(new Date(readAt)) : null

  return (
    <div className="flex items-center">
      {/* A time, so it sets in mono. */}
      {readAt ? (
        <time
          dateTime={readAt}
          className="font-mono text-app-caption-2 tabular-nums whitespace-nowrap text-material-label-2"
        >
          as of {asOf}
        </time>
      ) : null}
      <button
        type="button"
        aria-label={
          asOf
            ? `Refresh the board from GitHub — showing it as of ${asOf}`
            : "Refresh the board from GitHub"
        }
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
          <LogoLoader
            className="size-5"
            role={undefined}
            aria-label={undefined}
            aria-hidden="true"
          />
        ) : (
          <RefreshCw className="size-5" aria-hidden />
        )}
      </button>
    </div>
  )
}
