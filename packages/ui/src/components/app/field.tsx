"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — form fields.
//
// The tier's own text controls, siblings to the shadcn primitives rather than
// a variant on them, for the same reason GroupedRow is a sibling to the table:
// what the app tier wants from a field is not the marketing field at another
// size. The marketing `Input` is a 36px transparent box on a 5px radius with a
// `shadow-xs`, sized for a mouse and rescued on a phone by a coarse-pointer
// media query. This one is 44px by construction, sits on the tier's 12px
// control radius, fills the recess it is cut into, and sets at the tier's body
// size — which is also, not by accident, the size at which iOS stops zooming
// the page when a field takes focus. The marketing control needs
// `text-base md:text-sm` to dodge that; here 17px is simply the body.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <AppField label="Email" hint="Where the invoice goes.">
//     <AppInput name="email" type="email" inputMode="email" />
//   </AppField>
//
// AppField is the unit, not the control: a label, a control, and the line of
// prose or the error under it, wired together. Twenty call sites in the admin
// were hand-building that out of a `grid gap-1.5`, a `<Label htmlFor>` and an
// id repeated twice — and only one of them ever got round to pointing
// `aria-describedby` at its own error text.

// ------------------------------------------------------------------
// The field's wiring, handed down to whatever control sits inside it.
//
// A control reads this rather than taking props, so a call site writes the
// label once and never has to invent an id, match it to an htmlFor, or
// remember which of `hint` and `error` it was supposed to describe itself
// with. Null outside a field: the controls are usable bare, they just wire
// nothing up.
// ------------------------------------------------------------------

type FieldWiring = {
  id: string
  describedBy?: string
  invalid: boolean
}

const FieldContext = React.createContext<FieldWiring | null>(null)

/** What a control should have on it, given the field around it. Returns the
 *  overrides rather than the merged props, so a control spreads it *after* its
 *  own props — `{...props} {...wired}` — and gets nothing at all outside a
 *  field. Anything the call site passed explicitly still wins: an id something
 *  else already points at, an `aria-invalid` driven by a server response. */
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

function AppField({
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
  /** What went wrong. Replaces nothing: it sits under the hint, marks the
   *  control invalid, and announces itself. */
  error?: React.ReactNode
  /** Point the label at a control that isn't the one this field wired up —
   *  rare, and only where two controls share a label. */
  htmlFor?: string
}) {
  const generated = React.useId()
  const id = htmlFor ?? generated
  const hintId = hint != null ? `${generated}-hint` : undefined
  const errorId = error != null ? `${generated}-error` : undefined
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined

  const wiring = React.useMemo<FieldWiring>(
    () => ({ id, describedBy, invalid: error != null }),
    [id, describedBy, error]
  )

  return (
    <div
      data-slot="app-field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {label != null && <AppLabel htmlFor={id}>{label}</AppLabel>}
      <FieldContext.Provider value={wiring}>{children}</FieldContext.Provider>
      {hint != null && (
        <p
          id={hintId}
          data-slot="app-field-hint"
          className="text-app-footnote text-app-label-3"
        >
          {hint}
        </p>
      )}
      {/* A live region, because the field that failed usually still holds
          focus: without one, the only thing a screen reader gets after a
          refused write is silence. The glyph is not decoration either — it is
          what stops "this went wrong" from being carried by colour alone. */}
      {error != null && (
        <p
          id={errorId}
          role="alert"
          data-slot="app-field-error"
          className="flex items-center gap-1.5 text-app-footnote text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

// The label above a field. Subhead rather than body, and in the secondary
// label colour: it names the field, and the 17px value inside is what should
// be loudest when the form is re-read.
function AppLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="app-label"
      className={cn(
        "flex items-center gap-2 text-app-subhead font-medium text-app-label-2 select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

// The shared shape of every text control on this tier. Kept in one string
// rather than three, so a field, a textarea and a select trigger cannot drift
// apart by a pixel — which is exactly what happened between the marketing
// Input (h-9) and its SelectTrigger (h-9, different padding, different type
// step).
//
// Focus adds only the border here, because the indicator itself is already
// drawn for us twice: the brand's outset ring (tokens/base.css) and, over it,
// the tier's 2px inset outline (app.css § app-tier) — layered on purpose, so
// that whichever one a clipping parent throws away, the other survives. A text
// field matches :focus-visible on a tap as well as under a keyboard, so a
// focused field is ringed on a phone too. What the border adds is the control's
// own edge picking up the tint; it is also the edge aria-invalid turns
// destructive, so the two states share one line rather than competing for it.
const CONTROL_BASE = [
  "w-full min-w-0 rounded-app-control border border-app-field-border bg-app-field",
  "text-app-body text-app-label",
  "outline-none transition-[color,border-color,background-color] spring-press",
  "placeholder:text-app-label-3",
  "focus-visible:border-app-tint",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive",
]

function AppInput({ className, ...props }: React.ComponentProps<"input">) {
  const wired = useFieldWiring(props)
  return (
    <input
      data-slot="app-input"
      className={cn(
        CONTROL_BASE,
        // 44px by construction. `min-h` rather than `h`, so a date field —
        // which Safari renders at whatever height its own picker wants —
        // grows instead of overflowing.
        "min-h-app-touch px-3.5 py-2",
        // A file input's own button is not a 17px sentence.
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-app-subhead file:font-medium file:text-app-label",
        className
      )}
      {...props}
      {...wired}
    />
  )
}

function AppTextarea({
  className,
  autoResize = false,
  onInput,
  ref,
  ...props
}: React.ComponentProps<"textarea"> & {
  /** Grow the box to its content on every keystroke, so it never scrolls
   *  inside itself. `field-sizing-content` already does this where the engine
   *  has it — which is not iOS Safari, i.e. not the phone this tier is for,
   *  and a box that scrolls inside a page that scrolls is the reason notes
   *  used to be edited a sheet away. Opt in for an editor that sits in the
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

  // And again when the value is driven from outside — a controlled editor
  // reset to what the record says, most often.
  React.useEffect(() => {
    if (autoResize) fit()
  }, [autoResize, fit, props.value])

  return (
    <textarea
      data-slot="app-textarea"
      className={cn(
        CONTROL_BASE,
        // Grows with what is typed where the engine has it, and never starts
        // shorter than two lines plus the padding.
        "field-sizing-content min-h-20 px-3.5 py-2.5",
        // Measuring the content means owning the height: no scrollbar to
        // fight the page's, and no drag handle to leave it somewhere the
        // next keystroke would overwrite.
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
  AppField,
  AppLabel,
  AppInput,
  AppTextarea,
  // The select's trigger has to be the same control as the input, down to the
  // padding — it is exported so app/select.tsx can wear it rather than copy it.
  CONTROL_BASE as APP_CONTROL_BASE,
  useFieldWiring,
}
