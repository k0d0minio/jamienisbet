"use client"

import * as React from "react"
import { Check, CircleAlert } from "lucide-react"

import { cn } from "../../lib/utils"

// Quiet confirmation for actions that resolve off-screen (server actions,
// background saves). Hand-rolled rather than a dependency — one module store,
// one viewport, no stacking circus: at most three visible, newest at the
// bottom, each auto-dismissing. Copy is sentence case and one short line.
//
// Usage: mount <Toaster /> once in the app root layout, then call
//   toast("Saved")
//   toast.success("Invoice sent", { description: "INV-0042 · €1,200" })
//   toast.error("Couldn't save")
// Phones get it bottom-centre; set `--toaster-offset` (e.g. the tab bar
// height) on the app root to keep it above fixed chrome. Desktop (sm+) gets
// the bottom-right corner. Tapping a toast dismisses it early.

type ToastVariant = "default" | "success" | "error"

type ToastOptions = {
  /** A second, muted line under the message. */
  description?: string
  /** Milliseconds before auto-dismiss. */
  duration?: number
}

type ToastItem = {
  id: number
  message: string
  description?: string
  variant: ToastVariant
  duration: number
  /** false while animating out; removed once the exit transition has run. */
  open: boolean
}

const VISIBLE_MAX = 3
const DEFAULT_DURATION = 4000
// Cleanup delay, not an animation: just past --duration-slow (260ms) so the
// exit transition has finished before the node is removed.
const EXIT_MS = 300

let nextId = 0
let toasts: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function push(message: string, variant: ToastVariant, options: ToastOptions = {}) {
  const id = ++nextId
  // Cap the stack by dropping the oldest outright — no queueing theatre.
  toasts = [
    ...toasts.slice(-(VISIBLE_MAX - 1)),
    {
      id,
      message,
      variant,
      open: true,
      duration: options.duration ?? DEFAULT_DURATION,
      description: options.description,
    },
  ]
  emit()
  return id
}

function dismiss(id?: number) {
  if (typeof window === "undefined") return
  if (!toasts.some((t) => t.open && (id === undefined || t.id === id))) return
  toasts = toasts.map((t) =>
    id === undefined || t.id === id ? { ...t, open: false } : t
  )
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.open)
    emit()
  }, EXIT_MS)
}

/** Show a toast. Returns an id `toast.dismiss(id)` accepts. */
function toast(message: string, options?: ToastOptions) {
  return push(message, "default", options)
}
toast.success = (message: string, options?: ToastOptions) =>
  push(message, "success", options)
toast.error = (message: string, options?: ToastOptions) =>
  push(message, "error", options)
/** Dismiss one toast by id, or every toast with no argument. */
toast.dismiss = dismiss

function useToasts() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => toasts,
    () => toasts
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  React.useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), item.duration)
    return () => window.clearTimeout(timer)
  }, [item.id, item.duration])

  const Icon =
    item.variant === "success" ? Check : item.variant === "error" ? CircleAlert : null

  return (
    <div
      // Errors interrupt politely-but-now; confirmations wait their turn.
      role={item.variant === "error" ? "alert" : "status"}
      data-state={item.open ? "open" : "closed"}
      onClick={() => dismiss(item.id)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg",
        // Fade + 2px rise on the brand clock; instant under reduced motion.
        "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) motion-reduce:transition-none",
        "starting:translate-y-0.5 starting:opacity-0",
        "data-[state=closed]:translate-y-0.5 data-[state=closed]:opacity-0"
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            item.variant === "success" ? "text-success" : "text-destructive"
          )}
        />
      ) : null}
      <div className="grid gap-0.5">
        <p className="font-medium">{item.message}</p>
        {item.description ? (
          <p className="text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
    </div>
  )
}

function Toaster({ className, ...props }: React.ComponentProps<"section">) {
  const items = useToasts()

  return (
    <section
      data-slot="toaster"
      aria-label="Notifications"
      className={cn(
        // Bottom-centre on phones, riding above the safe area and whatever
        // fixed chrome the app declares via --toaster-offset; bottom-right
        // corner from sm up. The viewport never intercepts taps — the cards do.
        "pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4",
        "bottom-[calc(--spacing(4)+env(safe-area-inset-bottom,0px)+var(--toaster-offset,0px))]",
        "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end sm:px-0",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </section>
  )
}

export { Toaster, toast }
export type { ToastOptions, ToastVariant }
