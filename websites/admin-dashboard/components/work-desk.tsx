"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { ChevronRight, TriangleAlert } from "lucide-react"

import {
  Kbd,
  ListRow,
  Pane,
  PaneBody,
  PaneHeader,
  PriorityTag,
  StatusDot,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { BoardKeysSheet } from "@/components/board-keys-sheet"
import {
  boardFigures,
  copyTarget,
  githubUrl,
  repoFigures,
  selectionKey,
  ticketsInGroup,
  type ListBatch,
  type ListSection,
} from "@/components/board-model"
import { BoardRefresh, requestBoardRefresh } from "@/components/board-refresh"
import { EpicMeter, ReaderBody, ReaderHead } from "@/components/ticket-reader"
import { useBoardKeys, type BoardKeyIntent } from "@/components/use-board-keys"
import { useBoardParams, type BoardQuery } from "@/components/use-board-params"
import { useWorkLive } from "@/components/work-screen"
import { DeskBatchView, DeskEstateOverview, DeskRepoView } from "@/components/work-views"
import {
  WORK_VIEWS,
  entryQuery,
  listKey,
  listQuery,
  navEntries,
  paneRows,
  paneSelection,
  resolveWork,
  rowNote,
  type NavEntry,
  type PaneRow,
  type WorkList,
  type WorkSelection,
} from "@/components/work-model"
import { copyToClipboard } from "@/lib/clipboard"
import { primaryAction } from "@/lib/launchers"
import type { BoardData, MaintenanceLauncher } from "@/lib/tickets"

// Work at the desk — three panes (D-7, spec work-panes): the views and the
// repos, the list the URL has open, and the detail of what is selected in it.
// Mounted from `lg` only (work-screen.tsx); the phone's levels are under it
// (work-phone.tsx).
//
// The board is read once on the server and handed over as plain data, as the
// phone's is; every selection is URL state (use-board-params.ts),
// resolved on every render (work-model.ts `resolveWork`) — so a deep link
// restores the list and the ticket, back/forward step through them, and a
// click needs no request. Pane three is the reader for a ticket
// (ticket-reader.tsx, spec work-reader) and the desk's batch, repo and
// overview views otherwise (work-views.tsx).
//
// The keyboard (use-board-keys.ts; `?` lists it): each pane has a cursor and
// the focused pane is the one that moves. In pane two the cursor *is* the
// selection — each step rewrites `?t=` in place, so the reader follows and
// back doesn't replay every row passed. Enter opens and moves focus a pane
// right, Esc moves it a pane left, and ⌘↵ presses the reader's primary act —
// Launch, or Copy prompt when no link can carry it — from any pane.
//
// Read-only by design: every button copies a prompt, opens a tool with it,
// or links out; a human sends it.

/** How far `j`/`k` scroll the detail pane when it has focus. */
const READER_STEP_PX = 64

/** Remembered in this browser: which repos the operator folded or unfolded.
 *  A convenience — a private window or cleared storage just starts folded. */
const FOLDS_KEY = "jn:work:folds"

const navOptionId = (index: number) => `work-nav-${index}`
const rowOptionId = (index: number) => `work-row-${index}`

/** A listbox pane's focus ring: the tier's inset outline. */
const LISTBOX = "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-desk-focus"

type PaneIndex = 1 | 2 | 3

// The folds live in the browser, so they are read as an external store: the
// server and hydration render with nothing remembered, the browser's answer
// arrives right after, and a fold made in another tab follows. Where storage
// refuses (a private window, a full quota) they are kept for this visit.
const FOLDS_EVENT = "jn:work-folds"
let foldsInMemory: string | null = null

function subscribeFolds(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(FOLDS_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(FOLDS_EVENT, onChange)
  }
}

function foldsSnapshot(): string | null {
  try {
    return window.localStorage.getItem(FOLDS_KEY) ?? foldsInMemory
  } catch {
    return foldsInMemory
  }
}

function parseFolds(raw: string | null): Record<string, boolean> {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveFolds(folds: Record<string, boolean>) {
  const raw = JSON.stringify(folds)
  foldsInMemory = raw
  try {
    window.localStorage.setItem(FOLDS_KEY, raw)
  } catch {
    // Kept in memory for this visit instead.
  }
  window.dispatchEvent(new Event(FOLDS_EVENT))
}

/** The repo a selection sits in, if any — the one pane one unfolds unasked. */
function selectedRepo(selection: WorkSelection): string | null {
  if (selection.ticket) return selection.ticket.section.repo.slug
  const { list } = selection
  if (list.kind === "batch") return list.section.repo.slug
  if (list.kind === "repo") return list.focus.repo.slug
  return null
}

// ---------------------------------------------------------------------------
// Pane one — the views, then the repos.

function NavPane({
  entries,
  current,
  cursor,
  expanded,
  rosterError,
  quiet,
  listRef,
  onOpen,
  onToggle,
}: {
  entries: NavEntry[]
  /** The entry whose list is open in pane two. */
  current: string
  /** The entry the keyboard's cursor is on. */
  cursor: string | null
  expanded: (slug: string) => boolean
  rosterError: string | null
  /** No repo holds an intake, and none failed: nothing to list. */
  quiet: boolean
  listRef: React.RefObject<HTMLDivElement | null>
  onOpen: (entry: NavEntry) => void
  onToggle: (slug: string) => void
}) {
  const active = entries.findIndex((e) => e.key === cursor)
  const firstRepo = entries.findIndex((e) => e.kind !== "view")
  return (
    <Pane aria-label="Views and repos" className="w-52 shrink-0 bg-desk-hover xl:w-58">
      <PaneBody>
        <div
          ref={listRef}
          role="listbox"
          aria-label="Views and repos"
          aria-activedescendant={active === -1 ? undefined : navOptionId(active)}
          tabIndex={0}
          className={cn("flex flex-col py-2", LISTBOX)}
        >
          {entries.map((entry, index) => {
            const selected = entry.key === current
            const underCursor = entry.key === cursor
            const eyebrow = index === firstRepo
            if (entry.kind === "view") {
              const view = WORK_VIEWS.find((v) => v.view === entry.view)!
              return (
                <NavRow
                  key={entry.key}
                  id={navOptionId(index)}
                  selected={selected}
                  cursor={underCursor}
                  onClick={() => onOpen(entry)}
                  label={view.label}
                  figure={
                    <span
                      className={cn(
                        "font-mono text-desk-meta tabular-nums",
                        entry.view === "running" && entry.count > 0 && "text-desk-running",
                        entry.view === "blocked" && entry.count > 0 && "text-desk-blocked",
                        !(entry.count > 0 && (entry.view === "running" || entry.view === "blocked")) &&
                          "text-desk-fg-3"
                      )}
                    >
                      {entry.count}
                    </span>
                  }
                />
              )
            }
            return (
              <div key={entry.key} role="none">
                {eyebrow ? <ReposEyebrow rosterError={rosterError} /> : null}
                {entry.kind === "repo" ? (
                  <div role="none" className="flex items-center">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`${expanded(entry.slug) ? "Fold" : "Unfold"} ${entry.slug}`}
                      aria-expanded={entry.foldable ? expanded(entry.slug) : undefined}
                      disabled={!entry.foldable}
                      onClick={() => onToggle(entry.slug)}
                      className="ml-1.5 flex size-desk-control-sm shrink-0 items-center justify-center rounded-desk-control text-desk-fg-3 transition-colors duration-100 hover:bg-desk-sunken hover:text-desk-fg disabled:opacity-0"
                    >
                      <ChevronRight
                        aria-hidden
                        className={cn(
                          "size-desk-icon transition-transform duration-100 motion-reduce:transition-none",
                          expanded(entry.slug) && "rotate-90"
                        )}
                      />
                    </button>
                    <NavRow
                      id={navOptionId(index)}
                      selected={selected}
                      cursor={underCursor}
                      onClick={() => onOpen(entry)}
                      className="ml-0 flex-1 pl-1"
                      label={
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-mono text-desk-meta">{entry.slug}</span>
                          {entry.failed ? (
                            <StatusDot status="blocked" label="Couldn't be read" />
                          ) : null}
                        </span>
                      }
                      figure={
                        entry.failed && entry.open === 0 ? (
                          <span className="text-desk-micro text-desk-blocked">couldn&rsquo;t be read</span>
                        ) : (
                          <span className="font-mono text-desk-meta tabular-nums text-desk-fg-3">
                            {entry.open}
                          </span>
                        )
                      }
                    />
                  </div>
                ) : (
                  <NavRow
                    id={navOptionId(index)}
                    selected={selected}
                    cursor={underCursor}
                    onClick={() => onOpen(entry)}
                    className="pl-10"
                    label={<span className="truncate font-normal">{entry.title}</span>}
                    figure={
                      <span className="font-mono text-desk-meta tabular-nums text-desk-fg-3">
                        {entry.figure}
                      </span>
                    }
                  />
                )}
              </div>
            )
          })}
          {firstRepo === -1 ? (
            <>
              <ReposEyebrow rosterError={rosterError} />
              {quiet ? (
                <p className="px-3 py-2 text-desk-ui text-desk-fg-3">
                  No repo has an <span className="font-mono text-desk-meta">.icm/intake/</span> yet.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </PaneBody>
    </Pane>
  )
}

function ReposEyebrow({ rosterError }: { rosterError: string | null }) {
  return (
    <>
      <p
        role="presentation"
        className="mt-4 px-3 pb-1 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase"
      >
        Repos
      </p>
      {rosterError ? (
        // The owner sweep failed: the list below is the pinned repos alone,
        // and says so rather than passing for the whole estate.
        <p role="presentation" className="flex gap-2 px-3 pb-2 text-desk-micro text-desk-blocked">
          <TriangleAlert aria-hidden className="mt-px size-desk-check shrink-0" />
          <span>Only the pinned repos. {rosterError}</span>
        </p>
      ) : null}
    </>
  )
}

/** One pane-one row: a label and a mono figure, 32px, selected sunken. */
function NavRow({
  id,
  selected,
  cursor,
  onClick,
  label,
  figure,
  className,
}: {
  id: string
  selected: boolean
  cursor: boolean
  onClick: () => void
  label: React.ReactNode
  figure: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "mx-1.5 flex h-desk-row min-w-0 items-center gap-2 rounded-desk-control px-2.5 text-left text-desk-ui text-desk-fg transition-colors duration-100 hover:bg-desk-sunken",
        selected && "bg-desk-sunken font-semibold",
        cursor && !selected && "ring-1 ring-inset ring-desk-line-strong",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0">{figure}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Pane two — the list.

/** What a list is called, and its one mono line. */
function listHeading(list: WorkList): { title: React.ReactNode; meta: React.ReactNode } {
  switch (list.kind) {
    case "view": {
      const view = WORK_VIEWS.find((v) => v.view === list.view)!
      return { title: view.label, meta: view.description }
    }
    case "batch": {
      const { section, batch } = list
      const where = `${section.repo.slug}/${batch.slug === "_runs" ? "runs" : batch.slug}`
      return {
        title: batch.title,
        meta:
          batch.kind === "epic" && batch.planned !== null
            ? `${where} · ${batch.done} of ${batch.planned}`
            : `${section.repo.slug} · ${batch.tickets.length} open`,
      }
    }
    case "repo": {
      const { focus } = list
      return {
        title: <span className="font-mono">{focus.repo.slug}</span>,
        meta: `${focus.repo.clientName ?? "House repo"} · ${focus.section?.open ?? 0} open`,
      }
    }
  }
}

/** What an empty list says (spec work-panes §7) — calm, not broken. */
function emptyLine(list: WorkList): string {
  if (list.kind === "view") {
    switch (list.view) {
      case "next":
        return "Nothing runnable — every open stub waits on something, or the intake is empty."
      case "today":
        return "Nothing picked for today — /day in icm-board picks it."
      case "running":
        return "Nothing running."
      case "blocked":
        return "Nothing blocked."
    }
  }
  if (list.kind === "repo" && list.focus.error) return "This repo couldn't be read — its view says why."
  return "Nothing open here."
}

function ListPane({
  list,
  rows,
  selectedKey,
  partial,
  prUnread,
  listRef,
  onSelect,
  onHelp,
}: {
  list: WorkList
  rows: PaneRow[]
  selectedKey: string | null
  /** How many repos this list is missing because their read failed. */
  partial: number
  /** The repos whose pull requests couldn't be read — their running comes
   *  from run folders alone (spec work-reader §5). */
  prUnread: string[]
  listRef: React.RefObject<HTMLDivElement | null>
  onSelect: (key: string) => void
  onHelp: () => void
}) {
  const heading = listHeading(list)
  const selectable = rows.filter((r) => r.kind === "ticket")
  const activeIndex = selectable.findIndex((r) => r.key === selectedKey)
  // Each selectable row's option id is its place among the selectable rows —
  // the same index the keyboard steps through.
  const optionIndex = new Map(selectable.map((r, i) => [r.key, i]))
  return (
    <Pane aria-label="Tickets" className="w-80 shrink-0 xl:w-98">
      <PaneHeader title={heading.title} meta={heading.meta} className="px-4" />
      {list.kind === "batch" && list.batch.kind === "epic" && list.batch.planned ? (
        <EpicMeter done={list.batch.done} total={list.batch.planned} />
      ) : null}
      {partial > 0 && list.kind !== "batch" ? (
        <p className="flex items-center gap-2 border-b border-desk-line px-4 py-1.5 text-desk-micro text-desk-blocked">
          <TriangleAlert aria-hidden className="size-desk-check shrink-0" />
          {partial === 1 ? "1 repo couldn't be read" : `${partial} repos couldn't be read`}
        </p>
      ) : null}
      {prUnread.length > 0 ? (
        <p className="flex items-center gap-2 border-b border-desk-line px-4 py-1.5 text-desk-micro text-desk-running">
          <TriangleAlert aria-hidden className="size-desk-check shrink-0" />
          <span className="min-w-0 truncate">
            Pull requests couldn&rsquo;t be read for{" "}
            <span className="font-mono">{prUnread.join(", ")}</span> — running there is run folders only
          </span>
        </p>
      ) : null}
      <PaneBody>
        <div
          ref={listRef}
          role="listbox"
          aria-label={typeof heading.title === "string" ? heading.title : "Tickets"}
          aria-activedescendant={activeIndex === -1 ? undefined : rowOptionId(activeIndex)}
          tabIndex={0}
          className={cn("min-h-full", LISTBOX)}
        >
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-desk-ui text-desk-fg-3">{emptyLine(list)}</p>
          ) : null}
          {rows.map((row) => {
            if (row.kind === "heading") {
              return (
                <p
                  key={row.key}
                  role="presentation"
                  className="border-b border-desk-line bg-desk-hover px-4 pt-3 pb-1 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase"
                >
                  {row.title}
                </p>
              )
            }
            if (row.kind === "done") {
              return (
                <ListRow
                  key={row.key}
                  role="presentation"
                  done
                  className="px-4"
                  leading={<StatusDot status="done" />}
                  label={
                    <>
                      {row.sequence !== null ? (
                        <span className="mr-2 font-mono text-desk-meta">{row.sequence}</span>
                      ) : null}
                      {row.title}
                    </>
                  }
                />
              )
            }
            const id = rowOptionId(optionIndex.get(row.key) ?? 0)
            const { ticket } = row
            const selected = row.key === selectedKey
            const note = rowNote(ticket)
            if (row.line === null) {
              return (
                <ListRow
                  key={row.key}
                  id={id}
                  role="option"
                  selected={selected}
                  tabIndex={-1}
                  onClick={() => onSelect(row.key)}
                  className="px-4"
                  leading={<StatusDot status={ticket.status} label={note?.text} />}
                  label={
                    <>
                      {row.sequence !== null ? (
                        <span className="mr-2 font-mono text-desk-meta text-desk-fg-3">
                          {row.sequence}
                        </span>
                      ) : null}
                      {ticket.title}
                    </>
                  }
                  meta={
                    <>
                      {ticket.today ? <span>today</span> : null}
                      <PriorityTag priority={ticket.priority} />
                    </>
                  }
                />
              )
            }
            return (
              <button
                key={row.key}
                type="button"
                id={id}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => onSelect(row.key)}
                className={cn(
                  "flex min-h-desk-row w-full min-w-0 flex-col gap-0.5 border-b border-desk-line px-4 py-2 text-left transition-colors duration-100 hover:bg-desk-hover",
                  selected && "bg-desk-sunken hover:bg-desk-sunken"
                )}
              >
                <span className="flex w-full min-w-0 items-center gap-2.5">
                  <StatusDot status={ticket.status} label={note?.text} />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-desk-ui text-desk-fg",
                      selected && "font-semibold"
                    )}
                  >
                    {ticket.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-desk-micro text-desk-fg-3">
                    {ticket.today ? <span>today</span> : null}
                    <PriorityTag priority={ticket.priority} />
                  </span>
                </span>
                {/* Under the title, clear of the dot: where it lives, then
                    why it waits or what is running. */}
                <span className="w-full truncate pl-4.5 font-mono text-desk-micro text-desk-fg-3">
                  {row.line}
                </span>
                {note ? (
                  <span
                    className={cn(
                      "w-full truncate pl-4.5 text-desk-micro",
                      note.tone === "blocked" ? "text-desk-blocked" : "text-desk-running"
                    )}
                  >
                    {note.text}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </PaneBody>
      {/* The keyboard exists; this is the one quiet line that says so. */}
      <button
        type="button"
        onClick={onHelp}
        className="flex h-desk-toolbar shrink-0 items-center gap-1.5 border-t border-desk-line px-4 text-desk-micro text-desk-fg-3 transition-colors duration-100 hover:text-desk-fg"
      >
        <Kbd>j</Kbd>
        <Kbd>k</Kbd>
        <span className="mr-2">move</span>
        <Kbd>↵</Kbd>
        <span className="mr-2">open</span>
        <Kbd>esc</Kbd>
        <span className="mr-2">back</span>
        <Kbd>?</Kbd>
        <span>keys</span>
      </button>
    </Pane>
  )
}

/** The repos in this list whose pull requests couldn't be read, by slug —
 *  matched on the full name, as the repo view matches them. */
function prUnreadFor(board: BoardData, list: WorkList): string[] {
  const only =
    list.kind === "batch" ? list.section.repo.fullName : list.kind === "repo" ? list.focus.repo.fullName : null
  return board.prErrors.filter((e) => only === null || e.repo.fullName === only).map((e) => e.repo.slug)
}

// ---------------------------------------------------------------------------

export function WorkDesk({
  board,
  unreadableMaintenance,
}: {
  board: BoardData
  /** Maintenance launchers for the repos whose read failed, which have no
   *  section in `board.sections` — keyed by full name. */
  unreadableMaintenance: Record<string, MaintenanceLauncher[]>
}) {
  const params = useBoardParams()
  const { navigate, correct } = params
  const live = useWorkLive()
  const unreadable = { errors: board.errors, maintenance: unreadableMaintenance }
  const { selection, correction } = resolveWork(board.sections, unreadable, {
    view: params.view,
    ticket: params.ticket,
    batch: params.batch,
    repoSelection: params.repoSelection,
    repo: params.repo,
  })

  // A stale, partial or foreign URL is corrected in place — the panes already
  // show what it resolves to; this makes the address say so, with no new
  // history entry.
  const fixKey = correction ? JSON.stringify(correction) : null
  useEffect(() => {
    if (live && fixKey) correct(JSON.parse(fixKey) as BoardQuery)
  }, [live, fixKey, correct])

  const { list } = selection
  const current = listKey(list)
  const lq = listQuery(list)
  const ticketSelected = selection.ticket ? `${selection.ticket.section.repo.slug}/${selection.ticket.ticket.id}` : null

  // ---- Folds (pane one). ------------------------------------------------
  const folds = parseFolds(useSyncExternalStore(subscribeFolds, foldsSnapshot, () => null))
  const holding = selectedRepo(selection)
  const expanded = (slug: string) => folds[slug] ?? slug === holding
  function setFold(slug: string, open: boolean) {
    saveFolds({ ...folds, [slug]: open })
  }

  const entries = navEntries(board, expanded)
  const rows = paneRows(board, list)
  const selectable = rows.filter((r) => r.kind === "ticket")

  // ---- Cursors and focus. -----------------------------------------------
  // Pane one's cursor: where the keyboard put it, recorded with the list the
  // URL held then — once the URL moves without it (a click, back/forward),
  // it is stale and rests on the open list's entry again.
  const [navCursor, setNavCursor] = useState<{ key: string; at: string } | null>(null)
  const liveNav =
    navCursor && navCursor.at === current && entries.some((e) => e.key === navCursor.key)
      ? navCursor.key
      : entries.some((e) => e.key === current)
        ? current
        : null

  const [keysOpen, setKeysOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const readerRef = useRef<HTMLDivElement>(null)

  // Where focus goes once the view it lands in has rendered.
  const pendingFocus = useRef<PaneIndex | null>(null)

  function focusPane(pane: PaneIndex) {
    const element = pane === 1 ? navRef.current : pane === 2 ? listRef.current : readerRef.current
    if (!element) return
    element.focus({ preventScroll: true })
    const active = element.getAttribute("aria-activedescendant")
    if (active) document.getElementById(active)?.scrollIntoView({ block: "nearest" })
  }

  useEffect(() => {
    const pending = pendingFocus.current
    if (pending === null) return
    pendingFocus.current = null
    focusPane(pending)
  })

  /** The pane holding focus — the list when focus is anywhere else. */
  function focusedPane(): PaneIndex {
    const focused = document.activeElement
    if (focused && navRef.current?.contains(focused)) return 1
    if (focused && readerRef.current?.contains(focused)) return 3
    return 2
  }

  function openEntry(entry: NavEntry) {
    if (entry.kind === "repo") setFold(entry.slug, true)
    setNavCursor({ key: entry.key, at: entry.key })
    if (entry.key !== current || ticketSelected) navigate(entryQuery(entry))
  }

  function onKey(intent: BoardKeyIntent, event: KeyboardEvent): boolean {
    const pane = focusedPane()
    const target = paneSelection(selection)

    switch (intent) {
      case "down":
      case "up": {
        const step = intent === "down" ? 1 : -1
        if (pane === 3) {
          const reader = readerRef.current
          if (!reader) return false
          // The focused pane scrolls to its own arrows; `j`/`k`, and arrows
          // pressed on a control inside it, scroll it by the same step.
          if (event.key.startsWith("Arrow") && event.target === reader) return false
          reader.scrollBy({ top: step * READER_STEP_PX })
          return true
        }
        if (pane === 1) {
          if (entries.length === 0) return true
          const at = entries.findIndex((e) => e.key === liveNav)
          const next = at === -1 ? 0 : Math.min(Math.max(at + step, 0), entries.length - 1)
          setNavCursor({ key: entries[next].key, at: current })
          navRef.current?.focus({ preventScroll: true })
          document.getElementById(`work-nav-${next}`)?.scrollIntoView({ block: "nearest" })
          return true
        }
        if (selectable.length === 0) return true
        const at = selectable.findIndex((r) => r.key === ticketSelected)
        const next = at === -1 ? 0 : Math.min(Math.max(at + step, 0), selectable.length - 1)
        const key = selectable[next].key
        // In place, not pushed: back leaves the list, not every row passed.
        if (key !== ticketSelected) correct({ ...lq, t: key })
        listRef.current?.focus({ preventScroll: true })
        document.getElementById(rowOptionId(next))?.scrollIntoView({ block: "nearest" })
        return true
      }

      case "open": {
        if (pane === 3) return false
        if (pane === 1) {
          const entry = entries.find((e) => e.key === liveNav)
          if (!entry) return true
          const moves = entry.key !== current || ticketSelected !== null
          openEntry(entry)
          if (moves) pendingFocus.current = 2
          else focusPane(2)
          return true
        }
        if (ticketSelected) {
          focusPane(3)
          return true
        }
        const first = selectable[0]
        if (!first) return true
        navigate({ ...lq, t: first.key })
        pendingFocus.current = 3
        return true
      }

      case "back": {
        if (pane === 3) {
          focusPane(2)
          return true
        }
        if (pane === 2) {
          setNavCursor(null)
          focusPane(1)
          return true
        }
        if (!ticketSelected) return false
        navigate({ ...lq, t: null })
        return true
      }

      case "copy": {
        const copy = copyTarget(target)
        if (copy) void copyToClipboard(copy.value, copy.what)
        else toast("Nothing to copy here")
        return true
      }

      case "github": {
        const url = githubUrl(target)
        if (!url) return false
        window.open(url, "_blank", "noopener,noreferrer")
        return true
      }

      case "refresh":
        requestBoardRefresh()
        return true

      case "prevRepo":
      case "nextRepo": {
        // `[` and `]` step through the views and the unfolded epics, opening
        // each without moving focus.
        const stops = entries.filter((e) => e.kind !== "repo")
        if (stops.length === 0) return false
        const step = intent === "nextRepo" ? 1 : -1
        const at = stops.findIndex((e) => e.key === current)
        let next: NavEntry
        if (at !== -1) {
          next = stops[(at + step + stops.length) % stops.length]
        } else {
          // The open list is no stop (a repo, or an epic whose repo is
          // folded): step from where it sits in pane one.
          const here = entries.findIndex((e) => e.key === current)
          const after = entries.slice(here + 1).find((e) => e.kind !== "repo")
          const before = entries
            .slice(0, Math.max(here, 0))
            .reverse()
            .find((e) => e.kind !== "repo")
          next =
            (step === 1 ? after : before) ??
            (step === 1 ? stops[0] : stops[stops.length - 1])
        }
        setNavCursor({ key: next.key, at: next.key })
        navigate(entryQuery(next))
        return true
      }

      case "help":
        setKeysOpen(true)
        return true

      case "launch": {
        // The reader's primary act, from any pane (spec work-reader §2): the
        // same decision its button makes, so the two never disagree. A
        // running ticket offers none. Opened here, inside the keydown, so the
        // browser counts it as the user's own gesture.
        if (target.kind !== "ticket") return false
        const { ticket } = target
        if (ticket.pr) return true
        const action = primaryAction(ticket.launches, ticket.pickup)
        if (action.kind === "launch" && action.launch.url) {
          if (action.launch.surface === "web") window.open(action.launch.url, "_blank", "noopener,noreferrer")
          else window.location.assign(action.launch.url)
        } else if (action.kind === "copy" && ticket.pickup) {
          void copyToClipboard(ticket.pickup, ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt")
        }
        return true
      }
    }
  }

  useBoardKeys(onKey, live)

  // ---- Pane three — the reader, or the desk's view of what is open. ------
  const shown = paneSelection(selection)
  const onSelectTicket = (key: string) => navigate({ ...lq, t: key })
  let detail: { title: React.ReactNode; meta?: React.ReactNode; body: React.ReactNode } | null
  switch (shown.kind) {
    case "ticket":
      // The reader draws its own head (ticket-reader.tsx).
      detail = null
      break
    case "batch":
      detail = {
        title: shown.batch.title,
        meta: <BatchSummary section={shown.section} batch={shown.batch} />,
        body: <DeskBatchView batch={shown.batch} onSelectTicket={onSelectTicket} />,
      }
      break
    case "repo":
      detail = {
        title: <span className="font-mono">{shown.focus.repo.slug}</span>,
        meta: shown.focus.repo.clientName ?? "House repo",
        body: (
          <DeskRepoView
            focus={shown.focus}
            figures={repoFigures(board, shown.focus)}
            prError={
              board.prErrors.find((e) => e.repo.fullName === shown.focus.repo.fullName)?.message ?? null
            }
          />
        ),
      }
      break
    default:
      detail = {
        title: "Overview",
        meta: "The whole estate",
        body: (
          <DeskEstateOverview
            figures={boardFigures(board, null)}
            blocked={ticketsInGroup(board, "blocked", null)}
            board={{
              errors: board.errors,
              prErrors: board.prErrors,
              rosterError: board.rosterError,
              estateCheck: board.estateCheck,
            }}
            // The overview's rows are the Blocked figure's tickets, so one
            // opens in the Blocked view.
            onSelectTicket={(key) => navigate({ v: "blocked", t: key })}
            onSelectRepo={(slug) => navigate({ r: slug })}
          />
        ),
      }
  }

  const partial = board.errors.length
  const quiet = board.sections.length === 0 && board.errors.length === 0

  return (
    <div className="desk-tier flex h-dvh min-h-0 flex-col bg-desk-canvas font-desk text-desk-fg md:-mb-8">
      <header className="flex h-desk-toolbar shrink-0 items-center gap-3 border-b border-desk-line bg-desk-surface px-4">
        <h1 className="text-desk-heading font-bold">Work</h1>
        <div className="ml-auto flex items-center">
          <BoardRefresh readAt={board.readAt} desk />
        </div>
      </header>

      {board.dbError ? (
        <div className="flex flex-1 items-start gap-3 p-6 text-desk-ui">
          <TriangleAlert aria-hidden className="size-desk-icon shrink-0 text-desk-blocked" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Database unavailable</p>
            <p className="text-desk-fg-2">{board.dbError}</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <NavPane
            entries={entries}
            current={current}
            cursor={liveNav}
            expanded={expanded}
            rosterError={board.rosterError}
            quiet={quiet}
            listRef={navRef}
            onOpen={openEntry}
            onToggle={(slug) => setFold(slug, !expanded(slug))}
          />
          <ListPane
            list={list}
            rows={rows}
            selectedKey={ticketSelected}
            partial={partial}
            prUnread={prUnreadFor(board, list)}
            listRef={listRef}
            onSelect={(key) => navigate({ ...lq, t: key })}
            onHelp={() => setKeysOpen(true)}
          />
          <Pane aria-label={shown.kind === "ticket" ? "Reader" : "Detail"} className="min-w-0 flex-1">
            {shown.kind === "ticket" ? (
              <ReaderHead key={selectionKey(shown)} ticket={shown.ticket} readAt={board.readAt} />
            ) : detail ? (
              <PaneHeader title={detail.title} meta={detail.meta} titleAs="h2" />
            ) : null}
            <PaneBody key={selectionKey(shown)} ref={readerRef} tabIndex={0} className={LISTBOX}>
              {shown.kind === "ticket" ? (
                <ReaderBody ticket={shown.ticket} batch={shown.batch} onSelectTicket={onSelectTicket} />
              ) : detail ? (
                <div className="flex max-w-3xl flex-col gap-6 p-5">{detail.body}</div>
              ) : null}
            </PaneBody>
          </Pane>
        </div>
      )}

      <BoardKeysSheet open={keysOpen} onOpenChange={setKeysOpen} />
    </div>
  )
}

/** An epic's or pile's one line under its title: the repo, its progress,
 *  what is open. */
function BatchSummary({ section, batch }: { section: ListSection; batch: ListBatch }) {
  return (
    <>
      <span className="font-mono">{section.repo.slug}</span>
      {batch.planned !== null ? (
        <>
          {" · "}
          <span className="font-mono tabular-nums">
            {batch.done} of {batch.planned}
          </span>{" "}
          done
        </>
      ) : null}
      {" · "}
      <span className="font-mono tabular-nums">{batch.tickets.length}</span>
      {batch.kind === "runs" ? " in flight" : " open"}
    </>
  )
}

/** No `GITHUB_TOKEN`, no board — at the desk as on the phone, a stated
 *  absence rather than a broken screen; everything else in the app works. */
export function WorkDeskNotConfigured() {
  return (
    <div className="desk-tier flex h-dvh min-h-0 flex-col bg-desk-canvas font-desk text-desk-fg md:-mb-8">
      <header className="flex h-desk-toolbar shrink-0 items-center border-b border-desk-line bg-desk-surface px-4">
        <h1 className="text-desk-heading font-bold">Work</h1>
      </header>
      <div className="flex max-w-xl flex-col gap-2 p-6 text-desk-ui">
        <p className="font-semibold">GitHub isn&rsquo;t configured here</p>
        <p className="text-desk-fg-2">
          Set <span className="font-mono text-desk-meta">GITHUB_TOKEN</span> in this environment
          to read each repo&rsquo;s <span className="font-mono text-desk-meta">.icm/intake/</span>.
          The variable is listed in <span className="font-mono text-desk-meta">.env.example</span>.
          Everything else in the app works without it.
        </p>
      </div>
    </div>
  )
}
