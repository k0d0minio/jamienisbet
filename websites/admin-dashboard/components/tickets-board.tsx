"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react"

import { GroupedBlock, GroupedRow, GroupedSection, cn, toast } from "@jamie-nisbet/ui"

import { BatchRow } from "@/components/batch-row"
import { BoardKeysSheet, Keycap } from "@/components/board-keys-sheet"
import {
  batchKey,
  boardFigures,
  copyTarget,
  githubUrl,
  levelZeroRows,
  repoFigures,
  resolveSelection,
  rowSelection,
  selectedRepoSlug,
  selectionKey,
  ticketKey,
  ticketsInGroup,
  type ListBatch,
  type ListSection,
  type Selection,
} from "@/components/board-model"
import { DetailPane } from "@/components/board-pane"
import { requestBoardRefresh } from "@/components/board-refresh"
import {
  BatchActions,
  BatchBreakdown,
  BatchMeter,
  BatchSummary,
  BatchTickets,
  BatchView,
  EstateOverview,
  RepoView,
  TicketView,
} from "@/components/board-views"
import { Chip } from "@/components/chip"
import {
  ACTIVE_ROW,
  ACTIVE_ROW_DESKTOP,
  CURSOR_SCROLL_MARGIN,
} from "@/components/ticket-look"
import { TicketSummary } from "@/components/ticket-detail"
import { useBoardKeys, type BoardKeyIntent } from "@/components/use-board-keys"
import { useBoardParams, type BoardQuery } from "@/components/use-board-params"
import { copyToClipboard } from "@/lib/clipboard"
import type { BoardData, MaintenanceLauncher } from "@/lib/tickets"

// The estate's work backlog as a master–detail view: a list that drills and a
// pane that swaps.
//
// The list has two levels. Level 0 is the repos — the chip rail that filters
// them, then one inset group per repo in urgency order, its header opening the
// repo, a row per epic plus Triage, Backlog and In flight. Selecting a batch
// pushes the list to level 1: that batch's tickets under a way back to the
// repos. From `lg` the pane stands beside the list and shows whatever is
// selected — a ticket, a batch, a repo, or the estate overview when nothing
// is; below it a ticket or a repo is pushed full screen over the list
// (DetailPane), and a batch is not pushed at all: level 1 *is* its view there,
// its tickets first and its actions and breakdown under them.
//
// The board is read once, on the server, and handed over as plain data; from
// then on it lives here. Every selection and the repo filter are URL state
// written without a navigation (`useBoardParams`), resolved from the URL on
// every render (`resolveSelection`) — so a deep link restores the whole view,
// back/forward step through it, and a tap needs no request. What brings new
// data is the refresh control in the title bar (BoardRefresh); a selection
// whose ticket went with it falls back to its batch, or to nothing.
//
// From `lg` the board also drives from the keyboard (use-board-keys.ts; `?`
// lists the keys). Each list level is a listbox whose cursor the arrows move.
// At level 1 the cursor *is* the selection — each step rewrites `?t=` in
// place, so back steps through levels rather than every row passed. At level
// 0 a batch can't be selected without drilling (`?b=` is level 1), so there
// the cursor only previews its row in the pane and writes nothing; `Enter`
// commits it. The URL always holds the committed selection alone.
//
// This screen is read-only by design — a ticket changes by editing its file in
// the repo — so every button here is either a link or a prompt to copy (or
// open, pre-filled, in a coding tool), and the human sends it.

/** How far `j`/`k` scroll the pane when it has focus — about the arrow keys'
 *  own step. */
const PANE_STEP_PX = 64

/** The listbox's focus ring: the one the app's buttons wear. */
const LISTBOX_FOCUS =
  "rounded-app-group outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

const levelZeroOptionId = (index: number) => `board-l0-${index}`
const levelOneOptionId = (index: number) => `board-l1-${index}`

/** A quiet day looks calm, not broken: words on the canvas rather than an empty
 *  slab, which reads as a card that failed to load. */
