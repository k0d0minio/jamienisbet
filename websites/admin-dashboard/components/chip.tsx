import Link from "next/link"
import { Archive, ArchiveRestore, Snowflake } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// Three controls that used to be one rail. `Chip` is the open-ended rail — one
// per repo on the tickets board, a set that grows with the estate — and stays
// a rail, because a segmented control that scrolls has stopped being one; the
// leads list's closed set of four filters became the app tier's
// `SegmentedControl` instead. `ArchiveChip` and `ProspectsChip` left the rail
// entirely, for the title bar.
//
// Both are app-tier controls now: the board is the last screen either of them
// serves, and it reads in the same grouped-list idiom as the rest of the app.

// A view/filter chip in a horizontal rail. Sized for a finger rather than a
// cursor (the tier's 44px floor) and never wrapping — the rail scrolls sideways
// instead, so adding a repo can't push the board further down the screen.
//
// A button, not a link: the board filters the data it already holds and
// writes the choice to the URL itself (`useBoardParams`), so a tap is instant
// rather than a navigation that re-reads the estate.
//
// The selected chip is a slab that has lifted off the canvas — the same recipe
// the segmented control uses for its chosen segment, and the same reason:
// weight alone does not carry a selection in the light theme.
export function Chip({
  onClick,
  active,
  count,
  children,
}: {
  onClick: () => void
  active: boolean
  count?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-app-touch shrink-0 items-center gap-1.5 rounded-app-control px-3.5",
        "text-app-footnote whitespace-nowrap transition-colors spring-press",
        active
          ? "bg-app-group font-semibold text-app-label shadow-app-raised"
          : "font-medium text-app-label-2 active:bg-app-press"
      )}
    >
      {children}
      {count !== undefined ? (
        // A figure, so it sets in mono — on every tier.
        <span
          className={cn(
            "font-mono text-app-caption tabular-nums",
            active ? "text-app-label-2" : "text-app-label-3"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
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

// The cold pool, on the same bar and for the same reason as the archive: it is
// a change of what the list *is*, not of which part of it you are looking at.
//
// It could have been a fifth segment. It isn't, because prospects are a
// different population rather than a slice of this one — they are sorted on
// their fit tier instead of on who has waited longest, they carry none of the
// money the segments' glance row adds up, and nobody is waiting on any of them.
// Filing them under "All" would make the roster mostly strangers and the word
// "All" a promise the screen can't keep. So the four filters stay a clean
// partition of the relationships, the prospects get the same four-filter screen
// over their own population, and this is the switch between the two.
export function ProspectsChip({
  href,
  prospects,
}: {
  href: string
  /** The cold pool is what you are looking at. */
  prospects: boolean
}) {
  const label = prospects ? "Show leads and clients" : "Show prospects"
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={prospects ? "page" : undefined}
      title={label}
      className={cn(
        // A 44px target on the bar, matching the archive switch beside it.
        "flex size-app-touch shrink-0 items-center justify-center rounded-app-control",
        "transition-colors spring-press active:bg-app-press",
        // One icon either way — cold is cold, and swapping the glyph would
        // suggest two different destinations. The tint is what says you are
        // in it. It rides the bar's material, so at rest it takes the
        // vibrancy-safe label colour rather than the page's.
        prospects ? "text-app-tint" : "text-material-label"
      )}
    >
      <Snowflake className="size-5" aria-hidden />
    </Link>
  )
}
