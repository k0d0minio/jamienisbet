import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — the inset grouped list.
//
// The iOS list idiom, and the app tier's main structural unit: sections of
// rows in a rounded slab that floats on the page canvas, each section with
// optional header and footer prose around it. It replaces the table on an
// operating screen — one codepath from phone to desktop, where a table only
// ever worked on the wide end.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <GroupedList>
//     <GroupedSection header="Contact" footer="Shown on every invoice.">
//       <GroupedRow icon={<Mail />} label="Email" value="ana@keel.pt" href="mailto:…" />
//       <GroupedRow icon={<Phone />} label="Phone" value="—" />
//     </GroupedSection>
//     <GroupedSection>
//       <GroupedRow label="Archive lead" variant="destructive" onClick={archive} />
//     </GroupedSection>
//   </GroupedList>
//
// A row is whatever its props make it: a link with an `href`, a button with
// an `onClick`, a `<Link>` with `asChild`, and otherwise a plain read-only
// line. Interactive rows press-deepen (BRAND.md — press is a colour change,
// never a shrink) and get the chevron unless you say otherwise.

function GroupedList({ className, ...props }: React.ComponentProps<"div">) {
  // The list owns the page gutter, so a section's slab lines up with every
  // other one on the screen and the rows inside it never have to know.
  return (
    <div
      data-slot="grouped-list"
      className={cn(
        "flex flex-col gap-app-section px-app-gutter",
        className
      )}
      {...props}
    />
  )
}

function GroupedSection({
  header,
  footer,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  /** Sentence-case prose above the slab — what this group of rows is. */
  header?: React.ReactNode
  /** Sentence-case prose below it — the caveat, the consequence, the unit. */
  footer?: React.ReactNode
}) {
  return (
    <section
      data-slot="grouped-section"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {header != null && (
        <div
          data-slot="grouped-section-header"
          // Aligned with the row labels, not the slab edge — the same
          // optical column the eye is already scanning down.
          className="px-4 pb-2 text-app-footnote text-app-label-3"
        >
          {header}
        </div>
      )}
      <div
        data-slot="grouped-section-body"
        // The slab: a hairline still does the structural work (the app
        // tier adds elevation, it does not retire the border), and the
        // clip is what gives the first and last rows their corners.
        className="overflow-hidden rounded-app-group border border-app-separator bg-app-group"
      >
        {children}
      </div>
      {footer != null && (
        <div
          data-slot="grouped-section-footer"
          className="px-4 pt-2 text-app-footnote text-app-label-3"
        >
          {footer}
        </div>
      )}
    </section>
  )
}

type GroupedRowElement = "a" | "button" | "div"

type GroupedRowProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "value" | "type"
> & {
  /** Leading glyph — a Lucide icon. Sized and tinted by the row. */
  icon?: React.ReactNode
  /** The row's subject, in sentence case. */
  label: React.ReactNode
  /** A second line under the label, for the detail the label can't carry. */
  description?: React.ReactNode
  /** The trailing value. A figure belongs in mono — `<span className="font-mono">`. */
  value?: React.ReactNode
  /** Renders an anchor. */
  href?: string
  /** Anchor target, when `href` is set. */
  target?: string
  rel?: string
  /** Force the disclosure chevron on or off. Defaults to "interactive". */
  chevron?: boolean
  /** `destructive` tints the label and icon; it does not change the geometry. */
  variant?: "default" | "destructive"
  /** Hand the row's element to a child — a Next `<Link>`, most often. */
  asChild?: boolean
}

function GroupedRow({
  icon,
  label,
  description,
  value,
  href,
  chevron,
  variant = "default",
  asChild = false,
  className,
  style,
  children,
  ...props
}: GroupedRowProps) {
  const interactive = asChild || href != null || props.onClick != null
  const showChevron = chevron ?? interactive

  const element: GroupedRowElement =
    href != null ? "a" : interactive ? "button" : "div"
  // A row is one of four things depending on its props, so the element type
  // is only known at runtime; React.ElementType is what lets the one JSX
  // block below serve all of them.
  const Comp = (asChild ? Slot.Root : element) as React.ElementType

  return (
    <Comp
      data-slot="grouped-row"
      data-variant={variant}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href } : {})}
      className={cn(
        "relative flex w-full min-h-app-touch items-center gap-3 px-4 py-2.5 text-left",
        "text-app-body text-app-label",
        // The separator between rows, inset to the label column the way a
        // native list insets it — drawn by the row itself so it survives
        // any ordering, and skipped on the first row where the slab's own
        // edge already closes the group.
        "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator",
        // display:none is what actually removes the pseudo — the first row
        // sits against the slab's own edge and needs no hairline above it.
        "first:before:hidden",
        // Press = colour deepens, on the app tier's press spring.
        interactive &&
          "transition-colors spring-press active:bg-app-press disabled:pointer-events-none disabled:opacity-50",
        variant === "destructive" && "text-destructive",
        className
      )}
      style={
        {
          // Where the hairline starts: the label column with an icon
          // (gutter + icon slot + gap), the slab's own padding without.
          "--app-row-inset": icon != null ? "3.25rem" : "1rem",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {icon != null && (
        <span
          data-slot="grouped-row-icon"
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center [&>svg]:size-5",
            variant === "destructive" ? "text-destructive" : "text-app-label-3"
          )}
        >
          {icon}
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {description != null && (
          <span className="truncate text-app-footnote text-app-label-3">
            {description}
          </span>
        )}
      </span>

      {value != null && (
        <span
          data-slot="grouped-row-value"
          className="ml-auto min-w-0 shrink truncate text-right text-app-label-2"
        >
          {value}
        </span>
      )}

      {/* Under `asChild` the row's own parts — icon, label, value, chevron —
          have to end up *inside* the caller's element, not beside it. Slottable
          is what marks this position as the caller's element rather than as
          another child, so Slot re-parents the rest into it. Without it a row
          with a label (which is every row) hands Slot more than one child and
          it throws. Outside `asChild` it is a fragment and does nothing. */}
      <Slot.Slottable>{children}</Slot.Slottable>

      {showChevron && (
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-app-label-3"
        />
      )}
    </Comp>
  )
}

export { GroupedList, GroupedSection, GroupedRow, type GroupedRowProps }
