"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

// DESK TIER — form fields.
//
// The tier's own text controls. Not the marketing `Input` at another size:
// that one is a transparent box with a `shadow-xs`, sized for a mouse and
// rescued on a phone by a media query in the app. These are flat — a hairline
// on the pane's surface, 6px corners, no shadow — and take their height from
// the tier's row step, so a 32px field at the desk is a 44px field under a
// thumb from the same markup (tokens/desk.css § The touch step). The value
// sets at the body step, which is 16px on touch: the size at which iOS stops
// zooming the page when a field takes focus.
//
// Requires "@jamie-nisbet/ui/desk.css".
//
//   <DeskField label="Email" hint="Where the invoice goes.">
//     <DeskInput name="email" type="email" inputMode="email" />
//   </DeskField>
//
// DeskField is the unit, not the control: a label, a control, and the line of
// prose or the error under it, wired together — the call site writes the label
// once and never invents an id, matches it to an htmlFor, or forgets which of
// `hint` and `error` describes the control.

// ------------------------------------------------------------------
// The field's wiring, handed down to whatever control sits inside it. Null
// outside a field: the controls are usable bare, they just wire nothing up.
// ------------------------------------------------------------------

type FieldWiring = {
  id: string
  describedBy?: string
  invalid: boolean
}

const FieldContext = React.createContext<FieldWiring | null>(null)

/** What a control should have on it, given the field around it. Returns the
 *  overrides rather than the merged props, so a control spreads it *after* its
 *  own props — `{...props} {...wired}` — and gets nothing outside a field.
 *  Anything the call site passed explicitly still wins. */
function useFieldWiring(props: {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}) {
  const field = React.useContext(FieldContext)
  if (!field) return {}
  return {
    id: props.id ?? field.id,
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}

function DeskField({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "id"> & {
  /** What the field asks for, in sentence case. */
  label?: React.ReactNode
  /** The quiet line under it — the unit, the consequence, what leaving it
   *  blank means. Stays visible while the field is fine. */
  hint?: React.ReactNode
  /** What went wrong. Sits under the hint, marks the control invalid, and
   *  announces itself. */
  error?: React.ReactNode
  /** Point the label at a control that isn't the one this field wired up —
   *  rare, and only where two controls share a label. */
  htmlFor?: string
}) {
  const generated = React.useId()
  const id = htmlFor ?? generated
  const hintId = hint != null ? `${generated}-hint` : undefined
  const errorId = error != null ? `${generated}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  const wiring = React.useMemo<FieldWiring>(
    () => ({ id, describedBy, invalid: error != null }),
    [id, describedBy, error]
  )

  return (
    <div
      data-slot="desk-field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {label != null && <DeskLabel htmlFor={id}>{label}</DeskLabel>}
      <FieldContext.Provider value={wiring}>{children}</FieldContext.Provider>
      {hint != null && (
        <p
          id={hintId}
          data-slot="desk-field-hint"
          className="text-desk-meta text-desk-fg-3"
        >
          {hint}
        </p>
      )}
      {/* A live region, because the field that failed usually still holds
          focus. The glyph keeps "this went wrong" from being carried by
          colour alone. */}
      {error != null && (
        <p
          id={errorId}
          role="alert"
          data-slot="desk-field-error"
          className="flex items-center gap-1.5 text-desk-meta text-desk-blocked"
        >
          <TriangleAlert className="size-desk-icon shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

// The label above a field: the ui step, secondary colour. It names the field;
// the value inside is what should be loudest when the form is re-read.
function DeskLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="desk-label"
      className={cn(
        "flex items-center gap-2 text-desk-ui text-desk-fg-2 select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

// The shared shape of every text control on this tier, in one string so a
// field, a textarea and a select trigger cannot drift apart by a pixel.
//
// Focus adds only the border: the indicator itself is the tier's inset outline
// (desk.css § desk-tier), which no clipping pane can throw away. The border is
// also the edge aria-invalid turns destructive, so the two states share one
// line. Motion is a ≤120ms colour change, nothing else.
const CONTROL_BASE = [
  "w-full min-w-0 rounded-desk-control border border-desk-line-strong bg-desk-surface",
  "font-desk text-desk-body text-desk-fg",
  "outline-none transition-[color,border-color,background-color] duration-100",
  "placeholder:text-desk-fg-3",
  "focus-visible:border-desk-focus",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-desk-blocked",
]

function DeskInput({ className, ...props }: React.ComponentProps<"input">) {
  const wired = useFieldWiring(props)
  return (
    <input
      data-slot="desk-input"
      className={cn(
        CONTROL_BASE,
        // `min-h` rather than `h`, so a date field — which Safari renders at
        // whatever height its own picker wants — grows instead of overflowing.
        "min-h-desk-row px-2.5 py-1",
        "file:inline-flex file:border-0 file:bg-transparent file:text-desk-ui file:text-desk-fg",
        className
      )}
      {...props}
      {...wired}
    />
  )
}

function DeskTextarea({
  className,
  autoResize = false,
  onInput,
  ref,
  ...props
}: React.ComponentProps<"textarea"> & {
  /** Grow the box to its content on every keystroke, so it never scrolls
   *  inside itself. `field-sizing-content` already does this where the engine
   *  has it — which is not iOS Safari. Opt in for an editor that sits in the
   *  page; leave it off for a field inside a sheet, which has its own height
   *  to spend. */
  autoResize?: boolean
}) {
  const wired = useFieldWiring(props)
  const inner = React.useRef<HTMLTextAreaElement | null>(null)

  // Height off the content, measured from a collapsed box: `auto` first, or
  // scrollHeight only ever reports the height it already has.
  const fit = React.useCallback(() => {
    const el = inner.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [])

  // A callback ref rather than an effect for the first measure: it runs during
  // commit, before paint, so the box is never briefly the wrong height.
  const attach = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node
      if (autoResize && node) fit()
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [autoResize, fit, ref]
  )

  // And again when the value is driven from outside.
  React.useEffect(() => {
    if (autoResize) fit()
  }, [autoResize, fit, props.value])

  return (
    <textarea
      data-slot="desk-textarea"
      className={cn(
        CONTROL_BASE,
        "field-sizing-content min-h-20 px-2.5 py-2",
        autoResize && "resize-none overflow-hidden",
        className
      )}
      onInput={(event) => {
        if (autoResize) fit()
        onInput?.(event)
      }}
      {...props}
      ref={attach}
      {...wired}
    />
  )
}

export {
  DeskField,
  DeskLabel,
  DeskInput,
  DeskTextarea,
  // The select's trigger is the same control as the input, down to the
  // padding — exported so desk/select.tsx can wear it rather than copy it.
  CONTROL_BASE as DESK_CONTROL_BASE,
  useFieldWiring as useDeskFieldWiring,
}
