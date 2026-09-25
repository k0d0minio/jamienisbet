import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

// DESK TIER — the record: a dense key–value list under a mono eyebrow.
//
// What one record's facts are at the desk — contact, facts, deal — read as
// label on the left, value on the right, a hairline between rows, no slab and
// no card around them. `RecordSection` takes a `header` and a `footer`;
// `RecordRow` a `label`, `value`, `description`, `href`, `accessory`, `variant`
// and `asChild`; `RecordBlock` holds prose; `RecordDisclosure` folds.
//
//   <RecordSection header="Contact" actions={<DeskButton variant="ghost" size="sm">Edit</DeskButton>}>
//     <RecordRow label="Email" value={<span className="font-mono">a@b.pt</span>}
//                href="mailto:a@b.pt" accessory={<CopyButton />} />
//     <RecordBlock>No phone on file.</RecordBlock>
//   </RecordSection>
//
// Rows are 32px at the desk and 44px under a thumb (the tokens decide). A row
// is interactive when it has an `href`, an `onClick` or `asChild` — then it
// takes the hover wash and the tier's focus; otherwise it only reads.
//
// Requires "@jamie-nisbet/ui/desk.css".

function RecordSection({
  header,
  footer,
  actions,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  /** The mono eyebrow over the rows — what this record is. */
  header?: React.ReactNode
  /** One quiet line under the rows — the caveat, the consequence. */
  footer?: React.ReactNode
  /** Trailing controls on the eyebrow's line: Edit, Add. */
  actions?: React.ReactNode
}) {
  return (
    <section
      data-slot="record-section"
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    >
      {(header != null || actions != null) && (
        <div
          data-slot="record-section-header"
          className="flex min-h-desk-control items-center gap-2"
        >
          {header != null && (
            <h3 className="min-w-0 flex-1 truncate font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase">
              {header}
            </h3>
          )}
          {actions != null && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {actions}
            </div>
          )}
        </div>
      )}
      <div data-slot="record-section-body" className="flex flex-col">
        {children}
      </div>
      {footer != null && (
        <p
          data-slot="record-section-footer"
          className="pt-2 text-desk-meta text-desk-fg-3"
        >
          {footer}
        </p>
      )}
    </section>
  )
}

type RecordRowVariant = "default" | "tint" | "destructive"

const VARIANT_LABEL: Record<RecordRowVariant, string> = {
  default: "text-desk-fg-3",
  tint: "font-semibold text-desk-fg",
  destructive: "text-desk-blocked",
}

type RecordRowProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "value" | "type"
> & {
  /** A leading glyph — a Lucide icon, sized by the row. Optional; a record
   *  reads by its labels. */
  icon?: React.ReactNode
  /** The key, on the leading edge. */
  label: React.ReactNode
  /** A second line under the label. */
  description?: React.ReactNode
  /** The value, on the trailing edge. A figure belongs in mono. */
  value?: React.ReactNode
  /** Renders an anchor. */
  href?: string
  target?: string
  rel?: string
  /** Accepted and ignored: the desk draws no chevron on a row. */
  chevron?: boolean
  /** A second control beside the row, outside its element: copy, delete. */
  accessory?: React.ReactNode
  /** `tint` is an affirmative action row; `destructive` the one that can't be
   *  taken back. Neither changes the geometry. */
  variant?: RecordRowVariant
  /** Hand the row's element to a child — a Sheet trigger, a Next `<Link>`. */
  asChild?: boolean
}

