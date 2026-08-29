"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

// APP TIER — the scroll-linked large title.
//
// The screen opens with its name set large in the content, the way a native
// app does: the title is part of what you are reading, not a bar bolted to
// the top. Scroll past it and it hands off — a compact material bar takes
// over, carrying the same name in a title-bar weight, so you never lose
// where you are.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <LargeTitleHeader
//     title="Leads"
//     subtitle="14 open, 3 gone quiet"
//     leading={<BackLink />}
//     trailing={<IconButton …/>}
//   />
//   <GroupedList>…</GroupedList>
//
// How it moves: the large title is in ordinary flow, so it simply scrolls
// away under the sticky bar — no transform chases the scroll position, and
// nothing janks on a slow phone. The only animated parts are the material
// and the compact title, which cross-fade on the header spring at the
// moment the large title clears the bar. A sentinel and an
// IntersectionObserver find that moment; there is no scroll listener.
//
// Reduced motion is handled below the component: the app tier collapses its
// durations to nothing and the brand's global reset flattens the transition,
// so the hand-off becomes an instant cut and still reads correctly.

const materialLevel = {
  thin: "material-thin",
  regular: "material-regular",
  thick: "material-thick",
} as const

function LargeTitleHeader({
  title,
  compactTitle,
  subtitle,
  leading,
  trailing,
  material = "regular",
  scrollRoot,
  onCollapsedChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  /** The screen's name. Sentence case, and the page's real `<h1>`. */
  title: React.ReactNode
  /** A shorter form for the compact bar, when the large title is too long. */
  compactTitle?: React.ReactNode
  /** One quiet line under the title — a count, a state, a date. */
  subtitle?: React.ReactNode
  /** Bar content on the leading edge: a back link, a cancel. */
  leading?: React.ReactNode
  /** Bar content on the trailing edge: the screen's one primary action. */
  trailing?: React.ReactNode
  material?: keyof typeof materialLevel
  /** The scrolling element, when the page is not what scrolls. */
  scrollRoot?: React.RefObject<HTMLElement | null>
  /** Told when the bar takes over — for a tab bar or an action that follows. */
  onCollapsedChange?: (collapsed: boolean) => void
}) {
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
        data-slot="large-title-header"
        data-collapsed={collapsed}
        className={cn("sticky top-0 z-30", className)}
        {...props}
      >
        {/* The material is its own layer so it can fade rather than snap on;
            a backdrop-filter cannot be transitioned, but its opacity can. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border-b border-material-hairline transition-opacity spring-header",
            materialLevel[material],
            collapsed ? "opacity-100 shadow-app-chrome" : "opacity-0"
          )}
        />

        <div
          ref={barRef}
          data-slot="large-title-bar"
          className="relative px-app-gutter"
          // The notch, and only the notch — a layout value would be a token.
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="relative flex min-h-app-bar items-center gap-1">
            {leading != null && (
              <div className="flex shrink-0 items-center gap-1">{leading}</div>
            )}

            {/* The bar's title is decoration: the <h1> below is the real
                heading, and reading both aloud would be a stutter. */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-1/2 block max-w-[60%] -translate-x-1/2 truncate text-center text-app-headline font-semibold text-material-label transition-[opacity,transform] spring-header",
                collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              )}
            >
              {compactTitle ?? title}
            </span>

            {trailing != null && (
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {trailing}
              </div>
            )}
          </div>
        </div>
      </header>

      <div data-slot="large-title" className="px-app-gutter pt-1 pb-3">
        <h1 className="text-app-large-title font-bold text-app-label">{title}</h1>
        {subtitle != null && (
          <p className="mt-1 text-app-subhead text-app-label-3">{subtitle}</p>
        )}
        {children}
      </div>

      {/* Where the hand-off happens: the last pixel of the large title. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
    </>
  )
}

export { LargeTitleHeader }
