import Link from "next/link"
import { Archive } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// The selected chip reads as a raised white card against the grey page, the
// same way every other surface here does. `bg-secondary` — which this used to
// use — resolves to the same value as the page background in the brand light
// theme, so a selected chip was distinguishable only by its font weight.
const ACTIVE = "border border-border bg-card font-medium text-foreground shadow-xs"
const IDLE = "text-muted-foreground hover:text-foreground active:bg-muted"

// A view/filter chip in a horizontal rail. Sized for a finger rather than a
// cursor (44px tall) and never wrapping — the rail scrolls sideways instead, so
// adding a filter can't push the list further down the screen.
export function Chip({
  href,
  active,
  count,
  children,
}: {
  href: string
  active: boolean
  count?: number
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-sm px-3.5 text-sm whitespace-nowrap transition-colors",
        active ? ACTIVE : IDLE
      )}
    >
      {children}
      {count !== undefined ? (
        <span className="text-xs tabular-nums opacity-70">{count}</span>
      ) : null}
    </Link>
  )
}

// Switching to the archive is a change of view, not another filter, so it sits
// beside the page title instead of in the filter rail — where, on a phone, it
// would be a chip you have to scroll sideways to discover. Icon-only where
// width is scarce; it picks up its label from `sm` up.
export function ArchiveChip({
  href,
  archived,
}: {
  href: string
  archived: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={archived ? "Show active leads" : "Show archived leads"}
      aria-current={archived ? "page" : undefined}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm px-3 text-sm whitespace-nowrap transition-colors",
        archived ? ACTIVE : IDLE
      )}
    >
      <Archive className="size-4" aria-hidden />
      <span className="hidden sm:inline">Archived</span>
    </Link>
  )
}