function EmptyBoard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
      <p className="text-app-callout font-medium text-app-label-2">{title}</p>
      <p className="max-w-xs text-app-footnote text-app-label-3">{children}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// List level 0 — the repos.

function RepoSectionView({
  section,
  cursorKey,
  repoOpen,
  optionId,
  onSelectRepo,
  onSelectBatch,
}: {
  section: ListSection
  /** The level-0 row the cursor is on (`levelZeroRows` keys), if any. */
  cursorKey: string | null
  /** The URL has this repo open — highlighted on every width, as before the
   *  keyboard; the cursor alone highlights only from `lg`. */
  repoOpen: boolean
  /** A row's option id in the level-0 listbox, by its key. */
  optionId: (key: string) => string | undefined
  onSelectRepo: () => void
  onSelectBatch: (batch: ListBatch) => void
}) {
  const { repo } = section
  const repoKey = `r:${repo.slug}`
  const repoActive = cursorKey === repoKey
  const runs = section.batches.find((b) => b.kind === "runs")?.tickets.length ?? 0
  return (
    // In the listbox, each repo is a group of options named by its slug.
    <GroupedSection
      role="group"
      aria-label={repo.slug}
      header={
        // The header is the repo's row: a tap opens it (its client, its
        // maintenance). A 44px target that still reads as a group's header.
        <button
          type="button"
          id={optionId(repoKey)}
          role="option"
          aria-selected={repoActive}
          onClick={onSelectRepo}
          className={cn(
            "-mx-2 flex min-h-app-touch w-[calc(100%_+_1rem)] items-center gap-2 rounded-app-control px-2 text-left",
            "transition-colors spring-press active:bg-app-press",
            CURSOR_SCROLL_MARGIN,
            repoActive && (repoOpen ? ACTIVE_ROW : ACTIVE_ROW_DESKTOP)
          )}
        >
          {/* A repo slug is a machine identifier, so it sets in mono. */}
          <span className="truncate font-mono font-medium text-app-label-2">
            {repo.slug}
          </span>
          {repo.clientName ? (
            <span className="truncate">{repo.clientName}</span>
          ) : null}
          <span className="ml-auto shrink-0 font-mono tabular-nums">
            {section.open > 0 ? `${section.open} open` : `${runs} in flight`}
          </span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>
      }
    >
      <ul role="none">
        {section.batches.map((batch, index) => {
          const key = `b:${batchKey(section, batch)}`
          return (
            <BatchRow
              key={batch.slug}
              first={index === 0}
              batch={batch}
              clientHref={repo.clientId ? `/leads/${repo.clientId}` : null}
              optionId={optionId(key)}
              cursor={cursorKey === key}
              onSelect={() => onSelectBatch(batch)}
            />
          )
        })}
      </ul>
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// List level 1 — one batch's tickets.

function BatchList({
  section,
  batch,
  cursorKey,
  listRef,
  onBackToRepos,
  onSelectTicket,
}: {
  section: ListSection
  batch: ListBatch
  /** The ticket the cursor is on — the selected one, or where a keyboard
   *  drill put it. */
  cursorKey: string | null
  listRef: React.RefObject<HTMLDivElement | null>
  onBackToRepos: () => void
  onSelectTicket: (key: string) => void
}) {
  const cursorIndex = batch.tickets.findIndex((t) => ticketKey(t) === cursorKey)
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBackToRepos}
        className={cn(
          "-ml-2 flex min-h-app-touch items-center gap-0.5 self-start rounded-app-control pr-2",
          "text-app-body text-app-tint transition-colors spring-press active:bg-app-press"
        )}
      >
        <ChevronLeft className="size-6 shrink-0" aria-hidden />
        <span className="font-mono">{section.repo.slug}</span>
      </button>

      {/* On a phone there is no pane beside the list, so level 1 is the
          batch's view: its title and scan line, then its tickets, then its
          actions and breakdown. From `lg` the pane beside it shows all of
          that, and the list keeps to the tickets. */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex flex-col gap-1">
          <h2 className="text-app-large-title font-bold text-app-label">
            {batch.title}
          </h2>
          <p className="text-app-footnote text-app-label-3">
            <BatchSummary section={section} batch={batch} />
          </p>
        </div>
        <BatchMeter batch={batch} />
      </div>

      {/* Level 1's listbox: the batch's tickets, the back row outside it. */}
      <div
        ref={listRef}
        role="listbox"
        aria-label={`${batch.title} stubs`}
        aria-activedescendant={
          cursorIndex === -1 ? undefined : levelOneOptionId(cursorIndex)
        }
        tabIndex={0}
        className={LISTBOX_FOCUS}
      >
        <BatchTickets
          batch={batch}
          selectedTicket={cursorKey}
          onSelectTicket={onSelectTicket}
          optionId={levelOneOptionId}
        />
      </div>

      <div className="flex flex-col gap-app-section lg:hidden">
        <BatchActions batch={batch} />
        <BatchBreakdown batch={batch} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function TicketsBoard({
  board,
  unreadableMaintenance,
}: {
  board: BoardData
  /** Maintenance launchers for the repos whose read failed, which have no
   *  section of their own in `board.sections` — keyed by full name. */
  unreadableMaintenance: Record<string, MaintenanceLauncher[]>
}) {
  const { repos, counts, total, errors, rosterError, dbError, sections } = board
  const params = useBoardParams()
  const { navigate, correct, back } = params

  const unreadable = { errors, maintenance: unreadableMaintenance }
  const { selection, correction } = resolveSelection(sections, unreadable, params)

  // The filter as the URL states it, if it names a repo on the roster —
  // anything else reads as the whole board, as a stale bookmark should. A
  // selection in a repo the filter hides wins: the filter is dropped rather
  // than the selection shown against a list that doesn't hold it.
  const selectedRepo = selectedRepoSlug(selection)
  const named =
    params.repo && repos.some((r) => r.slug === params.repo) ? params.repo : null
  const filterConflict = named !== null && selectedRepo !== null && named !== selectedRepo
  const repoSlug = filterConflict ? null : named

  const visibleSections = repoSlug
    ? sections.filter((s) => s.repo.slug === repoSlug)
    : sections

  // The roster is every owner repo; only repos with something on the board get
  // a chip, so the rail doesn't drown in empty client stubs.
  const chipRepos = repos.filter((repo) => (counts[repo.slug] ?? 0) > 0)

  // A stale or conflicting URL is corrected in place — the view already shows
  // the fallback; this makes the address say so, without a new history entry.
  // A link from before the batch view became level 1 may still carry the
  // retired `pane` flag; it means nothing now, so it goes too.
  const fix: BoardQuery | null =
    correction || filterConflict || params.stalePane
      ? {
          ...correction,
          ...(filterConflict ? { repo: null } : {}),
          ...(params.stalePane ? { pane: null } : {}),
        }
      : null
  const fixKey = fix ? JSON.stringify(fix) : null
  useEffect(() => {
    if (fixKey) correct(JSON.parse(fixKey) as BoardQuery)
  }, [fixKey, correct])

  // Level 1 is a batch's tickets: a batch selected, or a ticket in one.
  const drilled =
    selection.kind === "batch" || selection.kind === "ticket" ? selection : null
  const levelKey = drilled ? batchKey(drilled.section, drilled.batch) : null

  // ---- The keyboard's cursor (desktop). -----------------------------------

  // Level 0: the row the cursor rests on, and whether the pane is previewing
  // it. Not URL state — a preview is not a selection. `at` is the selection
  // the URL held when the cursor was put there: once the URL moves without
  // the keyboard (back/forward, a link in the overview) the cursor is stale
  // and the URL wins.
  const [cursor0, setCursor0] = useState<{
    key: string
    preview: boolean
    at: string
  } | null>(null)
  const urlKey = selectionKey(selection)
  const live0 = cursor0?.at === urlKey ? cursor0 : null
  // Level 1, before a ticket is selected: where a keyboard drill put the
  // cursor (the batch's first stub). Once a ticket is selected, the cursor is
  // that ticket.
  const [cursor1, setCursor1] = useState<{ batch: string; ticket: string } | null>(
    null
  )
  const [keysOpen, setKeysOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const rows0 = levelZeroRows(visibleSections)

  // Backing out of a batch — by key, the back row or the browser's back —
  // leaves the cursor on the batch just left. Adjusted during render, the
  // way React has a state follow a value, rather than in an effect a frame
  // late.
  const [lastLevelKey, setLastLevelKey] = useState(levelKey)
  if (lastLevelKey !== levelKey) {
    setLastLevelKey(levelKey)
    const left = lastLevelKey === null ? null : `b:${lastLevelKey}`
    if (levelKey === null && left && rows0.some((row) => row.key === left)) {
      setCursor0({ key: left, preview: false, at: urlKey })
    }
  }

  // The level-0 row under the cursor: the one the keyboard put it on, else
  // the repo the URL has open. Null while drilled, or once a filter hides it.
  const row0 = drilled
    ? null
    : (rows0.find((row) => row.key === live0?.key) ??
      (selection.kind === "repo"
        ? (rows0.find((row) => row.key === `r:${selection.focus.repo.slug}`) ?? null)
        : null))
  const previewing = row0 !== null && live0?.key === row0.key && live0.preview
  const preview = previewing ? rowSelection(sections, unreadable, row0) : null
  // What the pane shows: the preview while there is one, else the selection.
  const shown: Selection = preview ?? selection

  const level1Cursor = drilled
    ? selection.kind === "ticket"
      ? ticketKey(selection.ticket)
      : cursor1 !== null &&
          cursor1.batch === levelKey &&
          drilled.batch.tickets.some((t) => ticketKey(t) === cursor1.ticket)
        ? cursor1.ticket
        : null
    : null

  const optionIds0 = new Map(rows0.map((row, index) => [row.key, levelZeroOptionId(index)]))
  const activeOption0 = row0 ? optionIds0.get(row0.key) : undefined

  // Where focus goes once the view it lands in has rendered: the list at a
  // given level (a drill or a back-out changes which listbox exists), or the
  // pane. Applied after every commit until the right view is on screen — a
  // back-out through `history.back()` arrives a render or two later.
  const pendingFocus = useRef<{ to: "list"; level: 0 | 1 } | { to: "pane" } | null>(
    null
  )
  const level = drilled ? 1 : 0
  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    if (pending.to === "pane") {
      pendingFocus.current = null
      paneRef.current?.focus({ preventScroll: true })
      return
    }
    if (pending.level !== level) return
    pendingFocus.current = null
    focusList()
  })

  /** Focus the list's listbox and bring its cursor row into view. */
  function focusList() {
    const list = listRef.current
    if (!list) return
    list.focus({ preventScroll: true })
    const active = list.getAttribute("aria-activedescendant")
    if (active) document.getElementById(active)?.scrollIntoView({ block: "nearest" })
  }

  /** Move the level-0 cursor and preview its row. */
  function moveCursor0(index: number) {
    const row = rows0[index]
    setCursor0({ key: row.key, preview: true, at: urlKey })
    listRef.current?.focus({ preventScroll: true })
    document.getElementById(levelZeroOptionId(index))?.scrollIntoView({ block: "nearest" })
  }

  function onKey(intent: BoardKeyIntent, event: KeyboardEvent): boolean {
    const pane = paneRef.current
    const focused = document.activeElement
    const inPane = pane !== null && focused !== null && pane.contains(focused)

    // What `c` and `o` act on: the row under the level-0 cursor, else what
    // the pane shows.
    const target = row0 ? rowSelection(sections, unreadable, row0) : shown

    switch (intent) {
      case "down":
      case "up": {
        const step = intent === "down" ? 1 : -1
        if (inPane) {
          // The focused pane scrolls to its own arrows; `j`/`k`, and arrows
          // pressed on a control inside it, scroll it by the same step.
          if (event.key.startsWith("Arrow") && event.target === pane) return false
          pane.scrollBy({ top: step * PANE_STEP_PX })
          return true
        }
        if (drilled) {
          const tickets = drilled.batch.tickets
          if (tickets.length === 0) return true
          const at = tickets.findIndex((t) => ticketKey(t) === level1Cursor)
          const next =
            at === -1 ? 0 : Math.min(Math.max(at + step, 0), tickets.length - 1)
          const key = ticketKey(tickets[next])
          const selected =
            selection.kind === "ticket" ? ticketKey(selection.ticket) : null
          // In place, not pushed: back steps out of the batch, not back
          // through every stub passed on the way.
          if (key !== selected) correct({ t: key })
          listRef.current?.focus({ preventScroll: true })
          document
            .getElementById(levelOneOptionId(next))
            ?.scrollIntoView({ block: "nearest" })
          return true
        }
        if (rows0.length === 0) return true
        const at = row0 ? rows0.indexOf(row0) : -1
        moveCursor0(at === -1 ? 0 : Math.min(Math.max(at + step, 0), rows0.length - 1))
        return true
      }

      case "open": {
        if (inPane) return false
        if (drilled) {
          if (selection.kind === "ticket") {
            // Nothing changes on screen, so nothing re-renders to pick up a
            // pending focus: move it now.
            pane?.focus({ preventScroll: true })
            return true
          }
          if (!level1Cursor) return true
          navigate({ t: level1Cursor })
          pendingFocus.current = { to: "pane" }
          return true
        }
        if (!row0) return true
        if ("b" in row0.query) {
          setCursor0({ key: row0.key, preview: false, at: row0.key })
          const batch = row0.query.b
          const first = rowSelection(sections, unreadable, row0)
          const firstTicket =
            first.kind === "batch" ? first.batch.tickets[0] : undefined
          setCursor1(firstTicket ? { batch, ticket: ticketKey(firstTicket) } : null)
          navigate({ b: batch })
          pendingFocus.current = { to: "list", level: 1 }
        } else {
          setCursor0({ key: row0.key, preview: false, at: row0.key })
          if (urlKey === row0.key) pane?.focus({ preventScroll: true })
          else {
            navigate({ r: row0.query.r })
            pendingFocus.current = { to: "pane" }
          }
        }
        return true
      }

      case "back": {
        if (inPane) {
          focusList()
          return true
        }
        if (drilled) {
          setCursor1(null)
          back({ t: null })
          pendingFocus.current = { to: "list", level: 0 }
          return true
        }
        if (selection.kind === "none" && !previewing) return false
        if (selection.kind !== "none") navigate({ t: null })
        setCursor0(row0 ? { key: row0.key, preview: false, at: "none" } : null)
        focusList()
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
        if (chipRepos.length === 0) return false
        const stops = [null, ...chipRepos.map((repo) => repo.slug)]
        const step = intent === "nextRepo" ? 1 : -1
        const at = stops.indexOf(repoSlug)
        const next = stops[(at + step + stops.length) % stops.length]
        const hides = next !== null && selectedRepo !== null && selectedRepo !== next
        setFilter(next)
        // The cursor stays on its row while the new filter still shows it,
        // else lands on the first row of what the filter shows now.
        const nextRows = levelZeroRows(
          next ? sections.filter((s) => s.repo.slug === next) : sections
        )
        if (hides || (row0 && !nextRows.some((row) => row.key === row0.key))) {
          setCursor0(
            nextRows[0]
              ? { key: nextRows[0].key, preview: false, at: hides ? "none" : urlKey }
              : null
          )
        }
        if (hides) pendingFocus.current = { to: "list", level: 0 }
        requestAnimationFrame(() =>
          railRef.current
            ?.querySelector('[aria-pressed="true"]')
            ?.scrollIntoView({ block: "nearest", inline: "nearest" })
        )
        return true
      }

      case "help":
        setKeysOpen(true)
        return true
    }
  }

  useBoardKeys(onKey)

  // The list scrolls with the page. Level 0 keeps its place while a batch is
  // open, and a batch opens at its top.
  const level0Scroll = useRef(0)
  const shownLevel = useRef(levelKey)
  useLayoutEffect(() => {
    if (levelKey !== null) return
    const remember = () => {
      level0Scroll.current = window.scrollY
    }
    window.addEventListener("scroll", remember, { passive: true })
    return () => window.removeEventListener("scroll", remember)
  }, [levelKey])
  useLayoutEffect(() => {
    if (shownLevel.current === levelKey) return
    shownLevel.current = levelKey
    window.scrollTo({ top: levelKey === null ? level0Scroll.current : 0 })
  }, [levelKey])

  function setFilter(slug: string | null) {
    // A chip that hides the selection clears it — all of it, which `t: null`
    // does: naming any selection key replaces the whole selection.
    const hides = slug !== null && selectedRepo !== null && selectedRepo !== slug
    navigate({ repo: slug, ...(hides ? { t: null } : {}) })
  }

  if (dbError) {
    return (
      <div className="pt-1 pb-2">
        <GroupedSection>
          <GroupedRow
            icon={<TriangleAlert />}
            label="Database unavailable"
            variant="destructive"
            chevron={false}
          />
          <GroupedBlock>{dbError}</GroupedBlock>
        </GroupedSection>
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <EmptyBoard title="No delivery repos connected">
        Connect one from a lead&rsquo;s profile and its{" "}
        <span className="font-mono">.icm/intake/</span> shows up here.
      </EmptyBoard>
    )
  }

  const overview = (
    <EstateOverview
      figures={boardFigures(board, repoSlug)}
      blocked={ticketsInGroup(board, "blocked", repoSlug)}
      board={{ errors, rosterError, estateCheck: board.estateCheck }}
      onSelectTicket={(key) => navigate({ t: key })}
      onSelectRepo={(slug) => navigate({ r: slug })}
    />
  )

  // What the pane shows, and — on a phone — where its back goes.
  let pane: {
    title: React.ReactNode
    subtitle?: React.ReactNode
    backLabel: React.ReactNode
    parent: BoardQuery
    body: React.ReactNode
    pushed: boolean
  }
  switch (shown.kind) {
    case "ticket": {
      const { section, batch, ticket } = shown
      pane = {
        title: ticket.title,
        subtitle: <TicketSummary ticket={ticket} />,
        backLabel: batch.title,
        parent: { b: batchKey(section, batch) },
        body: (
          <TicketView
            ticket={ticket}
            batch={batch}
            onSelectTicket={(key) => navigate({ t: key })}
          />
        ),
        pushed: true,
      }
      break
    }
    case "batch": {
      const { section, batch } = shown
      pane = {
        title: batch.title,
        subtitle: <BatchSummary section={section} batch={batch} />,
        backLabel: section.repo.slug,
        parent: { b: null },
        body: (
          <BatchView
            batch={batch}
            selectedTicket={null}
            onSelectTicket={(key) => navigate({ t: key })}
          />
        ),
        // On a phone the batch is list level 1 itself — never pushed.
        pushed: false,
      }
      break
    }
    case "repo": {
      const { focus } = shown
      pane = {
        title: <span className="font-mono">{focus.repo.slug}</span>,
        subtitle: focus.repo.clientName ?? "House repo",
        backLabel: "Tickets",
        parent: { r: null },
        body: <RepoView focus={focus} figures={repoFigures(board, focus)} />,
        // A preview is desktop-only (the keyboard's), so it never pushes.
        pushed: preview === null,
      }
      break
    }
    default:
      pane = {
        title: "Overview",
        subtitle: repoSlug ? (
          <>
            Showing <span className="font-mono">{repoSlug}</span>
          </>
        ) : (
          "The whole estate"
        ),
        backLabel: "Tickets",
        parent: {},
        body: overview,
        pushed: false,
      }
  }
  const paneKey = selectionKey(shown)

  return (
    <div className="pt-1 pb-2 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {drilled ? (
          <BatchList
            section={drilled.section}
            batch={drilled.batch}
            cursorKey={level1Cursor}
            listRef={listRef}
            onBackToRepos={() => back({ t: null })}
            onSelectTicket={(key) => navigate({ t: key })}
          />
        ) : (
          <>
            {/* The repo filter rail. An open-ended set that grows with the
                estate, so it stays a rail rather than becoming a segmented
                control — one that scrolls has stopped being one. With nothing
                on the board there is nothing to filter, and a lone "All 0"
                chip is a control that does nothing. */}
            {chipRepos.length > 0 ? (
              <div
                ref={railRef}
                className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0"
              >
                <Chip onClick={() => setFilter(null)} active={!repoSlug} count={total}>
                  All
                </Chip>
                {chipRepos.map((repo) => (
                  <Chip
                    key={repo.slug}
                    onClick={() => setFilter(repo.slug)}
                    active={repoSlug === repo.slug}
                    count={counts[repo.slug] ?? 0}
                  >
                    {repo.slug}
                  </Chip>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-app-section">
              {visibleSections.length === 0 ? (
                total > 0 ? (
                  <EmptyBoard title="Nothing in this repo">
                    Every other ticket is still there —{" "}
                    <button
                      type="button"
                      onClick={() => setFilter(null)}
                      className="text-app-tint underline underline-offset-2"
                    >
                      show the whole board
                    </button>
                    .
                  </EmptyBoard>
                ) : (
                  <EmptyBoard title="Nothing open">
                    Cut some tickets into a repo&rsquo;s{" "}
                    <span className="font-mono">.icm/intake/</span> and they
                    show up here, batch by batch.
                  </EmptyBoard>
                )
              ) : (
                // Level 0's listbox: every repo's header and batches.
                <div
                  ref={listRef}
                  role="listbox"
                  aria-label="Repos and batches"
                  aria-activedescendant={activeOption0}
                  tabIndex={0}
                  className={cn("flex flex-col gap-app-section", LISTBOX_FOCUS)}
                >
                  {visibleSections.map((section) => (
                    <RepoSectionView
                      key={section.repo.fullName}
                      section={section}
                      cursorKey={row0?.key ?? null}
                      repoOpen={
                        selection.kind === "repo" &&
                        selection.focus.repo.slug === section.repo.slug
                      }
                      optionId={(key) => optionIds0.get(key)}
                      onSelectRepo={() => {
                        const key = `r:${section.repo.slug}`
                        setCursor0({ key, preview: false, at: key })
                        navigate({ r: section.repo.slug })
                      }}
                      onSelectBatch={(batch) => {
                        const key = batchKey(section, batch)
                        setCursor0({ key: `b:${key}`, preview: false, at: `b:${key}` })
                        navigate({ b: key })
                      }}
                    />
                  ))}
                </div>
              )}

              {/* On a phone there is no pane to hold the overview, so it is
                  the foot of the list. */}
              <div className="lg:hidden">{overview}</div>
            </div>
          </>
        )}

        {/* The keyboard map is desktop-only, and so is the one quiet hint
            that it exists. */}
        <button
          type="button"
          onClick={() => setKeysOpen(true)}
          className={cn(
            "hidden min-h-app-touch items-center gap-2 self-start rounded-app-control px-2 -ml-2 lg:flex",
            "text-app-footnote text-app-label-3 transition-colors spring-press active:bg-app-press"
          )}
        >
          <Keycap>?</Keycap>
          Keyboard shortcuts
        </button>
      </div>

      <DetailPane
        pushed={pane.pushed}
        title={pane.title}
        subtitle={pane.subtitle}
        backLabel={pane.backLabel}
        onBack={() => back(pane.parent)}
        contentKey={paneKey}
        scrollerRef={paneRef}
      >
        {pane.body}
      </DetailPane>

      <BoardKeysSheet open={keysOpen} onOpenChange={setKeysOpen} />
    </div>
  )
}
