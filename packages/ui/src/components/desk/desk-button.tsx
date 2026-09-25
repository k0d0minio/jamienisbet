import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Spinner } from "../ui/spinner"

// DESK TIER — the button.
//
// Built on the shared Button — its focus ring, its press scrim, its asChild —
// with the shared size and variant scales switched off (null) and the tier's
// own laid on top, so the marketing button is never touched.
//
//   primary    ink fill — the one primary act on a screen (Launch)
//   secondary  surface with a strong hairline (Copy prompt)
//   ghost      text only, a sunken wash on hover (GitHub ↗, filters)
//
//   sm 26px · md 30px (default) · icon 30px square · icon-sm 26px square
//
// Every size is 44px under a thumb through the tokens, not through a query
// here. `shortcut` sets the key hint inside the button, mono and quieter —
// "Launch ⌘↵". It is a picture of the keys, so it is hidden from assistive
// tech; the caller binds the key and declares it in the attribute's own
// spelling (aria-keyshortcuts="Meta+Enter"). Icon-only sizes need an
// aria-label.
//
// Requires "@jamie-nisbet/ui/desk.css".

const deskButtonVariants = cva(
  "rounded-desk-control border text-desk-ui font-semibold transition-colors duration-100 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        primary:
          "border-desk-ink bg-desk-ink text-desk-ink-fg hover:border-desk-ink-hover hover:bg-desk-ink-hover",
        secondary:
          "border-desk-line-strong bg-desk-surface text-desk-fg hover:bg-desk-hover",
        ghost:
          "border-transparent bg-transparent text-desk-fg-2 hover:bg-desk-sunken hover:text-desk-fg",
      },
      size: {
        sm: "h-desk-control-sm gap-1.5 px-2.5",
        md: "h-desk-control gap-1.5 px-3",
        icon: "size-desk-control",
        "icon-sm": "size-desk-control-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type DeskButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
> &
  VariantProps<typeof deskButtonVariants> & {
    /** Keys that trigger this button, shown inside it: ["⌘", "↵"]. */
    shortcut?: string[]
    /** Busy: disables the button and shows the rolling spinner. */
    loading?: boolean
  }

function DeskButton({
  variant,
  size,
  shortcut,
  loading = false,
  asChild = false,
  disabled,
  className,
  children,
  ...props
}: DeskButtonProps) {
  const classes = cn(deskButtonVariants({ variant, size }), className)

  // Under asChild the caller's element is the button; extra siblings would
  // break the Slot, so the shortcut and spinner are the caller's to render —
  // but the disabled and busy states still reach the element.
  if (asChild) {
    return (
      <Button
        asChild
        variant={null}
        size={null}
        data-slot="desk-button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {children}
      </Button>
    )
  }

  return (
    <Button
      variant={null}
      size={null}
      data-slot="desk-button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading && <Spinner aria-hidden className="size-3.5" />}
      {children}
      {shortcut && shortcut.length > 0 && (
        <span
          aria-hidden
          className="font-mono text-desk-micro font-normal opacity-70"
        >
          {shortcut.join("")}
        </span>
      )}
    </Button>
  )
}

export { DeskButton, deskButtonVariants, type DeskButtonProps }
