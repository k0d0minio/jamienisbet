"use client"

import { useRef } from "react"

import {
  RecordRow,
  RecordSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jamie-nisbet/ui"

// Work's keyboard map at the desk, said once, where `?` opens it (the keys
// themselves: components/use-board-keys.ts, acted on in work-desk.tsx). Three
// groups in the order you reach for them: move within a pane, move between
// panes, act on what is open.

const GROUPS: { header: string; keys: { keys: string[]; label: string }[] }[] = [
  {
    header: "Move",
    keys: [
      { keys: ["↓", "j"], label: "Next row in this pane" },
      { keys: ["↑", "k"], label: "Previous row in this pane" },
      { keys: ["[", "]"], label: "Previous or next view or epic" },
    ],
  },
  {
    header: "Open",
    keys: [
      { keys: ["Enter", "→", "l"], label: "Open it, and move a pane right" },
      { keys: ["Esc", "←", "h"], label: "Move a pane left, or close the ticket" },
    ],
  },
  {
    header: "Act",
    keys: [
      { keys: ["⌘", "↵"], label: "Launch the open ticket (Ctrl+↵ off a Mac)" },
      { keys: ["c"], label: "Copy the pick-up, or an epic's next" },
      { keys: ["o"], label: "Open on GitHub" },
      { keys: ["r"], label: "Refresh the board" },
      { keys: ["?"], label: "These shortcuts" },
    ],
  },
]

/** One key as a keycap: a hairline slab, the key in mono. */
export function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-desk-control border border-desk-line bg-desk-surface px-1.5 font-mono text-desk-meta text-desk-fg-2">
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
            At the desk, anywhere on Work — except while you&apos;re typing or a
            menu is open.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-6">
          {GROUPS.map((group) => (
            <RecordSection key={group.header} header={group.header}>
              {group.keys.map((row) => (
                <RecordRow
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
            </RecordSection>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
