"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react"

import { GroupedBlock, GroupedRow, GroupedSection, cn } from "@jamie-nisbet/ui"

import { BatchLine, BatchRow } from "@/components/batch-row"
import {
  batchKey,
  boardFigures,
  resolveSelection,
  ticketKey,
  type ListBatch,
  type ListSection,
  type Selection,
} from "@/components/board-model"
import { DetailPane } from "@/components/board-pane"
import { BoardTicketRow } from "@/components/board-ticket-row"
import {
  BatchView,
  EstateOverview,
  RepoView,
  TicketView,
} from "@/components/board-views"
import { Chip } from "@/components/chip"
import { ACTIVE_ROW } from "@/components/ticket-look"
import { TicketSummary } from "@/components/ticket-detail"
import { useBoardParams, type BoardQuery } from "@/components/use-board-params"
import type { BoardData } from "@/lib/tickets"

// The estate's work backlog as a master–detail view: a list that drills and a
// pane that swaps.
//
// The list has two levels. Level 0 is the repos — the chip rail that filters
// them, then one inset group per repo in urgency order, its header opening the
// repo, a row per epic plus Triage, Backlog and In flight. Selecting a batch
// pushes the list to level 1: that batch's tickets under a way back to the
// repos. From `lg` the pane stands beside the list and shows whatever is
// selected — a ticket, a batch, a repo, or the estate overview when nothing
// is; below it a selection is pushed full screen over the list (DetailPane).
//
// The board is read once, on the server, and handed over as plain data; from
// then on it lives here. Every selection and the repo filter are URL state
// written without a navigation (`useBoardParams`), resolved from the URL on
// every render (`resolveSelection`) — so a deep link restores the whole view,
// back/forward step through it, and a tap needs no request. What brings new
// data is the refresh control in the title bar (BoardRefresh); a selection
// whose ticket went with it falls back to its batch, or to nothing.
//
// This screen is read-only by design — a ticket changes by editing its file in
// the repo — so every button here is either a link or a prompt to copy (or
// open, pre-filled, in a coding tool), and the human sends it.

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

const LIST_HEADER: Record<ListBatch["kind"], string> = {
  epic: "Stubs, in sequence",
  triage: "Tickets, by priority",
  backlog: "Tickets, by priority",
  runs: "Runs in flight",
}

// ---------------------------------------------------------------------------
// List level 0 — the repos.

