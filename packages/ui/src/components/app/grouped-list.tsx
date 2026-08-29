import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
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
//
// A row can also carry an `accessory` — a second, smaller control on the
// trailing edge (copy this address, delete this todo). It sits *outside* the
// row's own element, because a button inside a button is not a thing.

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
  /** Force the disclosure chevron on or off. Defaults to "interactive",
   *  and to off when the row carries an accessory — two trailing affordances
   *  is one too many. */
  chevron?: boolean
  /** A second control on the trailing edge, outside the row's own element:
   *  the copy button beside an address, the delete beside a todo. */
  accessory?: React.ReactNode
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
  accessory,
  variant = "default",
  asChild = false,
  className,
  style,
  children,
  ...props
}: GroupedRowProps) {
  const interactive = asChild || href != null || props.onClick != null
  const showChevron = chevron ?? (interactive && accessory == null)

  // Where the hairline starts: the label column with an icon (gutter + icon
  // slot + gap), the slab's own padding without. It is set on whichever
  // element is the section body's direct child, since `first:` is what
  // decides whether the group's own edge has already closed the row.
  const inset = {
    "--app-row-inset": icon != null ? "3.25rem" : "1rem",
  } as React.CSSProperties

  // The hairline between rows, inset the way a native list insets it, and
  // skipped on the first row. `display: none` is what actually removes the
  // pseudo-element.
  const hairline =
    "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator first:before:hidden"

  const element: GroupedRowElement =
    href != null ? "a" : interactive ? "button" : "div"
  // A row is one of four things depending on its props, so the element type
  // is only known at runtime; React.ElementType is what lets the one JSX
  // block below serve all of them.
  const Comp = (asChild ? Slot.Root : element) as React.ElementType

  const row = (
    <Comp
      data-slot="grouped-row"
      data-variant={variant}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href } : {})}
      className={cn(
        "relative flex w-full min-h-app-touch items-center gap-3 px-4 py-2.5 text-left",
        "text-app-body text-app-label",
        // With an accessory beside it the row is no longer the section
        // body's direct child: the wrapper draws the hairline, and the row
        // takes the width that is left rather than all of it.
        accessory == null ? hairline : "min-w-0 flex-1",
        // Press = colour deepens, on the app tier's press spring.
        interactive &&
          "transition-colors spring-press active:bg-app-press disabled:pointer-events-none disabled:opacity-50",
        variant === "destructive" && "text-destructive",
        className
      )}
      style={accessory == null ? { ...inset, ...style } : style}
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

  if (accessory == null) return row

  // The accessory rides outside the row's element, so the row keeps its whole
  // width as one target and the accessory keeps its own. The wrapper takes
  // over the hairline and the inset, being what the section body now holds.
  return (
    <div
      data-slot="grouped-row-with-accessory"
      className={cn("relative flex items-stretch", hairline)}
      style={{ ...inset, ...style }}
    >
      {row}
      <div className="flex shrink-0 items-center pr-2">{accessory}</div>
    </div>
  )
}

// Not everything inside a slab is a row. A running note, a lead's own words
// from an intake form, a repo's connect form — prose and controls that need
// the group's fill and its hairline, but not its 44px single-line geometry.
//
//   <GroupedSection header="Notes">
//     <GroupedRow label="Edit" onClick={…} />
//     <GroupedBlock>{notes}</GroupedBlock>
//   </GroupedSection>
function GroupedBlock({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="grouped-block"
      className={cn(
        "relative px-4 py-3 text-app-callout text-app-label-2",
        // The same inset hairline a row draws, so a block reads as part of
        // the group rather than as something bolted under it.
        "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator",
        "first:before:hidden",
        className
      )}
      style={
        {
          "--app-row-inset": "1rem",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// A row that opens onto its own contents rather than onto another screen —
// reference material you read once (how a lead came in), or a long answer you
// only sometimes want. Native <details>, so it costs no JavaScript, works
// before hydration, and a server component can render the body.
//
// The chevron points down rather than trailing right: this discloses in place,
// and the trailing chevron on a GroupedRow means "this navigates".
function GroupedDisclosure({
  icon,
  label,
  description,
  value,
  defaultOpen = false,
  className,
  style,
  children,
  ...props
}: Omit<React.ComponentProps<"details">, "open"> & {
  icon?: React.ReactNode
  label: React.ReactNode
  description?: React.ReactNode
  value?: React.ReactNode
  /** Open on arrival — for the one set of answers you came to read. */
  defaultOpen?: boolean
}) {
  return (
    <details
      data-slot="grouped-disclosure"
      open={defaultOpen}
      className={cn(
        "group/disclosure relative",
        "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-[var(--app-row-inset)] before:h-px before:bg-app-separator",
        "first:before:hidden",
        className
      )}
      style={
        {
          "--app-row-inset": icon != null ? "3.25rem" : "1rem",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <summary
        className={cn(
          "flex min-h-app-touch cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-app-body text-app-label",
          "transition-colors spring-press active:bg-app-press",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        {icon != null && (
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center text-app-label-3 [&>svg]:size-5"
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
          <span className="ml-auto min-w-0 shrink truncate text-right text-app-label-2">
            {value}
          </span>
        )}

        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-app-label-3 transition-transform spring-press group-open/disclosure:rotate-180"
        />
      </summary>

      <div className="px-4 pt-1 pb-3 text-app-callout text-app-label-2">
        {children}
      </div>
    </details>
  )
}

export {
  GroupedList,
  GroupedSection,
  GroupedRow,
  GroupedBlock,
  GroupedDisclosure,
  type GroupedRowProps,
}
