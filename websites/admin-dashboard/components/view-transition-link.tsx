"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

// List → lead profile and back, animated with the platform's own View
// Transitions API. Next doesn't wrap App Router navigations in one, so the link
// does it here: capture the page, push the route, and let the CSS in globals.css
// cross-fade the two snapshots.
//
// Everything about it degrades to the plain <Link> it wraps — no
// `startViewTransition` (Safari before 18, Firefox), reduced motion, a
// modified click, or a navigation that never lands. The API is the whole
// mechanism; there is no JavaScript fallback animation, by design.

type TransitionCallback = () => void | Promise<void>

// Declared structurally rather than leaning on lib.dom, which only grew
// `startViewTransition` recently — this compiles the same either way.
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: TransitionCallback) => unknown
}

/** The platform's transition runner, or nothing at all — which is the whole
 *  fallback: no runner, no interception, plain <Link> navigation. */
function viewTransitionRunner():
  | ((callback: TransitionCallback) => void)
  | undefined {
  if (typeof document === "undefined") return undefined
  const doc: ViewTransitionDocument = document
  const run = doc.startViewTransition
  if (typeof run !== "function") return undefined
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return undefined
  }
  return (callback) => {
    run.call(doc, callback)
  }
}

// The transition holds a frozen screenshot over the page until the navigation
// commits. If it never does — a slow read, a route that suspends past what's
// worth waiting for — this releases it rather than leaving the app looking hung.
const MAX_FREEZE_MS = 500

// Anchor props rather than `ComponentProps<typeof Link>`: Next's Link is
// generic over its route type, and deriving from it here drags that inference
// into every call site for no gain — this wrapper only ever takes a plain href.
type ViewTransitionLinkProps = Omit<React.ComponentProps<"a">, "href"> & {
  href: string
}

export function ViewTransitionLink({
  href,
  children,
  onClick,
  ...props
}: ViewTransitionLinkProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const settle = React.useRef<(() => void) | null>(null)

  // The navigation is done when the transition React kicked off stops pending;
  // resolving here is what tells the browser it may swap the snapshots.
  React.useEffect(() => {
    if (!pending && settle.current) {
      settle.current()
      settle.current = null
    }
  }, [pending])

  React.useEffect(() => () => settle.current?.(), [])

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented) return
    // A middle click, or one with a modifier, is "open this somewhere else" —
    // never ours to intercept.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    const start = viewTransitionRunner()
    if (!start) return // Plain <Link> navigation — a hard cut, as before.

    event.preventDefault()
    // The browser holds a frozen snapshot until this promise resolves, and the
    // effect above resolves it once the new page has actually committed — so
    // the two screens are only ever cross-faded against real content.
    start(
      () =>
        new Promise<void>((resolve) => {
          let timer: ReturnType<typeof setTimeout> | undefined
          let done = false
          const finish = () => {
            if (done) return
            done = true
            clearTimeout(timer)
            resolve()
          }
          timer = setTimeout(finish, MAX_FREEZE_MS)
          settle.current = finish
          startTransition(() => router.push(href))
        })
    )
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}
