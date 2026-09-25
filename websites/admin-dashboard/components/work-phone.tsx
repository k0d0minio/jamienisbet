"use client"

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Search, TriangleAlert } from "lucide-react"

import {
  DeskButton,
  DeskSegmentedControl,
  ListRow,
  PriorityTag,
  StatusDot,
  cn,
} from "@jamie-nisbet/ui"

import { AppMenu } from "@/components/app-menu"
import {
  batchKey,
  repoFigures,
  ticketKey,
  type ListBatch,
  type ListSection,
  type RepoFocus,
} from "@/components/board-model"
import { BoardRefresh } from "@/components/board-refresh"
import { usePaletteOpener } from "@/components/command-palette"
import {
  EpicMeter,
  ReaderBody,
  ReaderHead,
  ReaderLaunchBar,
  understood,
} from "@/components/ticket-reader"
import {
  pushedFromQuery,
  useBoardParams,
  type BoardQuery,
} from "@/components/use-board-params"
import { useWorkLive } from "@/components/work-screen"
import { DeskRepoView } from "@/components/work-views"
import {
  REPOS_VIEW,
  epicNextLine,
  locateAll,
  paneRows,
  phoneLabel,
  phoneLevel,
  phoneLevelKey,
  phoneParent,
  phoneQuery,
  resolveWork,
  rowNote,
  viewTickets,
  whereLine,
  type PaneRow,
  type PhoneLevel,
  type PhoneSegment,
  type WorkView,
} from "@/components/work-model"
import type { BoardData, BoardTicket, MaintenanceLauncher } from "@/lib/tickets"

// Work on the phone (spec work-phone, D-2, D-21) — below `lg`, a stack of
// levels on the desk tier: the list (Up next or Repos), a repo, an epic, and
// the reader over whichever it was opened from, its Launch in a bar that
// stays in view.
//
// One codepath for data, two layouts: the same `readBoard()` result the desk
// panes get, resolved by the same `resolveWork` from the same `v` / `b` / `r`
// / `t` keys — `phoneLevel` (work-model.ts) is only the phone's reading of
// it. So a link means the same thing at either width, and a window that
// crosses `lg` keeps its place.
//
// Every tap is a push (use-board-params.ts), so the browser's back steps
// through the levels; the back button is the same step when the board
// pushed the entry, and a push of the level's parent from a cold link. A
// swipe from the leading edge does what the button does. The page scrolls
// (pull-to-refresh listens to it), each level's place is kept, and popping
// back to a list lands where it was left.
//
// Flat, as the desk tier is (D-3): a level replaces the one under it with no
// slide, and the edge swipe follows the finger rather than playing a motion.
// Rows only tap — no swipe trays; copy and GitHub live in the reader.

/** How far in from the level's leading edge a swipe back may start. */
const EDGE_PX = 20
/** How far a touch travels before it counts as sideways or as a scroll. */
const SLOP_PX = 8
/** How far an edge swipe has to carry the level, as a share of its width,
 *  before letting go pops it. */
const EDGE_BACK_SHARE = 0.33
/** A flick pops it too: this far, at least this fast (px per ms). */
const FLICK_MIN_PX = 48
const FLICK_SPEED = 0.5

// The renderer arrives with the first epic or ticket opened, not with the list.
const Markdown = dynamic(() =>
  import("@/components/markdown").then((m) => m.Markdown)
)

const EYEBROW = "font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase"

/** The id a section of the Up next segment carries — where `?v=running` and
 *  `?v=blocked` open it. */
const sectionId = (view: WorkView) => `work-phone-${view}`

const UP_NEXT_SECTIONS: { view: WorkView; label: string; empty: string }[] = [
  { view: "next", label: "Up next", empty: "Nothing runnable right now." },
  { view: "running", label: "Running", empty: "Nothing in flight." },
  { view: "blocked", label: "Blocked", empty: "Nothing is waiting on anything." },
]

