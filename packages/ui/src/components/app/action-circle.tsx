import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — the circular action row.
//
// The Contacts idiom: the two or five things you actually came to do, as
// tinted discs directly under the identity, each with a word under it. It is
// the app tier's answer to a rail of outline buttons — same actions, but
// scannable by shape and colour rather than read left to right, and reachable
// without aiming.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <ActionCircleRow>
//     <ActionCircle icon={<Phone />} label="Call" href="tel:+351…" />
//     <ActionCircle icon={<Mail />} label="Email" disabled />
//     <ActionCircle icon={<Hammer />} label="Working" on onClick={…} />
//   </ActionCircleRow>
//
// An action the record can't support is **disabled, not hidden** — a lead with
// no phone number should read as "no number on file", not as an app with one
// fewer button. The row's shape is the same for everyone, so the position of
// an action is learnable.

function ActionCircleRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="action-circle-row"
      // Columns of equal width so the discs sit on a rhythm and the labels
      // centre under them. Capped, because five actions spread across a
      // desktop column would be a row of lonely dots.
      className={cn(
        "flex max-w-sm items-start gap-1 px-app-gutter pb-4",
        className
      )}
      {...props}
    />
  )
}

type ActionCircleProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "type"
> & {
  /** The glyph — a Lucide icon. Sized by the disc. */
  icon: React.ReactNode
  /** One word under it, sentence case. Wraps rather than truncates. */
  label: React.ReactNode
  /** Renders an anchor. Ignored when `disabled`, which needs a real button. */
  href?: string
  target?: string
  rel?: string
  /** The action is currently on — a toggle that has been flipped. */
  on?: boolean
  /** Hand the disc's element to a child — a Next `<Link>`, most often. */
  asChild?: boolean
}

function ActionCircle({
  icon,
  label,
  href,
  target,
  rel,
  on = false,
  asChild = false,
  disabled = false,
  className,
  children,
  ...props
}: ActionCircleProps) {
  // A disabled anchor is still a link — only a button can actually refuse the
  // tap, so an action with nothing to open becomes one. `target`/`rel` go with
  // the href and are dropped along with it.
  const isLink = href != null && !disabled
  const element = isLink ? "a" : "button"
  const Comp = (asChild ? Slot.Root : element) as React.ElementType

  return (
    <Comp
      data-slot="action-circle"
      data-on={on || undefined}
      {...(element === "button" && !asChild
        ? { type: "button" as const, disabled }
        : {})}
      {...(isLink ? { href, target, rel } : {})}
      {...(disabled ? { "aria-disabled": true } : {})}
      className={cn(
        "flex min-w-0 flex-1 basis-0 flex-col items-center gap-1.5 py-1 text-center",
        "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <span
        data-slot="action-circle-disc"
        aria-hidden="true"
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition-colors spring-press [&>svg]:size-5",
          // Press = colour deepens, never a shrink (BRAND.md § Motion).
          on
            ? "bg-app-tint text-primary-foreground active:bg-primary-active"
            : "bg-app-fill text-app-fill-label active:bg-app-fill-press"
        )}
      >
        {icon}
      </span>
      <span
        data-slot="action-circle-label"
        className={cn(
          "text-app-caption-2 leading-tight text-balance",
          on ? "font-medium text-app-tint" : "text-app-label-2"
        )}
      >
        {label}
      </span>
      {/* Under `asChild` the disc and label have to end up *inside* the
          caller's element; Slottable marks this position as that element so
          Slot re-parents the rest into it. Outside `asChild` it is inert. */}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )
}

export { ActionCircle, ActionCircleRow, type ActionCircleProps }
