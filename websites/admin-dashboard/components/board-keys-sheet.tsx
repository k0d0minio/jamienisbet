"use client"

import { useRef } from "react"

import {
  GroupedRow,
  GroupedSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jamie-nisbet/ui"

// The board's keyboard map, said once, where `?` opens it. Desktop only, like
// the keys themselves (components/use-board-keys.ts). Three groups in the
// order you reach for them: move through the list, open or leave a thing, act
// on it.

const GROUPS: { header: string; keys: { keys: string[]; label: string }[] }[] = [
  {
    header: "Move",
    keys: [
      { keys: ["↓", "j"], label: "Next row" },
      { keys: ["↑", "k"], label: "Previous row" },
      { keys: ["[", "]"], label: "Previous or next repo" },
    ],
  },
  {
    header: "Open",
    keys: [
      { keys: ["Enter", "→", "l"], label: "Open the batch, or read it in the pane" },
      { keys: ["Esc", "←", "h"], label: "Back a level, or clear the selection" },
    ],
  },
  {
    header: "Act",
    keys: [
      { keys: ["c"], label: "Copy the pick-up, or a batch's next" },
      { keys: ["o"], label: "Open on GitHub" },
      { keys: ["r"], label: "Refresh the board" },
      { keys: ["?"], label: "These shortcuts" },
    ],
  },
]

/** One key as a keycap: a hairline slab, the key in mono. */
export function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-app-control border border-app-separator bg-app-group px-1.5 font-mono text-app-caption text-app-label-2">
      {children}
    </kbd>
  )
}

export function BoardKeysSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Opened by a key, not a trigger, so Radix has nowhere to send focus back
  // to on close; the sheet remembers where it was and returns it there.
  const returnTo = useRef<HTMLElement | null>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onOpenAutoFocus={() => {
          returnTo.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnTo.current?.focus({ preventScroll: true })
        }}
      >
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>
            On a desktop, anywhere on the board — except while you&apos;re typing
            or a menu is open.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-app-section">
          {GROUPS.map((group) => (
            <GroupedSection key={group.header} header={group.header}>
              {group.keys.map((row) => (
                <GroupedRow
                  key={row.label}
                  label={row.label}
                  chevron={false}
                  accessory={
                    <span className="flex shrink-0 items-center gap-1">
                      {row.keys.map((key) => (
                        <Keycap key={key}>{key}</Keycap>
                      ))}
                    </span>
                  }
                />
              ))}
            </GroupedSection>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