export function WorkPhone({
  board,
  unreadableMaintenance,
}: {
  board: BoardData
  /** Maintenance launchers for the repos whose read failed, which have no
   *  section in `board.sections` — keyed by full name. */
  unreadableMaintenance: Record<string, MaintenanceLauncher[]>
}) {
  const params = useBoardParams()
  const { navigate, correct, pop } = params
  const search = useSearchParams().toString()
  const live = useWorkLive()
  const unreadable = { errors: board.errors, maintenance: unreadableMaintenance }

  const resolve = (query: URLSearchParams) =>
    resolveWork(board.sections, unreadable, {
      view: query.get("v"),
      ticket: query.get("t"),
      batch: query.get("b"),
      repoSelection: query.get("r"),
      repo: query.get("repo"),
    })

  const { selection, correction } = resolve(new URLSearchParams(search))
  const level = phoneLevel(selection, params.view)
  const levelKey = phoneLevelKey(level)

  // A stale, partial or foreign URL is corrected in place, as at the desk.
  const fixKey = correction ? JSON.stringify(correction) : null
  useEffect(() => {
    if (live && fixKey) correct(JSON.parse(fixKey) as BoardQuery)
  }, [live, fixKey, correct])

  // The entry this one was pushed from — history the server doesn't have, so
  // it is none there and through hydration. Every move between entries
  // re-renders (the URL is the state), and each render reads it afresh.
  const pushedFrom = useSyncExternalStore(subscribeHistory, pushedFromQuery, () => null)

  // ---- Scroll, kept per level. ------------------------------------------
  const scrolls = useRef(new Map<string, number>())
  const shownKey = useRef(levelKey)
  const pushed = useRef(false)

  useEffect(() => {
    if (!live) return
    const remember = () => scrolls.current.set(shownKey.current, window.scrollY)
    window.addEventListener("scroll", remember, { passive: true })
    return () => window.removeEventListener("scroll", remember)
  }, [live])

  // Running and Blocked open the Up next segment at their section.
  const anchorView =
    level.kind === "list" && level.segment === "next" && level.view !== "next" ? level.view : null

  useLayoutEffect(() => {
    if (!live) return
    shownKey.current = levelKey
    const anchor = anchorView ? document.getElementById(sectionId(anchorView)) : null
    if (pushed.current) {
      // A new level opens at its top.
      pushed.current = false
      window.scrollTo({ top: 0 })
    } else if (scrolls.current.has(levelKey)) {
      window.scrollTo({ top: scrolls.current.get(levelKey) })
    } else if (anchor) {
      anchor.scrollIntoView({ block: "start" })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [levelKey, anchorView, live])

  // ---- Moving between levels. --------------------------------------------
  function open(next: PhoneLevel) {
    pushed.current = true
    navigate(phoneQuery(next))
  }

  // Back lands on the entry that pushed this one — the repo an epic was
  // opened from, the ticket before a build-order tap — unless that entry is
  // deeper than this level (a cold link's parent, pushed over it), where a
  // step back would bounce between the two: then it is the parent.
  const parent = phoneParent(level)
  const from = (() => {
    if (pushedFrom === null) return null
    const query = new URLSearchParams(pushedFrom)
    return phoneLevel(resolve(query).selection, query.get("v"))
  })()
  const viaHistory = from !== null && depth(from) <= depth(level)
  const backTo = parent ? (viaHistory && from ? from : parent) : null
  function back() {
    if (parent) pop(phoneQuery(parent), viaHistory)
  }

  function setSegment(segment: PhoneSegment) {
    // A filter over the list, not a level: rewritten in place.
    correct({ v: segment === "repos" ? REPOS_VIEW : null })
  }

  const located = locateAll(board.sections)
  const openTicket = (ticket: BoardTicket, over: PhoneLevel) => {
    const at = located.get(ticketKey(ticket))
    if (at) open({ kind: "reader", located: at, parent: over })
  }
  const openBatch = (section: ListSection, batch: ListBatch) =>
    open({ kind: "batch", section, batch })

  // ---- The edge swipe. ---------------------------------------------------
  // Native listeners on the level itself, not an overlay: a touch that starts
  // within EDGE_PX of the level's leading edge (clear of the rail from `md`,
  // which the level already sits beside) becomes a swipe only once it moves
  // sideways; a tap still reaches what is under it and a vertical move is the
  // page's scroll, untouched. `touchmove` must be non-passive to hold the page
  // still once it is a swipe, which React's own listener can't be.
  const [drag, setDrag] = useState(0)
  const levelRef = useRef<HTMLDivElement>(null)
  const backRef = useRef(back)
  useEffect(() => {
    backRef.current = back
  })
  const canPop = parent !== null
  useEffect(() => {
    const el = levelRef.current
    if (!live || !canPop || !el) return
    let g: { x: number; y: number; at: number; sideways: boolean | null } | null = null
    function onStart(e: TouchEvent) {
      g = null
      if (e.touches.length !== 1 || !el) return
      const touch = e.touches[0]
      if (touch.clientX - el.getBoundingClientRect().left > EDGE_PX) return
      g = { x: touch.clientX, y: touch.clientY, at: e.timeStamp, sideways: null }
    }
    function onMove(e: TouchEvent) {
      if (!g) return
      const dx = e.touches[0].clientX - g.x
      const dy = e.touches[0].clientY - g.y
      if (g.sideways === null) {
        if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) return
        g.sideways = dx > 0 && Math.abs(dx) > Math.abs(dy)
        if (!g.sideways) {
          g = null
          return
        }
      }
      e.preventDefault()
      setDrag(Math.max(0, dx))
    }
    function onEnd(e: TouchEvent) {
      const gesture = g
      g = null
      if (!gesture?.sideways) return
      const distance = Math.max(0, (e.changedTouches[0]?.clientX ?? gesture.x) - gesture.x)
      const elapsed = Math.max(1, e.timeStamp - gesture.at)
      const far = distance > window.innerWidth * EDGE_BACK_SHARE
      const flick = distance > FLICK_MIN_PX && distance / elapsed > FLICK_SPEED
      setDrag(0)
      if (e.type === "touchend" && (far || flick)) backRef.current()
    }
    el.addEventListener("touchstart", onStart, { passive: true })
    el.addEventListener("touchmove", onMove, { passive: false })
    el.addEventListener("touchend", onEnd)
    el.addEventListener("touchcancel", onEnd)
    return () => {
      el.removeEventListener("touchstart", onStart)
      el.removeEventListener("touchmove", onMove)
      el.removeEventListener("touchend", onEnd)
      el.removeEventListener("touchcancel", onEnd)
    }
  }, [live, canPop])

  // ---- The level on screen. ----------------------------------------------
  let content: React.ReactNode
  switch (level.kind) {
    case "list":
      content = (
        <ListLevel
          board={board}
          segment={level.segment}
          onSegment={setSegment}
          onTicket={(ticket) => openTicket(ticket, { kind: "list", segment: "next", view: "next" })}
          onRepo={(focus) => open({ kind: "repo", focus })}
          onBatch={openBatch}
          unreadable={unreadable}
        />
      )
      break
    case "repo":
      content = (
        <RepoLevel
          board={board}
          level={level}
          onTicket={(ticket) => openTicket(ticket, level)}
          onBatch={(key) => {
            const section = level.focus.section
            const batch = section?.batches.find((b) => batchKey(section, b) === key)
            if (section && batch) openBatch(section, batch)
          }}
        />
      )
      break
    case "batch":
      content = (
        <BatchLevel board={board} level={level} onTicket={(ticket) => openTicket(ticket, level)} />
      )
      break
    case "reader":
      content = (
        <ReaderLevel
          level={level}
          readAt={board.readAt}
          onSelectTicket={(key) => {
            const at = located.get(key)
            if (at) open({ kind: "reader", located: at, parent: level.parent })
          }}
        />
      )
  }

  return (
    <div className="desk-tier flex min-h-full flex-col bg-desk-canvas font-desk text-desk-fg">
      <div
        ref={levelRef}
        className="flex flex-1 flex-col"
        style={drag > 0 ? { transform: `translateX(${drag}px)` } : undefined}
      >
        {backTo ? (
          <BackBar
            label={phoneLabel(backTo)}
            onBack={back}
            github={level.kind === "reader" ? level.located.ticket.htmlUrl : null}
          />
        ) : null}
        {board.dbError ? (
          <p className="flex items-start gap-2 border-b border-desk-line px-4 py-3 text-desk-ui text-desk-blocked">
            <TriangleAlert aria-hidden className="mt-0.5 size-desk-icon shrink-0" />
            <span>Database unavailable — {board.dbError}</span>
          </p>
        ) : null}
        {content}
      </div>
    </div>
  )
}

/** How deep a level sits: the list, then a repo or an epic, then a reader. */
function depth(level: PhoneLevel): number {
  return level.kind === "list" ? 0 : level.kind === "reader" ? 2 : 1
}

/** Back and forward are the only history moves the board doesn't make
 *  itself; each also moves the URL, so this is belt and braces. */
function subscribeHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange)
  return () => window.removeEventListener("popstate", onChange)
}

