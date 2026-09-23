"use client"

import * as React from "react"
import { DropdownMenu as MenuPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

// APP TIER — the action menu.
//
// AppSelect's sibling for the other half of what a pull-down does: not "pick
// a value", but "do one of these". Same surface on purpose — the material with
// the popover's elevation, 44px rows — so a menu opened from a split button
// reads as the same object as a select opened from a list row. What it adds
// is what an action needs and a value does not: a second line under the label
// (what the action will do, or why it can't), and a disabled row that stays in
// the list and says so rather than disappearing.
//
// Requires "@jamie-nisbet/ui/app.css".
//
//   <AppMenu>
//     <AppMenuTrigger asChild>
//       <Button size="icon-sm" aria-label="More">…</Button>
//     </AppMenuTrigger>
//     <AppMenuContent align="end">
//       <AppMenuItem asChild description="Opens in a new tab">
//         <a href={url} target="_blank" rel="noreferrer">Open</a>
//       </AppMenuItem>
//       <AppMenuItem disabled description="Too long for a link">Copy</AppMenuItem>
//     </AppMenuContent>
//   </AppMenu>
//
// Radix owns the keyboard: arrows move, Enter/Space activate, Escape closes,
// and a disabled row is skipped by the arrows but still read by a screen reader.

const AppMenu = MenuPrimitive.Root
const AppMenuTrigger = MenuPrimitive.Trigger
const AppMenuGroup = MenuPrimitive.Group

function AppMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="app-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[12rem] max-w-[min(20rem,calc(100vw-2rem))]",
          "origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto",
          // The same material, hairline and elevation as AppSelectContent: a
          // floating surface over the content, separated by the blur first.
          "material-regular rounded-app-control border border-material-hairline shadow-app-popover",
          "p-1 font-app text-material-label",
          // The pop spring, spelled out because this is an animation, not a
          // transition; the tokens stand it still under reduced motion.
          "duration-[var(--duration-pop)] ease-[var(--spring-pop)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

function AppMenuItem({
  className,
  description,
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  /** A second line under the label — what the action does, or, on a disabled
   *  row, why it can't. */
  description?: React.ReactNode
}) {
  // Under `asChild` the caller's element (an anchor, most often) becomes the
  // row, so the label and description have to go inside it rather than beside
  // it: take its children, lay them out, and hand the element back.
  const body = (label: React.ReactNode) => (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{label}</span>
      {description != null && (
        <span
          data-slot="app-menu-item-description"
          className="text-app-footnote text-material-label-2"
        >
          {description}
        </span>
      )}
    </span>
  )

  let content: React.ReactNode = body(children)
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    content = React.cloneElement(children, undefined, body(children.props.children))
  }

  return (
    <MenuPrimitive.Item
      data-slot="app-menu-item"
      asChild={asChild}
      className={cn(
        // 44px rows, the same floor as AppSelectItem.
        "relative flex w-full min-h-app-touch cursor-default items-center gap-3",
        "rounded-app-row px-3 py-2 text-left text-app-body outline-hidden select-none",
        "transition-colors spring-press",
        "focus:bg-app-press data-[highlighted]:bg-app-press",
        // A disabled row stays readable — its description is the reason — so
        // it dims rather than vanishing, and never takes a press.
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {content}
    </MenuPrimitive.Item>
  )
}

function AppMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      data-slot="app-menu-label"
      className={cn(
        "px-3 py-1.5 text-app-footnote text-material-label-3",
        className
      )}
      {...props}
    />
  )
}

function AppMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="app-menu-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-material-hairline",
        className
      )}
      {...props}
    />
  )
}

export {
  AppMenu,
  AppMenuContent,
  AppMenuGroup,
  AppMenuItem,
  AppMenuLabel,
  AppMenuSeparator,
  AppMenuTrigger,
}
