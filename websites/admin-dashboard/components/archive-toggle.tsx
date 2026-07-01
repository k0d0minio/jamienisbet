import Link from "next/link"

import { cn } from "@jamie-nisbet/ui"

// Two-state view switch: active leads vs. the archive. Uses the ?archived query
// param so the current view is shareable/bookmarkable.
export function ArchiveToggle({
  basePath,
  archived,
}: {
  basePath: string
  archived: boolean
}) {
  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm",
        active
          ? "bg-secondary text-secondary-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )

  return (
    <div className="flex items-center gap-1">
      {tab(basePath, "Active", !archived)}
      {tab(`${basePath}?archived=1`, "Archived", archived)}
    </div>
  )
}
