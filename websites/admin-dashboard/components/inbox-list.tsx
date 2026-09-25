"use client"

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"

import {
  DeskButton,
  Kbd,
  Pane,
  PaneBody,
  PaneHeader,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  markTouched,
  moveNextStepToTomorrow,
  pushWake,
  wakeProspect,
  wakeTomorrow,
} from "@/app/(app)/actions"
import { AppMenu } from "@/components/app-menu"
import { usePaletteOpener } from "@/components/command-palette"
import { InboxDetail, type InboxHandlers } from "@/components/inbox-detail"
import { InboxRowItem } from "@/components/inbox-row"
import type { InboxRead } from "@/lib/inbox"
import type { InboxKind, InboxMore } from "@/lib/inbox-row"

// The Inbox — a fast queue of what Jamie still owes by hand (D-13, D-15).
//
// The server reads the rows once (lib/inbox.ts) and hands them over as plain
// data; everything from there — the fold, the selection, the keys, a row
// leaving the list the moment it is cleared — happens here. A cleared row is
// removed optimistically; the write revalidates /inbox, and the fresh read
// that lands with it is the truth: a woken lead comes back as an outreach row,
// an outreach row whose touch was logged without a new step stays, and a
// failed write puts the row back with a toast saying what didn't happen.
//
// From `lg` the list and a detail pane sit side by side (D-34) and the
// keyboard works; below it a row opens in place, one at a time.

/** Tailwind's `lg` — where the detail pane and the keys begin. */
const DESK_QUERY = "(min-width: 64rem)"

