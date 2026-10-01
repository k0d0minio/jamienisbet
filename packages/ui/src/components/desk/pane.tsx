import * as React from "react"

import { cn } from "../../lib/utils"

// DESK TIER — panes, not pages.
//
// Lists and readers sit side by side at the desk, each a flat pane divided
// from the next by a hairline — no card, no shadow, no inset slab. A pane is
// a column: its header, an optional toolbar, and a body that scrolls on its
// own so the header never leaves.
//
//   <Pane aria-label="Tickets">
//     <PaneHeader title="Tickets" meta="quinta-do-sol · 5" actions={…} />
//     <PaneToolbar>{filters}</PaneToolbar>
//     <PaneBody>{rows}</PaneBody>
//   </Pane>
//
// Requires "@jamie-nisbet/ui/desk.css".

function Pane({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="pane"
      className={cn(
        "flex min-h-0 min-w-0 flex-col border-desk-line bg-desk-surface not-last:border-r",
        className
      )}
      {...props}
    />
  )
}

type PaneHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** The pane's name, at the heading step. */
  title: React.ReactNode
  /** Which heading level the title is. */
  titleAs?: "h1" | "h2" | "h3"
  /** Mono metadata after the title: a slug, a count, a total. */
  meta?: React.ReactNode
  /** Trailing controls, pushed to the end. */
  actions?: React.ReactNode
}

function PaneHeader({
  title,
  titleAs: Title = "h2",
  meta,
  actions,
  className,
  children,
  ...props
}: PaneHeaderProps) {
  return (
    <header
      data-slot="pane-header"
      className={cn(
        "flex h-desk-pane-header shrink-0 items-center gap-4 border-b border-desk-line px-5",
        className
      )}
      {...props}
    >
      <Title className="min-w-0 truncate text-desk-heading font-bold text-desk-fg">
        {title}
      </Title>
      {meta != null && (
        <div className="min-w-0 truncate font-mono text-desk-meta text-desk-fg-2">
          {meta}
        </div>
      )}
      {children}
      {actions != null && (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}

function PaneToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pane-toolbar"
      className={cn(
        // A floor, not a height: under a thumb a segmented control's 44px
        // options sit in a padded track, and the strip grows to hold it.
        "flex min-h-desk-toolbar shrink-0 items-center gap-1 border-b border-desk-line px-5",
        className
      )}
      {...props}
    />
  )
}

// The body scrolls down, never sideways: every row in a pane truncates or
// wraps to its width, so anything wider is a bug to fix, not a reason to grow
// a horizontal scrollbar. `relative` makes it the containing block for what
// it holds — without it a screen-reader label (`sr-only` is absolute) deep in
// a long list is positioned against the page, escapes this scroll box, and
// stretches the whole window by the list's height.
function PaneBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pane-body"
      className={cn(
        "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

export { Pane, PaneBody, PaneHeader, PaneToolbar, type PaneHeaderProps }
