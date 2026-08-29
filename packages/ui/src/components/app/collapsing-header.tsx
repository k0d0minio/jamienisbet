"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

// APP TIER — the scroll-linked hand-off, on its own.
//
// Two screens want the same move for different mastheads: a list screen sets
// its name large (LargeTitleHeader), a profile screen sets a whole identity —
// avatar, name, the figure beside it (IdentityHeader). What they share is the
// mechanism, and it is the fiddly part: a compact material bar that takes over
// the moment the masthead clears it, and hands back when you scroll home.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <CollapsingHeader compactTitle="Ana Ferreira" leading={<Back />}
//     masthead={<h1>…</h1>}>
//     {/* still scrolls, but below the hand-off point */}
//     <ActionCircleRow>…</ActionCircleRow>
//   </CollapsingHeader>
//
// How it moves: the masthead is in ordinary flow, so it simply scrolls away
// under the sticky bar — no transform chases the scroll position, and nothing
// janks on a slow phone. The only animated parts are the material and the
// compact title, which cross-fade on the header spring at the moment the
// masthead clears the bar. A sentinel and an IntersectionObserver find that
// moment; there is no scroll listener.
//
// Reduced motion is handled below the component: the app tier collapses its
// durations to nothing and the brand's global reset flattens the transition,
// so the hand-off becomes an instant cut and still reads correctly.

const materialLevel = {
  thin: "material-thin",
  regular: "material-regular",
  thick: "material-thick",
} as const

type CollapsingHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** What the bar carries once it has taken over. Sentence case. */
  compactTitle: React.ReactNode
  /** Bar content on the leading edge: a back link, a cancel. */
  leading?: React.ReactNode
  /** Bar content on the trailing edge: the screen's one primary action. */
  trailing?: React.ReactNode
  material?: keyof typeof materialLevel
  /** The block that scrolls away — the large title, or the identity. */
  masthead: React.ReactNode
  /** The scrolling element, when the page is not what scrolls. */
  scrollRoot?: React.RefObject<HTMLElement | null>
  /** Told when the bar takes over — for a tab bar or an action that follows. */
  onCollapsedChange?: (collapsed: boolean) => void
}

function CollapsingHeader({
  compactTitle,
  leading,
  trailing,
  material = "regular",
  masthead,
  scrollRoot,
  onCollapsedChange,
  className,
  children,
  ...props
}: CollapsingHeaderProps) {
  const barRef = React.useRef<HTMLDivElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    const bar = barRef.current
    if (!sentinel || !bar) return
    if (typeof IntersectionObserver === "undefined") return

    let observer: IntersectionObserver | undefined

    // The bar's height is the whole trigger, and it changes: a safe-area
    // inset arrives after hydration, a rotation changes it again. Re-arm
    // the observer whenever it does rather than guessing 44px.
    function arm() {
      if (!sentinel || !bar) return
      observer?.disconnect()
      const barHeight = Math.round(bar.getBoundingClientRect().height)
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1]
          if (!entry) return
          // isIntersecting alone can't tell "scrolled above the bar" from
          // "still below the fold" — a short screen is off in both. Compare
          // against the (bar-inset) root edge and only collapse for above.
          const rootTop = entry.rootBounds?.top ?? barHeight
          setCollapsed(entry.boundingClientRect.bottom <= rootTop)
        },
        {
          root: scrollRoot?.current ?? null,
          rootMargin: `-${barHeight}px 0px 0px 0px`,
          threshold: 0,
        }
      )
      observer.observe(sentinel)
    }

    arm()

    const resize =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(arm)
    resize?.observe(bar)

    return () => {
      observer?.disconnect()
      resize?.disconnect()
    }
  }, [scrollRoot])

  // Read the callback through a ref, so a caller passing an inline arrow
  // doesn't re-fire the notification on every render it happens to cause.
  const notify = React.useRef(onCollapsedChange)
  notify.current = onCollapsedChange

  React.useEffect(() => {
    notify.current?.(collapsed)
  }, [collapsed])

  return (
    <>
      <header
        data-slot="collapsing-header"
        data-collapsed={collapsed}
        className={cn("sticky top-0 z-30", className)}
        {...props}
      >
        {/* The material is its own layer so it can fade rather than snap on;
            a backdrop-filter cannot be transitioned, but its opacity can.

            `invisible` rather than opacity alone, because a transparent
            backdrop-filter is not a free one: an element at opacity 0 is
            still painted, so the blur would run on every frame of every
            scroll — including the whole time before the bar has taken over.
            `visibility` interpolates discretely in the direction that keeps
            the fade: it turns visible the instant the hand-off starts, and
            waits for the end of the transition on the way back. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border-b border-material-hairline transition-[opacity,visibility] spring-header",
            materialLevel[material],
            collapsed
              ? "visible opacity-100 shadow-app-chrome"
              : "invisible opacity-0"
          )}
        />

        <div
          ref={barRef}
          data-slot="collapsing-header-bar"
          className="relative px-app-gutter"
          // The notch, and only the notch — a layout value would be a token.
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="relative flex min-h-app-bar items-center gap-1">
            {leading != null && (
              <div className="flex shrink-0 items-center gap-1">{leading}</div>
            )}

            {/* The bar's title is decoration: the <h1> in the masthead is the
                real heading, and reading both aloud would be a stutter. */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-1/2 block max-w-[60%] -translate-x-1/2 truncate text-center text-app-headline font-semibold text-material-label transition-[opacity,transform] spring-header",
                collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              )}
            >
              {compactTitle}
            </span>

            {trailing != null && (
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {trailing}
              </div>
            )}
          </div>
        </div>
      </header>

      {masthead}

      {/* Where the hand-off happens: the last pixel of the masthead. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {children}
    </>
  )
}

export { CollapsingHeader, type CollapsingHeaderProps }