function RecordRow({
  icon,
  label,
  description,
  value,
  href,
  chevron: _chevron,
  accessory,
  variant = "default",
  asChild = false,
  className,
  children,
  ...props
}: RecordRowProps) {
  // The desk draws no chevron; the prop is accepted and ignored.
  void _chevron
  const interactive = asChild || href != null || props.onClick != null
  const element = href != null ? "a" : interactive ? "button" : "div"
  const Comp = (asChild ? Slot.Root : element) as React.ElementType

  const row = (
    <Comp
      data-slot="record-row"
      data-variant={variant}
      {...(element === "button" && !asChild ? { type: "button" as const } : {})}
      {...(href != null ? { href } : {})}
      className={cn(
        "flex min-h-desk-row w-full min-w-0 items-center gap-3 py-1 text-left text-desk-ui text-desk-fg",
        accessory == null && "border-b border-desk-line",
        interactive &&
          "cursor-pointer transition-colors duration-100 hover:bg-desk-hover disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon != null && (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center [&>svg]:size-desk-icon",
            VARIANT_LABEL[variant]
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 shrink-0 flex-col">
        <span
          className={cn(
            "truncate",
            // A label is a key — muted — when a value answers it. A row with
            // no value (an action, a status line) is its own statement, and
            // reads at full strength rather than as if it were disabled.
            variant === "default" && value == null
              ? "text-desk-fg"
              : VARIANT_LABEL[variant]
          )}
        >
          {label}
        </span>
        {description != null && (
          <span className="truncate text-desk-meta text-desk-fg-3">
            {description}
          </span>
        )}
      </span>
      {value != null && (
        <span
          data-slot="record-row-value"
          className="ml-auto min-w-0 truncate text-right"
        >
          {value}
        </span>
      )}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )

  if (accessory == null) return row

  return (
    <div
      data-slot="record-row-with-accessory"
      className="flex min-w-0 items-center gap-1 border-b border-desk-line"
    >
      {row}
      <div className="flex shrink-0 items-center">{accessory}</div>
    </div>
  )
}

function RecordBlock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="record-block"
      className={cn(
        "border-b border-desk-line py-2 text-desk-ui text-desk-fg-2",
        className
      )}
      {...props}
    />
  )
}

function RecordDisclosure({
  icon,
  label,
  description,
  value,
  accessory,
  defaultOpen = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"details">, "open"> & {
  icon?: React.ReactNode
  label: React.ReactNode
  description?: React.ReactNode
  value?: React.ReactNode
  /** A control that acts without opening the fold. It sits outside the
   *  `<details>` — a summary can't hold a button, and a closed details hides
   *  everything else — overlaid on the summary's trailing edge. */
  accessory?: React.ReactNode
  defaultOpen?: boolean
}) {
  const details = (
    <details
      data-slot="record-disclosure"
      open={defaultOpen}
      className={cn(
        "group/record min-w-0",
        accessory == null && "border-b border-desk-line",
        className
      )}
      {...props}
    >
      <summary
        className={cn(
          "flex min-h-desk-row cursor-pointer list-none items-center gap-3 py-1 text-desk-ui text-desk-fg transition-colors duration-100 hover:bg-desk-hover",
          "[&::-webkit-details-marker]:hidden",
          accessory != null && "pr-12"
        )}
      >
        {icon != null && (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center text-desk-fg-3 [&>svg]:size-desk-icon"
          >
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{label}</span>
          {description != null && (
            <span className="truncate text-desk-meta text-desk-fg-3">
              {description}
            </span>
          )}
        </span>
        {value != null && (
          <span className="ml-auto min-w-0 shrink truncate text-right text-desk-fg-2">
            {value}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className="size-desk-icon shrink-0 text-desk-fg-3 group-open/record:rotate-180"
        />
      </summary>
      <div className="pt-1 pb-3 text-desk-ui text-desk-fg-2">{children}</div>
    </details>
  )

  if (accessory == null) return details

  return (
    <div
      data-slot="record-disclosure-with-accessory"
      className="relative border-b border-desk-line"
    >
      {details}
      <div className="pointer-events-none absolute top-0 right-0 flex h-desk-row items-center">
        <div className="pointer-events-auto">{accessory}</div>
      </div>
    </div>
  )
}

export {
  RecordSection,
  RecordRow,
  RecordBlock,
  RecordDisclosure,
  type RecordRowProps,
  type RecordRowVariant,
}