function RepoSectionView({
  section,
  selection,
  onSelectRepo,
  onSelectBatch,
}: {
  section: ListSection
  selection: Selection
  onSelectRepo: () => void
  onSelectBatch: (batch: ListBatch) => void
}) {
  const { repo } = section
  const repoActive =
    selection.kind === "repo" && selection.section.repo.slug === repo.slug
  const runs = section.batches.find((b) => b.kind === "runs")?.tickets.length ?? 0
  return (
    <GroupedSection
      header={
        // The header is the repo's row: a tap opens it (its client, its
        // maintenance). A 44px target that still reads as a group's header.
        <button
          type="button"
          onClick={onSelectRepo}
          aria-current={repoActive ? "true" : undefined}
          className={cn(
            "-mx-2 flex min-h-app-touch w-[calc(100%_+_1rem)] items-center gap-2 rounded-app-control px-2 text-left",
            "transition-colors spring-press active:bg-app-press",
            repoActive && ACTIVE_ROW
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
      <ul>
        {section.batches.map((batch, index) => (
          <BatchRow
            key={batch.slug}
            first={index === 0}
            batch={batch}
            clientHref={repo.clientId ? `/leads/${repo.clientId}` : null}
            onSelect={() => onSelectBatch(batch)}
          />
        ))}
      </ul>
    </GroupedSection>
  )
}

// ---------------------------------------------------------------------------
// List level 1 — one batch's tickets.

function BatchList({
  section,
  batch,
  selection,
  onBackToRepos,
  onOpenBatch,
  onSelectTicket,
}: {
  section: ListSection
  batch: ListBatch
  selection: Selection
  onBackToRepos: () => void
  onOpenBatch: () => void
  onSelectTicket: (key: string) => void
}) {
  const selectedTicket =
    selection.kind === "ticket" ? ticketKey(selection.ticket) : null
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

      {/* On a phone there is no pane beside the list, so the batch itself is
          the first row: its scan line, and a tap pushes its view — Copy next,
          Recut, GitHub. From `lg` the pane is already showing it. */}
      <GroupedSection className="lg:hidden">
        <button
          type="button"
          onClick={onOpenBatch}
          className={cn(
            "flex min-h-app-touch w-full flex-col justify-center gap-1.5 px-4 py-3 text-left",
            "transition-colors spring-press active:bg-app-press md:px-5 md:py-3.5"
          )}
        >
          <BatchLine batch={batch} />
        </button>
      </GroupedSection>

      <GroupedSection header={LIST_HEADER[batch.kind]}>
        <ul>
          {batch.tickets.map((ticket, index) => (
            <BoardTicketRow
              key={ticket.path}
              first={index === 0}
              ticket={ticket}
              active={selectedTicket === ticketKey(ticket)}
              onSelect={() => onSelectTicket(ticketKey(ticket))}
            />
          ))}
        </ul>
      </GroupedSection>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function TicketsBoard({ board }: { board: BoardData }) {
  const { repos, counts, total, errors, rosterError, dbError, sections } = board
  const params = useBoardParams()
  const { navigate, correct, back } = params

  const { selection, correction } = resolveSelection(sections, params)

  // The filter as the URL states it, if it names a repo on the roster —
  // anything else reads as the whole board, as a stale bookmark should. A
  // selection in a repo the filter hides wins: the filter is dropped rather
  // than the selection shown against a list that doesn't hold it.
  const selectedRepo = selection.kind === "none" ? null : selection.section.repo.slug
  const named =
    params.repo && repos.some((r) => r.slug === params.repo) ? params.repo : null
  const filterConflict = named !== null && selectedRepo !== null && named !== selectedRepo
  const repoSlug = filterConflict ? null : named

  // A stale or conflicting URL is corrected in place — the view already shows
  // the fallback; this makes the address say so, without a new history entry.
  const fix: BoardQuery | null =
    correction || filterConflict
      ? { ...correction, ...(filterConflict ? { repo: null } : {}) }
      : null
  const fixKey = fix ? JSON.stringify(fix) : null
  useEffect(() => {
    if (fixKey) correct(JSON.parse(fixKey) as BoardQuery)
  }, [fixKey, correct])

  // Level 1 is a batch's tickets: a batch selected, or a ticket in one.
  const drilled =
    selection.kind === "batch" || selection.kind === "ticket" ? selection : null
  const levelKey = drilled ? batchKey(drilled.section, drilled.batch) : null

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

  const visibleSections = repoSlug
    ? sections.filter((s) => s.repo.slug === repoSlug)
    : sections

  // The roster is every owner repo; only repos with something on the board get
  // a chip, so the rail doesn't drown in empty client stubs.
  const chipRepos = repos.filter((repo) => (counts[repo.slug] ?? 0) > 0)

  const figures = boardFigures(board, repoSlug)
  const overview = (
    <EstateOverview
      figures={figures}
      board={{ errors, rosterError, estateCheck: board.estateCheck }}
    />
  )

  function setFilter(slug: string | null) {
    // A chip that hides the selection clears it.
    const hides = slug !== null && selectedRepo !== null && selectedRepo !== slug
    navigate({ repo: slug, ...(hides ? { t: null } : {}) })
  }

  // What the pane shows, and — on a phone — where its back goes.
  let pane: {
    title: React.ReactNode
    subtitle?: React.ReactNode
    backLabel: React.ReactNode
    parent: BoardQuery
    body: React.ReactNode
    pushed: boolean
  }
  switch (selection.kind) {
    case "ticket": {
      const { section, batch, ticket } = selection
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
      const { section, batch } = selection
      pane = {
        title: batch.title,
        subtitle: (
          <>
            <span className="font-mono">{section.repo.slug}</span>
            {" · "}
            <span className="font-mono tabular-nums">{batch.tickets.length}</span>
            {batch.kind === "runs" ? " in flight" : " open"}
            {batch.planned !== null ? (
              <>
                {" · "}
                <span className="font-mono tabular-nums">
                  {batch.done} of {batch.planned}
                </span>{" "}
                done
              </>
            ) : null}
          </>
        ),
        backLabel: batch.title,
        parent: { b: batchKey(section, batch) },
        body: <BatchView batch={batch} />,
        // On a phone the batch is list level 1; its view is pushed over that
        // only when its summary row asked for it.
        pushed: params.pane,
      }
      break
    }
    case "repo": {
      const { section } = selection
      pane = {
        title: <span className="font-mono">{section.repo.slug}</span>,
        subtitle: section.repo.clientName ?? "House repo",
        backLabel: "Tickets",
        parent: { r: null },
        body: <RepoView section={section} />,
        pushed: true,
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
  const paneKey =
    selection.kind === "none"
      ? "none"
      : selection.kind === "ticket"
        ? `t:${ticketKey(selection.ticket)}`
        : selection.kind === "batch"
          ? `b:${batchKey(selection.section, selection.batch)}`
          : `r:${selection.section.repo.slug}`

  return (
    <div className="pt-1 pb-2 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {drilled ? (
          <BatchList
            section={drilled.section}
            batch={drilled.batch}
            selection={selection}
            onBackToRepos={() => back({ t: null })}
            onOpenBatch={() =>
              navigate({ b: batchKey(drilled.section, drilled.batch), pane: "1" })
            }
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
              <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
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
                visibleSections.map((section) => (
                  <RepoSectionView
                    key={section.repo.fullName}
                    section={section}
                    selection={selection}
                    onSelectRepo={() => navigate({ r: section.repo.slug })}
                    onSelectBatch={(batch) => navigate({ b: batchKey(section, batch) })}
                  />
                ))
              )}

              {/* On a phone there is no pane to hold the overview, so it is
                  the foot of the list. */}
              <div className="lg:hidden">{overview}</div>
            </div>
          </>
        )}
      </div>

      <DetailPane
        pushed={pane.pushed}
        title={pane.title}
        subtitle={pane.subtitle}
        backLabel={pane.backLabel}
        onBack={() => back(pane.parent)}
        contentKey={paneKey}
      >
        {pane.body}
      </DetailPane>
    </div>
  )
}
