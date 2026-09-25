import Link from "next/link"
import { Archive, ArchiveRestore, Snowflake } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// The two switches on the phone leads list's title bar. Each changes what the
// list *is* rather than which part of it you are looking at, so neither sits
// in the filter control.

// Switching to the archive is a change of view, not another filter, so it does
// not sit in the filter control at all: it is a bar button on the trailing edge
// of the screen's title bar, beside the account menu — where iOS puts a control
// that changes what a list *is* rather than which part of it you are looking
// at. Icon-only, the way a bar button is, tinted when the archive is what you
// are looking at.
//
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
        // A 44px target on the bar, matching the account menu beside it.
        "flex size-desk-control shrink-0 items-center justify-center rounded-desk-control",
        "transition-colors duration-100 hover:bg-desk-hover active:bg-desk-sunken",
        archived ? "text-desk-ink" : "text-desk-fg"
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
// money the totals line adds up, and nobody is waiting on any of them.
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
        "flex size-desk-control shrink-0 items-center justify-center rounded-desk-control",
        "transition-colors duration-100 hover:bg-desk-hover active:bg-desk-sunken",
        // One icon either way — cold is cold, and swapping the glyph would
        // suggest two different destinations. The tint is what says you are
        // in it.
        prospects ? "text-desk-ink" : "text-desk-fg"
      )}
    >
      <Snowflake className="size-5" aria-hidden />
    </Link>
  )
}
