import Link from "next/link"
import { Archive, ArchiveRestore } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// Two controls that used to be one rail. `Chip` is the open-ended rail — one
// per repo on the tickets board, a set that grows with the estate — and stays
// as it was; the leads list's closed set of four filters became the app tier's
// `SegmentedControl` instead. `ArchiveChip` left the rail entirely, for the
// title bar.
//
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

// Switching to the archive is a change of view, not another filter, so it does
// not sit in the filter control at all: it is a bar button on the trailing edge
// of the screen's title bar, beside the app menu — where iOS puts a control
// that changes what a list *is* rather than which part of it you are looking
// at. Icon-only, the way a bar button is, tinted when the archive is what you
// are looking at.
//
// It rides the title bar's material, so it takes the vibrancy-safe label colour
// rather than the page's.
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
      title={archived ? "Show active leads" : "Show archived leads"}
      className={cn(
        // A 44px target on the bar, matching the app menu beside it.
        "flex size-app-touch shrink-0 items-center justify-center rounded-app-control",
        "transition-colors spring-press active:bg-app-press",
        archived ? "text-app-tint" : "text-material-label"
      )}
    >
      {archived ? (
        <ArchiveRestore className="size-5" aria-hidden />
      ) : (
        <Archive className="size-5" aria-hidden />
      )}
    </Link>
  )
}
