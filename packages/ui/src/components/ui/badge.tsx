import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// Brand: mono label, tight 5px corners, muted (never neon) status tints.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-2 py-0.5 font-mono text-2xs font-medium tracking-wide whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // Chips rendered as links press-deepen (BRAND.md): hover shifts,
        // :active lands on the deeper step so touch gets instant feedback.
        default:
          "bg-primary text-primary-foreground [a&]:hover:bg-primary-hover [a&]:active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground border-border [a&]:hover:bg-secondary/90 [a&]:active:bg-muted",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:active:bg-accent [a&]:active:text-accent-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        destructive: "bg-destructive-soft text-destructive",
        ghost:
          "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:active:bg-accent [a&]:active:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline [a&]:active:text-primary-active",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
