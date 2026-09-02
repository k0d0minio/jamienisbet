import * as React from "react"

import { cn } from "../../lib/utils"

// APP TIER — the identity disc.
//
// A person on an operating screen needs a face, and there are no photographs
// in this estate: what stands in is their initials, set in the brand's mono on
// a neutral disc. Neutral rather than tinted on purpose — ink is the tint for
// things you can press, and an avatar is not one of them.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <Monogram name="Ana Ferreira" size="lg" />   →  AF

const sizes = {
  sm: "size-8 text-app-caption",
  md: "size-11 text-app-subhead",
  lg: "size-16 text-app-title-3",
} as const

/** First letters of the first and last words — "Ana Ferreira" → "AF", "keel"
 *  → "K". Anything with no letters at all falls back to a dash rather than an
 *  empty disc. */
function initialsOf(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
  if (words.length === 0) return "—"
  const first = words[0]!.charAt(0)
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : ""
  return (first + last).toUpperCase()
}

function Monogram({
  name,
  size = "md",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  /** Whose disc this is. The initials are derived; the name is the label. */
  name: string
  size?: keyof typeof sizes
}) {
  return (
    <span
      data-slot="monogram"
      // Decorative: the name it stands for is always set beside it, and
      // reading both aloud would be a stutter.
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-app-press font-mono font-medium text-app-label-2 select-none",
        sizes[size],
        className
      )}
      {...props}
    >
      {initialsOf(name)}
    </span>
  )
}

export { Monogram }
