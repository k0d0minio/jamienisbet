"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import { Kbd } from "./kbd"

// DESK TIER — the command palette shell.
//
// ⌘K reaches any repo, ticket, lead or action (D-5). This is the floating
// container and its parts, nothing more: a dialog that traps focus, closes
// on Esc and hands focus back; a search row; group headings; items; an
// empty line. It filters nothing, ranks nothing and binds no key — the
// shell that mounts it owns the query, the results and the shortcut.
//
//   <CommandPalette open={open} onOpenChange={setOpen}>
//     <CommandPaletteInput value={q} onChange={…} aria-controls="palette-list"
//                          aria-activedescendant={activeId} />
//     <CommandPaletteList id="palette-list">
//       <CommandPaletteGroup heading="Repos">
//         <CommandPaletteItem id="r-1" selected meta="2 of 5 · 1 running">quinta-do-sol</CommandPaletteItem>
//       </CommandPaletteGroup>
//       <CommandPaletteEmpty>Nothing matches “{q}”</CommandPaletteEmpty>
//     </CommandPaletteList>
//   </CommandPalette>
//
// The input is a combobox over a listbox, so focus stays in the field and
// the highlighted item is announced through aria-activedescendant — the
// caller moves `selected` and that id together.
//
// Flat: the one shadow on the tier (it floats) and no scrim or blur behind
// it — the page stays readable, and a click outside still closes it.
//
// Requires "@jamie-nisbet/ui/desk.css".

type CommandPaletteProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  /** The dialog's accessible name. */
  label?: string
  className?: string
  children?: React.ReactNode
}

function CommandPalette({
  label = "Go anywhere",
  className,
  children,
  ...props
}: CommandPaletteProps) {
  return (
    <DialogPrimitive.Root data-slot="command-palette" {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="command-palette-overlay"
          className="fixed inset-0 z-50"
        />
        <DialogPrimitive.Content
          data-slot="command-palette-content"
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-4 top-24 z-50 mx-auto flex max-w-xl flex-col overflow-hidden rounded-desk-pane border border-desk-line bg-desk-surface font-desk text-desk-ui text-desk-fg shadow-desk-float outline-none",
            className
          )}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function CommandPaletteInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div
      data-slot="command-palette-input"
      className="flex h-desk-toolbar shrink-0 items-center gap-2.5 border-b border-desk-line px-3.5"
    >
      <SearchIcon aria-hidden className="size-desk-icon shrink-0 text-desk-fg-3" />
      <input
        type="text"
        role="combobox"
        aria-expanded
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-desk-body text-desk-fg outline-none placeholder:text-desk-fg-3",
          className
        )}
        {...props}
      />
      <Kbd aria-hidden>esc</Kbd>
    </div>
  )
}

function CommandPaletteList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="listbox"
      data-slot="command-palette-list"
      className={cn("max-h-80 overflow-y-auto py-1.5", className)}
      {...props}
    />
  )
}

type CommandPaletteGroupProps = React.ComponentProps<"div"> & {
  heading: React.ReactNode
}

function CommandPaletteGroup({
  heading,
  className,
  children,
  ...props
}: CommandPaletteGroupProps) {
  const id = React.useId()
  return (
    <div
      role="group"
      aria-labelledby={id}
      data-slot="command-palette-group"
      className={className}
      {...props}
    >
      <div
        id={id}
        className="px-3.5 pt-2 pb-1 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase"
      >
        {heading}
      </div>
      {children}
    </div>
  )
}

type CommandPaletteItemProps = React.ComponentProps<"div"> & {
  /** The highlighted item — the one Enter would choose. */
  selected?: boolean
  /** A leading mark: a StatusDot, an icon. */
  leading?: React.ReactNode
  /** Trailing mono metadata. */
  meta?: React.ReactNode
  /** Keys that run this item, shown as a key hint. */
  shortcut?: string[]
}

function CommandPaletteItem({
  selected = false,
  leading,
  meta,
  shortcut,
  className,
  children,
  ...props
}: CommandPaletteItemProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-slot="command-palette-item"
      data-selected={selected || undefined}
      className={cn(
        "flex h-desk-row cursor-pointer items-center gap-2.5 px-3.5 text-desk-ui text-desk-fg",
        selected && "bg-desk-sunken",
        className
      )}
      {...props}
    >
      {leading != null && (
        <span className="flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-desk-icon">
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {meta != null && (
        <span className="shrink-0 truncate font-mono text-desk-micro text-desk-fg-3">
          {meta}
        </span>
      )}
      {shortcut && shortcut.length > 0 && <Kbd keys={shortcut} />}
    </div>
  )
}

function CommandPaletteEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-palette-empty"
      className={cn("px-3.5 py-6 text-center text-desk-ui text-desk-fg-3", className)}
      {...props}
    />
  )
}

export {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  type CommandPaletteGroupProps,
  type CommandPaletteItemProps,
  type CommandPaletteProps,
}