// ---------------------------------------------------------------------------
// Chrome.

/** On the phone the title bar carries what the rail carries at the desk: the
 *  palette and the app menu. From `md` the rail has both. */
function PhoneChrome() {
  const openPalette = usePaletteOpener()
  return (
    <div className="flex items-center gap-1 md:hidden">
      {openPalette ? (
        <DeskButton variant="ghost" size="icon" aria-label="Go anywhere" onClick={openPalette}>
          <Search aria-hidden />
        </DeskButton>
      ) : null}
      <AppMenu />
    </div>
  )
}

/** A pushed level's bar: the way back on the leading edge, named for where
 *  it lands, and GitHub ↗ on the trailing edge for a ticket. */
function BackBar({
  label,
  onBack,
  github,
}: {
  label: string
  onBack: () => void
  github: string | null
}) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-desk-line bg-desk-surface px-2"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 min-w-11 max-w-[70%] items-center gap-0.5 rounded-desk-control pr-2 text-desk-body text-desk-fg transition-colors duration-100 active:bg-desk-sunken"
      >
        <ChevronLeft aria-hidden className="size-5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {github ? (
        <DeskButton asChild variant="ghost" className="ml-auto h-11">
          <a href={github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </DeskButton>
      ) : null}
    </div>
  )
}

/** An eyebrow and a mono count over a group of rows. */
function GroupHead({
  id,
  label,
  count,
  tone,
}: {
  id?: string
  label: string
  count?: number
  tone?: "running" | "blocked"
}) {
  return (
    <h2
      id={id}
      className="flex scroll-mt-40 items-center gap-2 border-b border-desk-line bg-desk-hover px-4 pt-4 pb-1.5"
    >
      <span className={EYEBROW}>{label}</span>
      {count !== undefined ? (
        <span
          className={cn(
            "font-mono text-desk-micro tabular-nums",
            count > 0 && tone === "running"
              ? "text-desk-running"
              : count > 0 && tone === "blocked"
                ? "text-desk-blocked"
                : "text-desk-fg-3"
          )}
        >
          {count}
        </span>
      ) : null}
    </h2>
  )
}

