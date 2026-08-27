import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Brand-quiet loading placeholder: the sunken surface with a slow highlight
// sweep, static under prefers-reduced-motion (the `skeleton` utility in
// styles.css carries both). Shapes cover the recurring layouts on the tight
// brand radius scale; size with className where a shape must match real
// content. Skeletons are decorative — mark the region they stand in for with
// aria-busy rather than labelling each block.
const skeletonVariants = cva("skeleton", {
  variants: {
    shape: {
      /** Free-form block — bring your own dimensions. */
      block: "rounded-sm",
      /** A text line at body size. */
      line: "h-4 w-full rounded-xs",
      /** A list row (matches the admin's min-h-14 rows). */
      row: "h-14 w-full rounded-md",
      /** A resting card. */
      card: "h-40 w-full rounded-lg",
      /** A mono stat figure. */
      stat: "h-8 w-24 rounded-sm",
    },
  },
  defaultVariants: {
    shape: "block",
  },
})

function Skeleton({
  className,
  shape,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
