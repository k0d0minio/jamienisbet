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
      <Title className="shrink-0 truncate text-desk-heading font-bold text-desk-fg">
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
        "flex h-desk-toolbar shrink-0 items-center gap-1 border-b border-desk-line px-5",
        className
      )}
      {...props}
    />
  )
}

function PaneBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pane-body"
      className={cn("min-h-0 flex-1 overflow-auto", className)}
      {...props}
    />
  )
}

export { Pane, PaneBody, PaneHeader, PaneToolbar, type PaneHeaderProps }
