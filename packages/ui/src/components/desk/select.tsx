"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import { DESK_CONTROL_BASE, useDeskFieldWiring } from "./field"

// DESK TIER — the select.
//
// The whole set, trigger and menu, because half of what a select *is* lives in
// a portal: the menu is a flat floating surface like DeskMenu — a hairline,
// the tier's one shadow, rows on the row step (44px under a thumb) — and it
// appears, it does not pop.
//
// Requires "@jamie-nisbet/ui/desk.css".
//
//   <DeskField label="Billed">
//     <DeskSelect name="billingType" defaultValue="one_off">
//       <DeskSelectTrigger>
//         <DeskSelectValue />
//       </DeskSelectTrigger>
//       <DeskSelectContent>
//         <DeskSelectItem value="one_off">One-off</DeskSelectItem>
//         <DeskSelectItem value="monthly">Every month</DeskSelectItem>
//       </DeskSelectContent>
//     </DeskSelect>
//   </DeskField>
//
// Two triggers: `field` is a control in a form, the same box as a DeskInput;
// `plain` is a value with a chevron after it and no box, for a choice made
// from inside a row.

const DeskSelect = SelectPrimitive.Root
const DeskSelectGroup = SelectPrimitive.Group

function DeskSelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  // Tagged so the trigger can keep a long value truncated.
  return <SelectPrimitive.Value data-slot="desk-select-value" {...props} />
}

type DeskSelectTriggerVariant = "field" | "plain"

function DeskSelectTrigger({
  className,
  variant = "field",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  variant?: DeskSelectTriggerVariant
}) {
  // A trigger inside a DeskField answers to the same label and error text an
  // input would.
  const wired = useDeskFieldWiring(props)

  return (
    <SelectPrimitive.Trigger
      data-slot="desk-select-trigger"
      data-variant={variant}
      className={cn(
        "flex min-h-desk-row items-center justify-between gap-2 text-left",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-desk-icon",
        variant === "field"
          ? [
              DESK_CONTROL_BASE,
              "px-2.5 py-1",
              // Until something is chosen it reads as a placeholder.
              "data-[placeholder]:text-desk-fg-3",
              "[&_svg:not([class*='text-'])]:text-desk-fg-3",
            ]
          : [
              "w-fit justify-start gap-1 rounded-desk-control px-2",
              "font-desk text-desk-ui text-desk-fg",
              "outline-none transition-colors duration-100",
              "hover:bg-desk-hover active:bg-desk-sunken",
              "disabled:pointer-events-none disabled:opacity-50",
              "[&_svg:not([class*='text-'])]:text-desk-fg-3",
            ],
        "*:data-[slot=desk-select-value]:min-w-0 *:data-[slot=desk-select-value]:truncate",
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

function DeskSelectContent({
  className,
  children,
  position = "item-aligned",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="desk-select-content"
        className={cn(
          // `desk-tier` on the menu itself, as DeskMenu does: the portal
          // lands on <body>, and the menu must not depend on the page having
          // switched the tier on there.
          "desk-tier relative z-50 max-h-(--radix-select-content-available-height) min-w-[10rem]",
          "overflow-x-hidden overflow-y-auto",
          "rounded-desk-pane border border-desk-line bg-desk-surface p-1 text-desk-fg shadow-desk-float",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <DeskSelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <DeskSelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function DeskSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="desk-select-item"
      className={cn(
        "relative flex min-h-desk-row w-full cursor-default items-center gap-2",
        "rounded-desk-control py-1 pr-8 pl-2 text-desk-ui outline-hidden select-none",
        "transition-colors duration-100",
        "focus:bg-desk-sunken data-[highlighted]:bg-desk-sunken",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-desk-icon",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {/* The check marks the chosen one — trailing, only on the row that is
          set. */}
      <span
        data-slot="desk-select-item-indicator"
        className="absolute right-2 flex size-desk-icon items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <Check className="size-desk-icon text-desk-fg" aria-hidden />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function DeskSelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="desk-select-label"
      className={cn(
        "px-2 py-1.5 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase",
        className
      )}
      {...props}
    />
  )
}

function DeskSelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="desk-select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-desk-line", className)}
      {...props}
    />
  )
}

function DeskSelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="desk-select-scroll-up"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-desk-fg-3",
        className
      )}
      {...props}
    >
      <ChevronUp className="size-desk-icon" aria-hidden />
    </SelectPrimitive.ScrollUpButton>
  )
}

function DeskSelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="desk-select-scroll-down"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-desk-fg-3",
        className
      )}
      {...props}
    >
      <ChevronDown className="size-desk-icon" aria-hidden />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  DeskSelect,
  DeskSelectContent,
  DeskSelectGroup,
  DeskSelectItem,
  DeskSelectLabel,
  DeskSelectScrollDownButton,
  DeskSelectScrollUpButton,
  DeskSelectSeparator,
  DeskSelectTrigger,
  DeskSelectValue,
  type DeskSelectTriggerVariant,
}