function subscribeDesk(onChange: () => void) {
  const query = window.matchMedia(DESK_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** Re-read on every change of the breakpoint, never once on mount. */
function useDesk(): boolean {
  return useSyncExternalStore(
    subscribeDesk,
    () => window.matchMedia(DESK_QUERY).matches,
    () => false
  )
}

// The group's fold, remembered in this browser. Storage can be missing or
// refuse (a private window, blocked site data), so a copy in memory keeps the
// fold working for the visit either way.
const FOLD_KEY = "jn-admin:inbox:follow-ups-folded"
const FOLD_EVENT = "jn-admin:inbox-fold"
let foldInMemory = false

function subscribeFold(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(FOLD_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(FOLD_EVENT, onChange)
  }
}

function readFold(): boolean {
  try {
    return window.localStorage.getItem(FOLD_KEY) === "1"
  } catch {
    return foldInMemory
  }
}

function writeFold(folded: boolean) {
  foldInMemory = folded
  try {
    if (folded) window.localStorage.setItem(FOLD_KEY, "1")
    else window.localStorage.removeItem(FOLD_KEY)
  } catch {
    // The copy in memory carries it.
  }
  window.dispatchEvent(new Event(FOLD_EVENT))
}

/** Where a keypress is typing, not a command. */
const TEXT_FIELD =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
/** Anything that floats over the screen and owns the keys while it is open —
 *  the command palette included. Radix mounts these only while open. */
const OVERLAY = '[role="menu"], [role="dialog"], [role="alertdialog"]'
/** Controls whose own Enter is theirs. */
const ACTIVATABLE = 'button, a[href], summary, [role="menuitem"]'

/** A refusal the server put into words — shown as it is, not as "failed". */
class RefusedError extends Error {}

const MORE_LINE: Record<InboxKind, (n: number) => string> = {
  outreach: (n) =>
    `${n} more outreach ${n === 1 ? "step is" : "steps are"} due — they take the freed places as these clear.`,
  waiting: (n) =>
    `${n} more open ${n === 1 ? "lead has" : "leads have"} gone quiet —`,
  wake: (n) => `${n} more ${n === 1 ? "wake is" : "wakes are"} due.`,
}

export function InboxQueue({ read }: { read: InboxRead }) {
  const rows = read.ok ? read.rows : []
  const more: InboxMore = read.ok
    ? read.more
    : { outreach: 0, waiting: 0, wake: 0 }

  const desk = useDesk()
  const folded = useSyncExternalStore(subscribeFold, readFold, () => false)
  const [, startTransition] = useTransition()
  const [removed, remove] = useOptimistic<string[], string>([], (keys, key) => [
    ...keys,
    key,
  ])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [logKey, setLogKey] = useState<string | null>(null)

  const visible = rows.filter((row) => !removed.includes(row.key))
  const shown = folded ? [] : visible
  // At the desk the pane always shows something: the selection, or the first
  // row once the selection has left the list.
  const deskRow =
    visible.find((row) => row.key === selectedKey) ?? visible[0] ?? null

  const paneRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())

  /** The row the selection moves to when `key` leaves the list. */
  function neighbourOf(key: string): string | null {
    const index = visible.findIndex((row) => row.key === key)
    if (index === -1) return selectedKey
    return (visible[index + 1] ?? visible[index - 1])?.key ?? null
  }

  const handlers: InboxHandlers = {
    clear(row, run, done, failed) {
      const current = desk ? deskRow?.key : selectedKey
      if (current === row.key) setSelectedKey(desk ? neighbourOf(row.key) : null)
      if (logKey === row.key) setLogKey(null)
      startTransition(async () => {
        remove(row.key)
        try {
          await run()
          toast(done)
        } catch (err) {
          toast.error(err instanceof RefusedError ? err.message : failed)
        }
      })
    },
    touched(row) {
      // A stale lead is cleared by being worked. An outreach row is not: its
      // step is still due, so the row stays and the toast says why.
      if (row.kind === "waiting") {
        handlers.clear(
          row,
          () => markTouched(row.id),
          `Marked ${row.name} as worked today`,
          `Couldn't mark ${row.name} touched`
        )
        return
      }
      startTransition(async () => {
        try {
          await markTouched(row.id)
          toast(`Marked ${row.name} touched — the step is still due`)
        } catch {
          toast.error(`Couldn't mark ${row.name} touched`)
        }
      })
    },
    tomorrow(row) {
      if (row.kind === "waiting") return
      handlers.clear(
        row,
        row.kind === "wake"
          ? () => wakeTomorrow(row.id)
          : async () => {
              const result = await moveNextStepToTomorrow(row.id)
              if (!result.ok) throw new RefusedError(result.message)
            },
        row.kind === "wake"
          ? `${row.name} wakes tomorrow`
          : `Moved ${row.name}'s step to tomorrow`,
        `Couldn't move ${row.name} to tomorrow`
      )
    },
    wake(row) {
      handlers.clear(
        row,
        () => wakeProspect(row.id),
        `Woke ${row.name} — back on today's outreach`,
        `Couldn't wake ${row.name}`
      )
    },
    later(row) {
      handlers.clear(
        row,
        () => pushWake(row.id),
        `${row.name} wakes again in 90 days`,
        `Couldn't push ${row.name}'s wake`
      )
    },
    openLog(row) {
      setSelectedKey(row.key)
      setLogKey(row.key)
    },
    closeLog() {
      setLogKey(null)
    },
  }

  // j / k move, ↵ the primary, e done, s tomorrow — at the desk only, and
  // never while typing, while anything floats, or with a modifier held.
  const keys = useRef<(event: KeyboardEvent) => boolean>(() => false)
  useEffect(() => {
    keys.current = (event) => {
      if (shown.length === 0 || !deskRow) return false
      const index = shown.findIndex((row) => row.key === deskRow.key)
      switch (event.key) {
        case "j":
        case "ArrowDown": {
          const next = shown[Math.min(index + 1, shown.length - 1)]
          if (next) setSelectedKey(next.key)
          return true
        }
        case "k":
        case "ArrowUp": {
          const prev = shown[Math.max(index - 1, 0)]
          if (prev) setSelectedKey(prev.key)
          return true
        }
        case "Enter": {
          const primary = paneRef.current?.querySelector<HTMLElement>(
            "[data-inbox-primary]"
          )
          primary?.click()
          return primary != null
        }
        case "e":
          if (deskRow.kind === "outreach") handlers.openLog(deskRow)
          else if (deskRow.kind === "waiting") handlers.touched(deskRow)
          else handlers.wake(deskRow)
          return true
        case "s":
          if (deskRow.kind === "waiting") return false
          handlers.tomorrow(deskRow)
          return true
        default:
          return false
      }
    }
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!window.matchMedia(DESK_QUERY).matches) return
      if (event.defaultPrevented || event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return
      }
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(TEXT_FIELD)) return
      if (document.querySelector(OVERLAY)) return
      if (event.key === "Enter" && target?.closest(ACTIVATABLE)) return
      if (keys.current(event)) event.preventDefault()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Keep the keyboard's selection on screen.
  const deskKey = desk ? deskRow?.key : undefined
  useEffect(() => {
    if (deskKey) {
      rowRefs.current.get(deskKey)?.scrollIntoView({ block: "nearest" })
    }
  }, [deskKey])

  const empty = read.ok && visible.length === 0
  const moreLines = (Object.keys(MORE_LINE) as InboxKind[]).filter(
    (kind) => more[kind] > 0
  )

  return (
    <div className="desk-tier flex flex-col lg:-mb-8 lg:h-dvh lg:flex-row">
      <Pane
        aria-label="Inbox"
        className="max-lg:border-r-0 lg:w-2/5 lg:max-w-xl lg:min-w-96 lg:shrink-0"
      >
        <PaneHeader
          title="Inbox"
          titleAs="h1"
          meta={read.ok ? `${visible.length} waiting on you` : undefined}
          actions={<PhoneChrome />}
        />
        <PaneBody>
          {!read.ok ? (
            <p role="alert" className="px-5 py-6 text-desk-body">
              Couldn&apos;t read the database, so the follow-ups can&apos;t be
              listed — {read.error}
            </p>
          ) : empty ? (
            <div className="flex flex-col items-center gap-1.5 px-6 py-20 text-center">
              <p className="text-desk-heading">Nothing needs you</p>
              <p className="text-desk-body text-desk-fg-3">
                Every follow-up is done. Work is where the day goes now.
              </p>
            </div>
          ) : (
            <section aria-label="Follow-ups">
              <button
                type="button"
                onClick={() => writeFold(!folded)}
                aria-expanded={!folded}
                className="flex h-desk-row w-full items-center gap-2 border-b border-desk-line bg-desk-hover px-5 text-left"
              >
                <ChevronRight
                  aria-hidden
                  className={cn(
                    "size-3 text-desk-fg-3",
                    !folded && "rotate-90"
                  )}
                />
                <span className="flex-1 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-2 uppercase">
                  Follow-ups
                </span>
                <span className="font-mono text-desk-micro text-desk-fg-3 tabular-nums">
                  {visible.length}
                </span>
              </button>
              {folded ? null : (
                <>
                  <ul>
                    {shown.map((row) => (
                      <InboxRowItem
                        key={row.key}
                        row={row}
                        desk={desk}
                        selected={
                          desk ? row.key === deskRow?.key : row.key === selectedKey
                        }
                        logging={logKey === row.key}
                        handlers={handlers}
                        onPick={() => {
                          if (!desk && selectedKey === row.key) {
                            setSelectedKey(null)
                          } else {
                            setSelectedKey(row.key)
                          }
                          if (logKey !== row.key) setLogKey(null)
                        }}
                        rowRef={(node) => {
                          if (node) rowRefs.current.set(row.key, node)
                          else rowRefs.current.delete(row.key)
                        }}
                      />
                    ))}
                  </ul>
                  {moreLines.length > 0 ? (
                    <div className="flex flex-col gap-1 px-5 py-3 text-desk-meta text-desk-fg-3">
                      {moreLines.map((kind) => (
                        <p key={kind}>
                          {MORE_LINE[kind](more[kind])}
                          {kind === "waiting" ? (
                            <>
                              {" "}
                              <Link
                                href="/leads?filter=open"
                                className="text-desk-fg underline underline-offset-2"
                              >
                                see them on Leads
                              </Link>
                              .
                            </>
                          ) : null}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </section>
          )}
        </PaneBody>
        <div className="hidden h-desk-toolbar shrink-0 items-center gap-1.5 border-t border-desk-line px-5 text-desk-micro text-desk-fg-3 lg:flex">
          <Kbd>j</Kbd>
          <Kbd>k</Kbd>
          <span className="mr-2">move</span>
          <Kbd>↵</Kbd>
          <span className="mr-2">primary</span>
          <Kbd>e</Kbd>
          <span className="mr-2">done</span>
          <Kbd>s</Kbd>
          <span className="mr-2">tomorrow</span>
          <Kbd keys={["⌘", "K"]} />
          <span>jump</span>
        </div>
      </Pane>

      <Pane aria-label="Follow-up" className="hidden flex-1 lg:flex">
        <PaneBody ref={paneRef}>
          {deskRow ? (
            <InboxDetail
              key={deskRow.key}
              row={deskRow}
              handlers={handlers}
              logging={logKey === deskRow.key}
            />
          ) : null}
        </PaneBody>
      </Pane>
    </div>
  )
}

/** On the phone the screen's header carries what the rail carries at the
 *  desk: the palette and the app menu. From `md` the rail has both. */
function PhoneChrome() {
  const openPalette = usePaletteOpener()
  return (
    <div className="flex items-center gap-1 md:hidden">
      {openPalette ? (
        <DeskButton
          variant="ghost"
          size="icon"
          aria-label="Go anywhere"
          onClick={openPalette}
        >
          <Search aria-hidden />
        </DeskButton>
      ) : null}
      <AppMenu />
    </div>
  )
}