/** One line of warning under a group — a repo, or its pull requests, that
 *  couldn't be read. */
function WarnLine({ tone, children }: { tone: "blocked" | "running"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 border-b border-desk-line px-4 py-2 text-desk-micro",
        tone === "blocked" ? "text-desk-blocked" : "text-desk-running"
      )}
    >
      <TriangleAlert aria-hidden className="size-desk-check shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/** A ticket as the phone draws it: the dot, the title, the today mark and
 *  the priority; under them where it lives; then why it waits, or what is
 *  running. A tap opens the reader. */
function TicketRow({
  ticket,
  sequence = null,
  onOpen,
}: {
  ticket: BoardTicket
  sequence?: number | null
  onOpen: () => void
}) {
  const note = rowNote(ticket)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-desk-row w-full min-w-0 flex-col gap-0.5 border-b border-desk-line px-4 py-2.5 text-left transition-colors duration-100 active:bg-desk-sunken"
    >
      <span className="flex w-full min-w-0 items-center gap-2.5">
        <StatusDot status={ticket.status} label={note?.text} />
        {sequence !== null ? (
          <span className="font-mono text-desk-meta tabular-nums text-desk-fg-3">{sequence}</span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-desk-ui text-desk-fg">{ticket.title}</span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-desk-micro text-desk-fg-3">
          {ticket.today ? <span>today</span> : null}
          <PriorityTag priority={ticket.priority} />
        </span>
      </span>
      <span className="w-full truncate pl-4.5 font-mono text-desk-micro text-desk-fg-3">
        {whereLine(ticket)}
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
}

// ---------------------------------------------------------------------------
// The list level.

function ListLevel({
  board,
  segment,
  onSegment,
  onTicket,
  onRepo,
  onBatch,
  unreadable,
}: {
  board: BoardData
  segment: PhoneSegment
  onSegment: (segment: PhoneSegment) => void
  onTicket: (ticket: BoardTicket) => void
  onRepo: (focus: RepoFocus) => void
  onBatch: (section: ListSection, batch: ListBatch) => void
  unreadable: { errors: BoardData["errors"]; maintenance: Record<string, MaintenanceLauncher[]> }
}) {
  return (
    <>
      <header
        className="sticky top-0 z-10 flex flex-col gap-2 border-b border-desk-line bg-desk-surface px-4 pb-2"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex min-h-12 items-center gap-2">
          <h1 className="text-desk-heading font-bold">Work</h1>
          <div className="ml-auto flex items-center gap-1">
            <BoardRefresh readAt={board.readAt} desk />
            <PhoneChrome />
          </div>
        </div>
        <DeskSegmentedControl
          aria-label="Work view"
          value={segment}
          onValueChange={onSegment}
          options={[
            { value: "next", label: "Up next" },
            { value: "repos", label: "Repos" },
          ]}
          className="flex w-full *:h-11 *:flex-1"
        />
      </header>
      {segment === "next" ? (
        <UpNext board={board} onTicket={onTicket} />
      ) : (
        <Repos board={board} onRepo={onRepo} onBatch={onBatch} unreadable={unreadable} />
      )}
    </>
  )
}

function UpNext({ board, onTicket }: { board: BoardData; onTicket: (ticket: BoardTicket) => void }) {
  const partial = board.errors.length
  return (
    <div className="flex flex-col">
      {UP_NEXT_SECTIONS.map(({ view, label, empty }) => {
        const tickets = viewTickets(board, view)
        return (
          <section key={view} aria-labelledby={sectionId(view)}>
            <GroupHead
              id={sectionId(view)}
              label={label}
              count={tickets.length}
              tone={view === "running" ? "running" : view === "blocked" ? "blocked" : undefined}
            />
            {tickets.length === 0 ? (
              <p className="border-b border-desk-line px-4 py-3 text-desk-ui text-desk-fg-3">{empty}</p>
            ) : (
              tickets.map((ticket) => (
                <TicketRow key={ticketKey(ticket)} ticket={ticket} onOpen={() => onTicket(ticket)} />
              ))
            )}
          </section>
        )
      })}
      {partial > 0 ? (
        <WarnLine tone="blocked">
          {partial === 1 ? "1 repo couldn't be read" : `${partial} repos couldn't be read`} — its
          tickets aren&rsquo;t listed. Repos says what GitHub said.
        </WarnLine>
      ) : null}
      {board.prErrors.length > 0 ? (
        <WarnLine tone="running">
          Pull requests couldn&rsquo;t be read for{" "}
          <span className="font-mono">{board.prErrors.map((e) => e.repo.slug).join(", ")}</span> —
          running there is run folders only
        </WarnLine>
      ) : null}
    </div>
  )
}

function Repos({
  board,
  onRepo,
  onBatch,
  unreadable,
}: {
  board: BoardData
  onRepo: (focus: RepoFocus) => void
  onBatch: (section: ListSection, batch: ListBatch) => void
  unreadable: { errors: BoardData["errors"]; maintenance: Record<string, MaintenanceLauncher[]> }
}) {
  const sectioned = new Set(board.sections.map((s) => s.repo.slug))
  const failed = new Map(board.errors.map((e) => [e.repo.slug, e]))
  const quiet = board.sections.length === 0 && board.errors.length === 0
  return (
    <div className="flex flex-col">
      {board.rosterError ? (
        <WarnLine tone="blocked">Only the pinned repos. {board.rosterError}</WarnLine>
      ) : null}
      {quiet ? (
        <p className="px-4 py-6 text-desk-ui text-desk-fg-3">
          No repo has an <span className="font-mono text-desk-meta">.icm/intake/</span> yet.
        </p>
      ) : null}
      {board.sections.map((section) => {
        const error = failed.get(section.repo.slug) ?? null
        const batches = section.batches.filter(
          (b) => b.kind !== "runs" && (b.kind === "epic" || b.tickets.length > 0)
        )
        return (
          <section key={section.repo.fullName} aria-label={section.repo.slug}>
            <RepoHeader
              slug={section.repo.slug}
              client={section.repo.clientName}
              error={error?.message ?? null}
              onOpen={() =>
                onRepo({
                  repo: section.repo,
                  section,
                  error: error?.message ?? null,
                  maintenance: section.maintenance,
                })
              }
            />
            {batches.map((batch) => (
              <BatchRow key={batch.slug} batch={batch} onOpen={() => onBatch(section, batch)} />
            ))}
          </section>
        )
      })}
      {/* A repo whose read failed has no section; it is still listed, its
          level the way to what GitHub said. */}
      {board.errors
        .filter((e) => !sectioned.has(e.repo.slug))
        .map((error) => (
          <RepoHeader
            key={error.repo.fullName}
            slug={error.repo.slug}
            client={error.repo.clientName}
            error={error.message}
            onOpen={() =>
              onRepo({
                repo: error.repo,
                section: null,
                error: error.message,
                maintenance: unreadable.maintenance[error.repo.fullName] ?? [],
              })
            }
          />
        ))}
    </div>
  )
}

/** A repo on the Repos list — its slug, who it is for, whether it could be
 *  read — which opens the repo level. */
function RepoHeader({
  slug,
  client,
  error,
  onOpen,
}: {
  slug: string
  client: string | null
  error: string | null
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full min-w-0 flex-col justify-center gap-0.5 border-b border-desk-line bg-desk-hover px-4 pt-4 pb-2 text-left transition-colors duration-100 active:bg-desk-sunken"
    >
      <span className="flex w-full min-w-0 items-center gap-2">
        {error ? <StatusDot status="blocked" label="Couldn't be read" /> : null}
        <span className="min-w-0 truncate font-mono text-desk-meta font-semibold text-desk-fg">
          {slug}
        </span>
        <span className="min-w-0 truncate text-desk-meta text-desk-fg-3">{client ?? "house"}</span>
        <ChevronRight aria-hidden className="ml-auto size-4 shrink-0 text-desk-fg-3" />
      </span>
      {error ? (
        <span className="w-full truncate text-desk-micro text-desk-blocked">{error}</span>
      ) : null}
    </button>
  )
}

/** An epic, Triage or Backlog on the Repos list: an epic's progress and
 *  next line, a pile's open count. Opens the epic level. */
function BatchRow({ batch, onOpen }: { batch: ListBatch; onOpen: () => void }) {
  const epic = batch.kind === "epic"
  const total = batch.planned ?? batch.rows?.length ?? 0
  const next = epic ? epicNextLine(batch) : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-desk-row w-full min-w-0 items-center gap-3 border-b border-desk-line px-4 py-2.5 text-left transition-colors duration-100 active:bg-desk-sunken"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-desk-ui text-desk-fg">{batch.title}</span>
          {epic ? null : (
            <span className="font-mono text-desk-micro tabular-nums text-desk-fg-3">
              {batch.tickets.length} open
            </span>
          )}
        </span>
        {epic && total > 0 ? (
          <span className="flex items-center gap-2">
            <span className="w-28 shrink-0">
              <EpicMeter done={batch.done} total={total} />
            </span>
            <span className="font-mono text-desk-micro tabular-nums text-desk-fg-3">
              {batch.done} of {total}
            </span>
          </span>
        ) : null}
        {next ? <span className="truncate text-desk-micro text-desk-fg-2">{next}</span> : null}
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-desk-fg-3" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// The repo level.

function RepoLevel({
  board,
  level,
  onTicket,
  onBatch,
}: {
  board: BoardData
  level: Extract<PhoneLevel, { kind: "repo" }>
  onTicket: (ticket: BoardTicket) => void
  onBatch: (key: string) => void
}) {
  const { focus } = level
  const rows = paneRows(board, { kind: "repo", focus })
  return (
    <>
      <div className="flex flex-col gap-1 border-b border-desk-line px-4 py-3">
        <h1 className="font-mono text-desk-heading font-bold break-all">{focus.repo.slug}</h1>
        <p className="text-desk-meta text-desk-fg-3">{focus.repo.clientName ?? "House repo"}</p>
      </div>
      {focus.section ? (
        rows.length === 0 ? (
          <p className="border-b border-desk-line px-4 py-3 text-desk-ui text-desk-fg-3">
            Nothing open in this repo.
          </p>
        ) : (
          <PhoneRows rows={rows} onTicket={onTicket} onHeading={onBatch} />
        )
      ) : null}
      <div className="flex flex-col gap-6 px-4 py-5">
        <DeskRepoView
          focus={focus}
          figures={repoFigures(board, focus)}
          prError={board.prErrors.find((e) => e.repo.fullName === focus.repo.fullName)?.message ?? null}
        />
      </div>
    </>
  )
}

/** A list's rows on the phone: headings (tappable to their batch where they
 *  head one), tickets, and an epic's finished stubs, dimmed and inert. */
function PhoneRows({
  rows,
  onTicket,
  onHeading,
}: {
  rows: PaneRow[]
  onTicket: (ticket: BoardTicket) => void
  onHeading?: (batch: string) => void
}) {
  return (
    <div className="flex flex-col">
      {rows.map((row) => {
        if (row.kind === "heading") {
          const target = row.batch
          return target && onHeading ? (
            <button
              key={row.key}
              type="button"
              onClick={() => onHeading(target)}
              className="flex min-h-11 w-full items-end gap-2 border-b border-desk-line bg-desk-hover px-4 pt-4 pb-1.5 text-left transition-colors duration-100 active:bg-desk-sunken"
            >
              <span className={cn(EYEBROW, "min-w-0 flex-1 truncate")}>{row.title}</span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-desk-fg-3" />
            </button>
          ) : (
            <p
              key={row.key}
              className={cn(EYEBROW, "border-b border-desk-line bg-desk-hover px-4 pt-4 pb-1.5")}
            >
              {row.title}
            </p>
          )
        }
        if (row.kind === "done") {
          return (
            <ListRow
              key={row.key}
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
        return (
          <TicketRow
            key={row.key}
            ticket={row.ticket}
            sequence={row.sequence}
            onOpen={() => onTicket(row.ticket)}
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The epic level.

function BatchLevel({
  board,
  level,
  onTicket,
}: {
  board: BoardData
  level: Extract<PhoneLevel, { kind: "batch" }>
  onTicket: (ticket: BoardTicket) => void
}) {
  const { section, batch } = level
  const rows = paneRows(board, { kind: "batch", section, batch })
  const epic = batch.kind === "epic"
  const total = batch.planned ?? batch.rows?.length ?? 0
  const excerpt = epic ? understood(batch.breakdown) : null
  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-desk-line px-4 py-3">
        <p className="font-mono text-desk-meta break-words text-desk-fg-3">
          {section.repo.slug} / {batch.kind === "epic" ? batch.slug : batch.kind}
        </p>
        <h1 className="text-desk-title font-bold">{batch.title}</h1>
        {epic && total > 0 ? (
          <span className="flex items-center gap-2">
            <span className="w-40 shrink-0">
              <EpicMeter done={batch.done} total={total} />
            </span>
            <span className="font-mono text-desk-micro tabular-nums text-desk-fg-3">
              {batch.done} of {total}
            </span>
          </span>
        ) : (
          <p className="font-mono text-desk-micro tabular-nums text-desk-fg-3">
            {batch.tickets.length} open
          </p>
        )}
        {excerpt ? (
          <div className="pt-1 text-desk-fg-2">
            <Markdown>{excerpt}</Markdown>
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-desk-ui text-desk-fg-3">Nothing open here.</p>
      ) : (
        <PhoneRows rows={rows} onTicket={onTicket} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// The reader.

function ReaderLevel({
  level,
  readAt,
  onSelectTicket,
}: {
  level: Extract<PhoneLevel, { kind: "reader" }>
  readAt: string
  onSelectTicket: (key: string) => void
}) {
  const { ticket, batch } = level.located
  return (
    // Keyed to the ticket, so a "Copied" or an open menu never carries from
    // one ticket to the next.
    <div key={ticketKey(ticket)} className="flex flex-1 flex-col bg-desk-surface">
      <ReaderHead ticket={ticket} readAt={readAt} compact />
      <div className="flex-1">
        <ReaderBody ticket={ticket} batch={batch} onSelectTicket={onSelectTicket} stacked />
      </div>
      {/* Stays in view while the body scrolls: above the tab bar on a phone
          (which already runs under the home indicator), above the bottom
          safe area from `md`, where there is no tab bar. In the flow after
          the body, so the body's last line always scrolls clear of it. */}
      <ReaderLaunchBar
        ticket={ticket}
        readAt={readAt}
        className="sticky bottom-tabs z-10 md:bottom-0 md:pb-[calc(0.625rem_+_env(safe-area-inset-bottom,0px))]"
      />
    </div>
  )
}

/** No `GITHUB_TOKEN`, no board — a stated absence under the phone's title
 *  bar; everything else in the app works. */
export function WorkPhoneNotConfigured() {
  return (
    <div className="desk-tier flex min-h-full flex-col bg-desk-canvas font-desk text-desk-fg">
      <header
        className="sticky top-0 z-10 flex min-h-12 items-center gap-2 border-b border-desk-line bg-desk-surface px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <h1 className="text-desk-heading font-bold">Work</h1>
        <div className="ml-auto">
          <PhoneChrome />
        </div>
      </header>
      <div className="flex flex-col gap-2 px-4 py-6 text-desk-ui">
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
