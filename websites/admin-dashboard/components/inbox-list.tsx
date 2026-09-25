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
import { useRouter } from "next/navigation"
import { ChevronRight, RefreshCw, Search } from "lucide-react"

import {
  DeskButton,
  Kbd,
  Pane,
  PaneBody,
  PaneHeader,
  Skeleton,
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
import { refreshGates } from "@/app/(app)/board-actions"
import { AppMenu } from "@/components/app-menu"
import { usePaletteOpener } from "@/components/command-palette"
import {
  GateDetail,
  InboxDetail,
  type InboxHandlers,
} from "@/components/inbox-detail"
import { setLiveInboxCount } from "@/components/inbox-live-count"
import { GateRowItem, InboxRowItem } from "@/components/inbox-row"
import type { InboxRead } from "@/lib/inbox"
import type {
  GateRow,
  GatesRead,
  InboxKind,
  InboxMore,
  InboxRow,
} from "@/lib/inbox-row"

// The Inbox — a fast queue of what waits on Jamie (D-13): Gates and PRs at
// its head (D-14), then the follow-ups he still owes by hand (D-15).
//
// The server reads the follow-ups once (lib/inbox.ts) and hands them over as
// plain data; the gates (lib/gates.ts) arrive as a promise that lands when
// GitHub answers, so the follow-ups never wait on it. Everything from there —
// the folds, one selection across both groups, the keys, a follow-up leaving
// the list the moment it is cleared — happens here. A gate row is never
// cleared here: it leaves when GitHub stops showing it waiting. A cleared row is
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

// Each group's fold, remembered in this browser. Storage can be missing or
// refuse (a private window, blocked site data), so a copy in memory keeps the
// fold working for the visit either way.
const FOLD_KEYS = {
  follow: "jn-admin:inbox:follow-ups-folded",
  gates: "jn-admin:inbox:gates-folded",
} as const
type FoldGroup = keyof typeof FOLD_KEYS
const FOLD_EVENT = "jn-admin:inbox-fold"
const foldInMemory: Record<FoldGroup, boolean> = { follow: false, gates: false }

function subscribeFold(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(FOLD_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(FOLD_EVENT, onChange)
  }
}

function readFold(group: FoldGroup): boolean {
  try {
    return window.localStorage.getItem(FOLD_KEYS[group]) === "1"
  } catch {
    return foldInMemory[group]
  }
}

function writeFold(group: FoldGroup, folded: boolean) {
  foldInMemory[group] = folded
  try {
    if (folded) window.localStorage.setItem(FOLD_KEYS[group], "1")
    else window.localStorage.removeItem(FOLD_KEYS[group])
  } catch {
    // The copy in memory carries it.
  }
  window.dispatchEvent(new Event(FOLD_EVENT))
}

/** One entry of the queue, whichever group it sits in. */
type Item =
  | { group: "gates"; row: GateRow }
  | { group: "follow"; row: InboxRow }

/** "09:42" — when the gates read finished, in this browser's clock. */
function asOf(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
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

export function InboxQueue({
  read,
  gates,
}: {
  read: InboxRead
  /** Streamed: the gates land when GitHub answers, never before the rest. */
  gates: Promise<GatesRead>
}) {
  const rows = read.ok ? read.rows : []
  const more: InboxMore = read.ok
    ? read.more
    : { outreach: 0, waiting: 0, wake: 0 }

  const desk = useDesk()
  const router = useRouter()
  const folded = useSyncExternalStore(
    subscribeFold,
    () => readFold("follow"),
    () => false
  )
  const gatesFolded = useSyncExternalStore(
    subscribeFold,
    () => readFold("gates"),
    () => false
  )
  const [, startTransition] = useTransition()
  const [refreshing, startRefresh] = useTransition()

  // The gates, once GitHub has answered. A re-render after a write or a
  // refresh hands over a fresh promise; the rows on screen stay until it
  // lands, so the group never blinks back to its loading line.
  const [gateRead, setGateRead] = useState<GatesRead | null>(null)
  useEffect(() => {
    let live = true
    gates.then(
      (next) => {
        if (live) setGateRead(next)
      },
      () => {
        if (live) setGateRead({ state: "failed", message: "the read failed" })
      }
    )
    return () => {
      live = false
    }
  }, [gates])
  const gateRows = gateRead?.state === "ok" ? gateRead.rows : []
  const [removed, remove] = useOptimistic<string[], string>([], (keys, key) => [
    ...keys,
    key,
  ])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [logKey, setLogKey] = useState<string | null>(null)

  const visible = rows.filter((row) => !removed.includes(row.key))
  const all: Item[] = [
    ...gateRows.map((row) => ({ group: "gates" as const, row })),
    ...visible.map((row) => ({ group: "follow" as const, row })),
  ]
  // What j / k walk: the rows of the groups that are open.
  const shown: Item[] = [
    ...(gatesFolded ? [] : gateRows.map((row) => ({ group: "gates" as const, row }))),
    ...(folded ? [] : visible.map((row) => ({ group: "follow" as const, row }))),
  ]
  // At the desk the pane always shows something: the selection, or the
  // queue's first row until the operator picks one — so the first gate is
  // selected when the group lands, and the selection never jumps after that.
  const deskItem =
    all.find((item) => item.row.key === selectedKey) ?? all[0] ?? null
  const deskRow = deskItem?.group === "follow" ? deskItem.row : null

  const paneRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())

  /** The row the selection moves to when `key` leaves the list — a visible
   *  one, never a row inside a folded group. */
  function neighbourOf(key: string): string | null {
    const index = shown.findIndex((item) => item.row.key === key)
    if (index === -1) return selectedKey
    return (shown[index + 1] ?? shown[index - 1])?.row.key ?? null
  }

  const handlers: InboxHandlers = {
    clear(row, run, done, failed) {
      const current = desk ? deskItem?.row.key : selectedKey
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
      // Known before any write: a dated row with no step has nothing to move
      // (D-35), so the row, the selection and an open form all stay put.
      if (row.kind === "outreach" && !row.hasStep) {
        toast.error(
          `No step was decided for ${row.name} — open them and decide one.`
        )
        return
      }
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

  // j / k move, ↵ the primary, e done, s tomorrow, ⌘↵ a gate's launch — at
  // the desk only, and never while typing, while anything floats, or with a
  // modifier held (⌘↵ aside). A gate row has no done and no tomorrow.
  const keys = useRef<(event: KeyboardEvent) => boolean>(() => false)
  useEffect(() => {
    keys.current = (event) => {
      if (shown.length === 0 || !deskItem) return false
      const index = shown.findIndex((item) => item.row.key === deskItem.row.key)
      switch (event.key) {
        case "j":
        case "ArrowDown": {
          const next = shown[Math.min(index + 1, shown.length - 1)]
          if (next) setSelectedKey(next.row.key)
          return true
        }
        case "k":
        case "ArrowUp": {
          const prev = shown[Math.max(index - 1, 0)]
          if (prev) setSelectedKey(prev.row.key)
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
          if (!deskRow) return false
          if (deskRow.kind === "outreach") handlers.openLog(deskRow)
          else if (deskRow.kind === "waiting") handlers.touched(deskRow)
          else handlers.wake(deskRow)
          return true
        case "s":
          if (!deskRow || deskRow.kind === "waiting") return false
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
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(TEXT_FIELD)) return
      if (document.querySelector(OVERLAY)) return
      // ⌘↵ (Ctrl↵ off a Mac) — the selected gate's launch, where it has one.
      // Not on a focused link or button: there ⌘↵ is the browser's own
      // "open in a new tab", and it stays that.
      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (target?.closest(ACTIVATABLE)) return
        const launch = paneRef.current?.querySelector<HTMLElement>(
          "[data-inbox-launch]"
        )
        if (launch) {
          event.preventDefault()
          launch.click()
        }
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return
      }
      if (event.key === "Enter" && target?.closest(ACTIVATABLE)) return
      if (keys.current(event)) event.preventDefault()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Keep the keyboard's selection on screen.
  const deskKey = desk ? deskItem?.row.key : undefined
  useEffect(() => {
    if (deskKey) {
      rowRefs.current.get(deskKey)?.scrollIntoView({ block: "nearest" })
    }
  }, [deskKey])

  const moreLines = (Object.keys(MORE_LINE) as InboxKind[]).filter(
    (kind) => more[kind] > 0
  )
  // "Nothing needs you" only once the gates have answered: an empty
  // follow-ups group with GitHub still reading is not a quiet day yet.
  const empty =
    read.ok && visible.length === 0 && gateRead !== null && gateRows.length === 0
  const waiting = (read.ok ? visible.length : 0) + gateRows.length
  const countKnown = read.ok || gateRead?.state === "ok"

  // The rail's and the tab bar's badge (components/nav.tsx): the same rule
  // (lib/inbox.ts → countInbox) computed from what this screen already read,
  // so it stays exact while the Inbox is open — cleared on unmount, so
  // leaving falls back to the layout's streamed count rather than freezing.
  useEffect(() => {
    setLiveInboxCount(countKnown ? waiting : undefined)
    return () => setLiveInboxCount(undefined)
  }, [countKnown, waiting])

  function onRefresh() {
    startRefresh(async () => {
      try {
        await refreshGates()
        router.refresh()
      } catch {
        toast.error("Couldn't refresh from GitHub")
      }
    })
  }

  function pick(key: string, isOpen: boolean) {
    if (!desk && isOpen) setSelectedKey(null)
    else setSelectedKey(key)
    if (logKey !== key) setLogKey(null)
  }

  const rowRef = (key: string) => (node: HTMLButtonElement | null) => {
    if (node) rowRefs.current.set(key, node)
    else rowRefs.current.delete(key)
  }

  return (
    <div className="desk-tier flex flex-col lg:-mb-8 lg:h-dvh lg:flex-row">
      <Pane
        aria-label="Inbox"
        className="max-lg:border-r-0 lg:w-2/5 lg:max-w-xl lg:min-w-96 lg:shrink-0"
      >
        <PaneHeader
          title="Inbox"
          titleAs="h1"
          meta={
            countKnown ? (
              <>
                {waiting} waiting on you
                {gateRead?.state === "ok" ? (
                  <span className="text-desk-fg-3">
                    {" "}
                    · as of {asOf(gateRead.readAt)}
                  </span>
                ) : null}
              </>
            ) : undefined
          }
          actions={
            <>
              <DeskButton
                variant="ghost"
                size="icon"
                aria-label="Refresh from GitHub"
                title="Refresh from GitHub"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  aria-hidden
                  className={cn(refreshing && "motion-safe:animate-spin")}
                />
              </DeskButton>
              <PhoneChrome />
            </>
          }
        />
        <PaneBody>
          <GatesGroup
            read={gateRead}
            folded={gatesFolded}
            desk={desk}
            selectedKey={desk ? deskItem?.row.key ?? null : selectedKey}
            onPick={(row) => pick(row.key, !desk && selectedKey === row.key)}
            rowRef={rowRef}
          />
          {!read.ok ? (
            <p role="alert" className="px-5 py-6 text-desk-body">
              Couldn&apos;t read the database, so the follow-ups can&apos;t be
              listed — {read.error}
            </p>
          ) : empty ? (
            <div className="flex flex-col items-center gap-1.5 px-6 py-20 text-center">
              <p className="text-desk-heading">Nothing needs you</p>
              <p className="text-desk-body text-desk-fg-3">
                {gateRead?.state === "ok"
                  ? "Every gate is ticked and every follow-up is done. Work is where the day goes now."
                  : "Every follow-up is done. Work is where the day goes now."}
              </p>
            </div>
          ) : visible.length === 0 ? null : (
            <section aria-label="Follow-ups">
              <GroupHeader
                label="Follow-ups"
                count={visible.length}
                folded={folded}
                onToggle={() => writeFold("follow", !folded)}
              />
              {folded ? null : (
                <>
                  <ul>
                    {visible.map((row) => (
                      <InboxRowItem
                        key={row.key}
                        row={row}
                        desk={desk}
                        selected={
                          desk ? row.key === deskItem?.row.key : row.key === selectedKey
                        }
                        logging={logKey === row.key}
                        handlers={handlers}
                        onPick={() => pick(row.key, !desk && selectedKey === row.key)}
                        rowRef={rowRef(row.key)}
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
          <Kbd keys={["⌘", "↵"]} />
          <span className="mr-2">launch</span>
          <Kbd keys={["⌘", "K"]} />
          <span>jump</span>
        </div>
      </Pane>

      <Pane aria-label="Selected item" className="hidden flex-1 lg:flex">
        <PaneBody ref={paneRef}>
          {deskItem?.group === "gates" ? (
            <GateDetail key={deskItem.row.key} row={deskItem.row} />
          ) : deskRow ? (
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

/** A group's header row: the chevron, the label, the count; activating it
 *  folds or unfolds the group. */
function GroupHeader({
  label,
  count,
  folded,
  onToggle,
}: {
  label: string
  count: number
  folded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!folded}
      className="flex h-desk-row w-full items-center gap-2 border-b border-desk-line bg-desk-hover px-5 text-left"
    >
      <ChevronRight
        aria-hidden
        className={cn("size-3 text-desk-fg-3", !folded && "rotate-90")}
      />
      <span className="flex-1 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-2 uppercase">
        {label}
      </span>
      <span className="font-mono text-desk-micro text-desk-fg-3 tabular-nums">
        {count}
      </span>
    </button>
  )
}

/**
 * Gates and PRs, at the head of the queue (D-14). A loading line until GitHub
 * answers; one muted line in the group's place when it can't be read; nothing
 * at all on a day with no gates — and otherwise its rows, with a quiet foot
 * naming any repo that couldn't be read.
 */
function GatesGroup({
  read,
  folded,
  desk,
  selectedKey,
  onPick,
  rowRef,
}: {
  read: GatesRead | null
  folded: boolean
  desk: boolean
  selectedKey: string | null
  onPick: (row: GateRow) => void
  rowRef: (key: string) => (node: HTMLButtonElement | null) => void
}) {
  if (read === null) {
    return (
      <div
        aria-busy
        className="flex min-h-desk-row items-center gap-3 border-b border-desk-line px-5 py-2"
      >
        <span className="font-mono text-desk-micro text-desk-fg-3">
          Reading GitHub
        </span>
        <Skeleton className="h-3 flex-1" />
      </div>
    )
  }
  if (read.state !== "ok") {
    return (
      <p className="border-b border-desk-line px-5 py-3 text-desk-meta text-desk-fg-3">
        {read.state === "unconfigured"
          ? "GitHub isn't configured here, so gates and PRs can't be read."
          : `Couldn't read GitHub — ${read.message}`}
      </p>
    )
  }
  if (read.rows.length === 0 && read.notes.length === 0) return null

  return (
    <section aria-label="Gates and PRs">
      <GroupHeader
        label="Gates and PRs"
        count={read.rows.length}
        folded={folded}
        onToggle={() => writeFold("gates", !folded)}
      />
      {folded ? null : (
        <>
          <ul>
            {read.rows.map((row) => (
              <GateRowItem
                key={row.key}
                row={row}
                desk={desk}
                selected={row.key === selectedKey}
                onPick={() => onPick(row)}
                rowRef={rowRef(row.key)}
              />
            ))}
          </ul>
          {read.notes.length > 0 ? (
            <div className="flex flex-col gap-1 px-5 py-3 text-desk-meta text-desk-fg-3">
              {read.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
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
