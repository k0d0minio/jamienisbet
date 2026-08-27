"use client"

import * as React from "react"
import { Check, TriangleAlert } from "lucide-react"

import { cn } from "../../lib/utils"

// Quiet confirmation for things that happen off-screen or can't be seen from
// where you're standing: a row archived out of the list, an invoice raised, a
// link on the clipboard, an optimistic edit that the server then refused.
//
// Hand-rolled rather than wrapping sonner: what's needed here is a list, a
// timer, and a live region — a dependency for that would be larger than the
// thing itself, and it would arrive with its own animation vocabulary to
// re-theme.
//
// Dispatched through a document event rather than a React context, so `toast()`
// is callable from any client component without a provider having to sit above
// it — the same broadcast idiom the swipe rows already use for their
// one-open-at-a-time close.

const EVENT = "jn:toast"

export type ToastTone = "default" | "success" | "error"

export type ToastOptions = {
  tone?: ToastTone
  /** Milliseconds on screen. Errors default to longer — they're read, not glanced. */
  duration?: number
}

type ToastItem = ToastOptions & { id: number; message: string }

let nextId = 0

/** Show a toast. A no-op on the server, so it's safe to call from an action
 *  handler without guarding. Sentence case, no full stop — it's a line, not a
 *  paragraph. */
export function toast(message: string, options: ToastOptions = {}) {
  if (typeof document === "undefined") return
  document.dispatchEvent(
    new CustomEvent<ToastItem>(EVENT, {
      detail: { id: nextId++, message, ...options },
    })
  )
}

/** `toast(message, { tone: "error" })`, for the rollback path where that's the
 *  only thing being said. */
toast.error = (message: string, options: ToastOptions = {}) =>
  toast(message, { ...options, tone: "error" })

toast.success = (message: string, options: ToastOptions = {}) =>
  toast(message, { ...options, tone: "success" })

const DEFAULT_DURATION = 3200
const ERROR_DURATION = 5000

// Three at once is a list; more is a circus. The oldest drops off the back.
const MAX_VISIBLE = 3

const TONE_STYLES: Record<ToastTone, string> = {
  default: "",
  success: "text-success",
  error: "text-destructive",
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <Check className="size-4 shrink-0" aria-hidden />
  if (tone === "error") {
    return <TriangleAlert className="size-4 shrink-0" aria-hidden />
  }
  return null
}

/**
 * Mount once at the app root. Bottom-centre above the thumb on a phone, bottom
 * corner from `sm` up.
 *
 * `className` positions the stack: an app with a fixed bottom tab bar passes
 * its own offset so the toasts clear it (the admin's `bottom-above-tabs`).
 */
export function Toaster({ className }: { className?: string }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  // Timers are keyed by toast id so a dismissal can cancel exactly its own.
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  React.useEffect(() => {
    function onToast(event: Event) {
      const item = (event as CustomEvent<ToastItem>).detail
      setItems((current) => [...current, item].slice(-MAX_VISIBLE))

      const duration =
        item.duration ??
        (item.tone === "error" ? ERROR_DURATION : DEFAULT_DURATION)
      timers.current.set(
        item.id,
        setTimeout(() => dismiss(item.id), duration)
      )
    }

    document.addEventListener(EVENT, onToast)
    return () => {
      document.removeEventListener(EVENT, onToast)
    }
  }, [dismiss])

  // Clear every outstanding timer on unmount — separate from the listener
  // effect so re-running that one never cancels a toast mid-life.
  React.useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return (
    <div
      // `role="status"` (polite) rather than an alert: nothing here interrupts,
      // and the region has to exist before the first toast for the announcement
      // to land — so it renders empty rather than conditionally.
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50",
        "flex flex-col items-center gap-2 px-4",
        "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end sm:px-0",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          // Tapping dismisses early. It's the whole interaction — a toast with
          // a close button is a dialog that hasn't admitted it yet.
          onClick={() => dismiss(item.id)}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-sm border bg-card px-3 py-2.5 text-left text-sm shadow-md",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
            "transition-colors active:bg-muted sm:w-auto",
            TONE_STYLES[item.tone ?? "default"]
          )}
        >
          <ToastIcon tone={item.tone ?? "default"} />
          <span className="flex-1 text-card-foreground">{item.message}</span>
        </button>
      ))}
    </div>
  )
}
