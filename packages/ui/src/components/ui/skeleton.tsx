import * as React from "react"

import { cn } from "../../lib/utils"

// Layout-true placeholders for reads that leave the machine. The rule the
// shapes exist to enforce: a skeleton stands in for the thing that is coming,
// at its size and in its place, so the screen doesn't jump when the data lands.
// A lone spinner in the middle of an empty page is not a skeleton.
//
// Sunken surface, hairline radius, breathing rather than shimmering — and the
// breathing stops entirely under `prefers-reduced-motion` (see tokens/motion.css).
// Every shape is `aria-hidden`: the region it fills should carry the live status,
// not each grey box.

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("jn-pulse rounded-sm bg-muted", className)}
      {...props}
    />
  )
}

/** A paragraph's worth of lines. The last one runs short, the way real text does. */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  )
}

/** One list row: a title over a quieter second line, with a trailing figure. */
function SkeletonRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-h-14 items-center gap-3 px-4 py-3", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-14 shrink-0" />
    </div>
  )
}

/** A headline figure with its label above — the shape of a stat card. */
function SkeletonFigure({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

export { Skeleton, SkeletonFigure, SkeletonRow, SkeletonText }
