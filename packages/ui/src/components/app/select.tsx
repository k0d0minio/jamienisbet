"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import { APP_CONTROL_BASE, useFieldWiring } from "./field"

// APP TIER — the select.
//
// A sibling rather than a variant, and the select is the clearest case for it:
// a select is not one control but eight, and half of what it *is* lives in a
// portal. A `size="app"` on the trigger would leave the menu — its radius, its
// type, its 32px rows — on the marketing tier, which is the half a thumb
// actually lands on. Owning the whole set is what lets the menu be a material
// with 44px rows.
//
// Requires "@jamie-nisbet/ui/app.css".
//
//   <AppField label="Billed">
//     <AppSelect name="billingType" defaultValue="one_off">
//       <AppSelectTrigger>
//         <AppSelectValue />
//       </AppSelectTrigger>
//       <AppSelectContent>
//         <AppSelectItem value="one_off">One-off</AppSelectItem>
//         <AppSelectItem value="monthly">Every month</AppSelectItem>
//       </AppSelectContent>
//     </AppSelect>
//   </AppField>
//
// Two triggers, because this tier asks a select to be two things. `field` is
// the one above: a control in a form, the same box as an AppInput. `plain` is
// the pull-down menu button — a value in the tint with a chevron after it and
// no box at all — which is how a choice made from inside a list row reads on
// this tier (the leads list's status control).

const AppSelect = SelectPrimitive.Root
const AppSelectGroup = SelectPrimitive.Group

function AppSelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  // Tagged so the trigger can reach it: Radix renders the value into a span of
  // its own, and keeping a long one truncated is the trigger's business.
  return <SelectPrimitive.Value data-slot="app-select-value" {...props} />
}

type AppSelectTriggerVariant = "field" | "plain"

function AppSelectTrigger({
  className,
  variant = "field",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  variant?: AppSelectTriggerVariant
}) {
  // A trigger inside an AppField answers to the same label and error text an
  // input would — it is the field's control, whatever element Radix renders.
  const wired = useFieldWiring(props)

  return (
    <SelectPrimitive.Trigger
      data-slot="app-select-trigger"
      data-variant={variant}
      className={cn(
        "flex items-center justify-between gap-2 text-left",
        // 44px on both variants, by construction rather than by media query.
        "min-h-app-touch",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variant === "field"
          ? [
              APP_CONTROL_BASE,
              "px-3.5 py-2",
              // Radix hands the trigger a `data-placeholder` until something
              // is chosen; until then it reads as a placeholder, not a value.
              "data-[placeholder]:text-app-label-3",
              "[&_svg:not([class*='text-'])]:text-app-label-3",
            ]
          : [
              // The pull-down menu button: no box, the value in the tint, the
              // chevron with it rather than pushed to a far edge. Press is a
              // colour change, like every other pressable thing on this tier.
              "w-fit justify-start gap-1 rounded-app-control px-2",
              "text-app-subhead font-medium text-app-tint",
              "outline-none transition-colors spring-press",
              "hover:bg-app-press active:bg-app-press",
              "disabled:pointer-events-none disabled:opacity-50",
              "[&_svg:not([class*='text-'])]:text-app-tint",
            ],
        // Radix renders the value in a span; keep a long one on one line
        // rather than letting it push the chevron out of the control.
        "*:data-[slot=app-select-value]:min-w-0 *:data-[slot=app-select-value]:truncate",
        className
      )}
      {...props}
      {...wired}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function AppSelectContent({
  className,
  children,
  position = "item-aligned",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="app-select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[10rem]",
          "origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
          // A menu is a floating surface, so it is a material with the
          // popover's elevation under it — the tier's "this is over the
          // content" pair. The hairline is the material's own, softer than a
          // border, because the blur is already doing the separating.
          "material-regular rounded-app-control border border-material-hairline shadow-app-popover",
          "p-1 text-material-label",
          // Opens on the pop spring rather than a bezier, and stands still
          // under reduced motion (the tokens collapse, not the call site).
          // Spelled out rather than reached for through `spring-pop`: that
          // utility sets `transition-*`, and this is an animation.
          "duration-[var(--duration-pop)] ease-[var(--spring-pop)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <AppSelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <AppSelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function AppSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="app-select-item"
      className={cn(
        // 44px rows. The coarse-pointer floor in the admin never reached in
        // here — it lifted the trigger and left the menu it opens at 32px a
        // row, which is the part you actually have to hit.
        "relative flex w-full min-h-app-touch cursor-default items-center gap-2",
        "rounded-app-row py-2 pr-9 pl-3 text-app-body outline-hidden select-none",
        "transition-colors spring-press",
        "focus:bg-app-press data-[highlighted]:bg-app-press",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {/* The tick marks the chosen one, in the tint, the way a native menu
          does it — trailing, and only on the row that is set. */}
      <span
        data-slot="app-select-item-indicator"
        className="absolute right-3 flex size-4 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-app-tint" aria-hidden />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function AppSelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="app-select-label"
      className={cn(
        "px-3 py-1.5 text-app-footnote text-material-label-3",
        className
      )}
      {...props}
    />
  )
}

function AppSelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="app-select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-material-hairline",
        className
      )}
      {...props}
    />
  )
}

function AppSelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="app-select-scroll-up"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-material-label-3",
        className
      )}
      {...props}
    >
      <ChevronUp className="size-4" aria-hidden />
    </SelectPrimitive.ScrollUpButton>
  )
}

function AppSelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="app-select-scroll-down"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-material-label-3",
        className
      )}
      {...props}
    >
      <ChevronDown className="size-4" aria-hidden />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  AppSelect,
  AppSelectContent,
  AppSelectGroup,
  AppSelectItem,
  AppSelectLabel,
  AppSelectScrollDownButton,
  AppSelectScrollUpButton,
  AppSelectSeparator,
  AppSelectTrigger,
  AppSelectValue,
  type AppSelectTriggerVariant,
}
