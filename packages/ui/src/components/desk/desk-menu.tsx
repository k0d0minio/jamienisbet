"use client"

import * as React from "react"
import { DropdownMenu as MenuPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

// DESK TIER — the action menu.
//
// "Do one of these", behind one trigger: the actions a screen keeps out of
// reach on purpose (archive, opt out, delete) or has no room for. A flat
// surface with a hairline and the tier's one elevation step — it floats, so
// it takes `shadow-desk-float` — and rows on the desk's row height.
//
//   <DeskMenu>
//     <DeskMenuTrigger asChild>
//       <DeskButton variant="ghost" size="sm">More</DeskButton>
//     </DeskMenuTrigger>
//     <DeskMenuContent align="end">
//       <DeskMenuItem onSelect={archive}>Archive</DeskMenuItem>
//       <DeskMenuSeparator />
//       <DeskMenuItem variant="destructive" onSelect={remove}>Delete</DeskMenuItem>
//     </DeskMenuContent>
//   </DeskMenu>
//
// Radix owns the keyboard: arrows move, Enter/Space activate, Escape closes.
// Motion is none — it appears, per the tier.
//
// Requires "@jamie-nisbet/ui/desk.css".

const DeskMenu = MenuPrimitive.Root
const DeskMenuTrigger = MenuPrimitive.Trigger
const DeskMenuGroup = MenuPrimitive.Group

function DeskMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="desk-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "desk-tier z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[12rem] max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto",
          "rounded-desk-pane border border-desk-line bg-desk-surface p-1 font-desk text-desk-ui text-desk-fg shadow-desk-float",
          className
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

type DeskMenuItemVariant = "default" | "destructive"

function DeskMenuItem({
  className,
  description,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  /** A second line — what the action does, or why it can't. */
  description?: React.ReactNode
  /** `destructive` for the one that can't be taken back. */
  variant?: DeskMenuItemVariant
}) {
  return (
    <MenuPrimitive.Item
      data-slot="desk-menu-item"
      data-variant={variant}
      className={cn(
        "flex min-h-desk-row w-full cursor-default items-center gap-2.5 rounded-desk-control px-2 py-1 text-left outline-hidden select-none",
        "transition-colors duration-100 focus:bg-desk-sunken data-[highlighted]:bg-desk-sunken",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-desk-icon",
        variant === "destructive" && "text-desk-blocked",
        className
      )}
      {...props}
    >
      {description == null ? (
        children
      ) : (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2.5">{children}</span>
          <span className="text-desk-meta text-desk-fg-3">{description}</span>
        </span>
      )}
    </MenuPrimitive.Item>
  )
}

function DeskMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="desk-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-desk-line", className)}
      {...props}
    />
  )
}

export {
  DeskMenu,
  DeskMenuContent,
  DeskMenuGroup,
  DeskMenuItem,
  DeskMenuSeparator,
  DeskMenuTrigger,
  type DeskMenuItemVariant,
}
