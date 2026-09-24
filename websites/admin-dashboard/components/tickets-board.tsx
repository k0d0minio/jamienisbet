"use client"

import { Fragment } from "react"
import Link from "next/link"
import { Activity, TriangleAlert } from "lucide-react"

import {
  GlanceFigure,
  GlanceRow,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
} from "@jamie-nisbet/ui"

import { BatchRow } from "@/components/batch-row"
import { BoardTicketRow } from "@/components/board-ticket-row"
import { Chip } from "@/components/chip"
import { CopyLaunchRow } from "@/components/launch-menu"
import { RepoMaintenance } from "@/components/repo-maintenance"
import { TicketDetail } from "@/components/ticket-detail"
import { TicketPeek } from "@/components/ticket-peek"
import { useBoardParams } from "@/components/use-board-params"
import type {
  BoardData,
  BoardSection,
  LaunchSet,
  TicketGroup,
} from "@/lib/tickets"

// The estate's work backlog, read batch-first: the "now" group (today's picks,
// runs in flight, what's stuck), then one inset group per repo whose intake has
// anything open, each batch a row that opens into its sequenced stubs.
//
// The board is read once, on the server, and handed over as plain data; from
// then on it lives here. The repo filter is URL state written without a
// navigation (`useBoardParams`), so a chip tap re-derives the board from what
// is already in hand — instantly, with no request — and every ticket body stays
// raw markdown until someone opens it. What brings new data is the refresh
// control in the title bar (BoardRefresh): a tap, or coming back to the app
// after a while away. Either one swaps new props in under whatever is open, and
// anything keyed to a ticket that has gone simply unmounts with it.
//
// This screen is read-only by design — a ticket changes by editing its file in
// the repo — so every button here is either a link or a prompt to copy (or
// open, pre-filled, in a coding tool), and the human sends it. That sentence
// is the board's closing footnote, where a native screen puts the rule that
// governs the whole list.
//
// One codepath from phone to laptop: the same rows simply take more air from
// `md`.

/** The board's caveat, said once, at the foot of the screen. */
const BOARD_FOOTNOTE = (
  <>
    Each repo&apos;s <span className="font-mono">.icm/intake/</span>, read from
    its default branch. A ticket changes by editing its file in the repo, not here — and every
    launcher on this board hands you a prompt to send yourself.
  </>
)

/** The repo filter as the URL states it, if it names a repo on the roster —
 *  anything else reads as the whole board, as a stale bookmark should. */
function useRepoFilter(repoSlugs: string[]) {
  const { repo, setRepo } = useBoardParams()
  return {
    repoSlug: repo && repoSlugs.includes(repo) ? repo : null,
    setRepo,
  }
}

// ---------------------------------------------------------------------------

/**
 * What the board adds up to, as mono figures under the title — for whatever
 * the rail is currently showing. It sits in the title bar's masthead, outside
 * the board itself, so it reads the filter from the URL on its own and takes
 * only the handful of numbers it needs. A figure of nothing is omitted rather
 * than set as a zero: no blocked stubs is not news, it is a good day.
 */
export function BoardFigures({
  repoSlugs,
  strip,
  open,
}: {
  repoSlugs: string[]
  /** The now-strip, reduced to which repo and which group. */
  strip: { repo: string; group: TicketGroup }[]
  /** Open backlog per repo section. */
  open: { repo: string; open: number }[]
}) {
  const { repoSlug } = useRepoFilter(repoSlugs)
  const inView = <T extends { repo: string }>(rows: T[]) =>
    repoSlug ? rows.filter((r) => r.repo === repoSlug) : rows
  const inGroup = (group: TicketGroup): number =>
    inView(strip).filter((t) => t.group === group).length

  const figures = [
    { key: "today", value: inGroup("today"), label: "Today" },
    { key: "blocked", value: inGroup("blocked"), label: "Blocked" },
    {
      key: "open",
      // Runs in flight live on the strip rather than in a batch, so this is
      // the backlog: what is still waiting to be picked up.
      value: inView(open).reduce((total, s) => total + s.open, 0),
      label: "Open",
    },
  ].filter((f) => f.value > 0)

  if (figures.length === 0) return null
  return (
    <GlanceRow>
      {figures.map((figure) => (
        <GlanceFigure key={figure.key} value={figure.value} label={figure.label} />
      ))}
    </GlanceRow>
  )
}

// ---------------------------------------------------------------------------

function RepoSectionView({ section }: { section: BoardSection }) {
  const { repo } = section
  return (
    <GroupedSection
      header={
        <span className="flex items-baseline gap-2">
          {/* A repo slug is a machine identifier, so it sets in mono. */}
          <span className="truncate font-mono font-medium text-app-label-2">
            {repo.slug}
          </span>
          {repo.clientId ? (
            <Link
              href={`/leads/${repo.clientId}`}
              className="truncate text-app-tint underline underline-offset-2"
            >
              {repo.clientName}
            </Link>
          ) : null}
          <span className="ml-auto shrink-0 font-mono tabular-nums">
            {section.open} open
          </span>
        </span>
      }
    >
      <ul>
        {section.batches.map((batch, index) => (
          <BatchRow
            key={batch.slug}
            first={index === 0}
            repoSlug={repo.slug}
            clientHref={repo.clientId ? `/leads/${repo.clientId}` : null}
            batch={{
              slug: batch.slug,
              kind: batch.kind,
              title: batch.title,
              htmlUrl: batch.htmlUrl,
              planned: batch.planned,
              done: batch.done,
              open: batch.tickets.length,
              todayCount: batch.todayCount,
              blockedCount: batch.blockedCount,
              p0Count: batch.p0Count,
            }}
            next={
              batch.next
                ? {
                    title: batch.next.title,
                    // The verb where the repo carries the router, the prompt
                    // body where it does not — what "Copy next" puts on the
                    // clipboard (D26).
                    prompt: batch.next.pickup,
                  }
                : null
            }
            recut={batch.recut}
          >
            {batch.tickets.map((ticket, stubIndex) => (
              <BoardTicketRow
                key={ticket.path}
                first={stubIndex === 0}
                ticket={ticket}
              >
                <TicketDetail ticket={ticket} launches={ticket.launches} />
              </BoardTicketRow>
            ))}
          </BatchRow>
        ))}
      </ul>
      {/* The housekeeping that applies to the whole repo, at the foot of its
          group — where a native list puts a group-level action. */}
      <RepoMaintenance
        repoSlug={repo.slug}
        repoUrl={`https://github.com/${repo.fullName}`}
        launchers={section.maintenance}
      />
    </GroupedSection>
  )
}

/** The board's own maintenance, and the rule the whole screen obeys. */
function BoardGroup({ launch }: { launch: LaunchSet }) {
  return (
    <GroupedSection footer={BOARD_FOOTNOTE}>
      <CopyLaunchRow
        icon={<Activity />}
        label="Estate check"
        description="A consistency pass across every repo"
        prompt={launch.prompt}
        launches={launch.launches}
      />
    </GroupedSection>
  )
}

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

export function TicketsBoard({ board }: { board: BoardData }) {
  const { repos, counts, total, sections, strip, errors, rosterError, dbError } =
    board
  const { repoSlug, setRepo } = useRepoFilter(repos.map((r) => r.slug))

  const visibleSections = repoSlug
    ? sections.filter((s) => s.repo.slug === repoSlug)
    : sections
  const visibleStrip = repoSlug
    ? strip.filter((t) => t.repo.slug === repoSlug)
    : strip

  // The roster is every owner repo; only repos with something on the board get
  // a chip, so the rail doesn't drown in empty client stubs.
  const chipRepos = repos.filter((repo) => (counts[repo.slug] ?? 0) > 0)

  return (
    <div className="flex flex-col gap-5 pt-1 pb-2">
      {dbError ? (
        <GroupedSection>
          <GroupedRow
            icon={<TriangleAlert />}
            label="Database unavailable"
            variant="destructive"
            chevron={false}
          />
          <GroupedBlock>{dbError}</GroupedBlock>
        </GroupedSection>
      ) : repos.length === 0 ? (
        <EmptyBoard title="No delivery repos connected">
          Connect one from a lead&rsquo;s profile and its{" "}
          <span className="font-mono">.icm/intake/</span> shows up here.
        </EmptyBoard>
      ) : (
        <>
          {/* The repo filter rail. An open-ended set that grows with the
              estate, so it stays a rail rather than becoming a segmented
              control — one that scrolls has stopped being one. With nothing
              on the board there is nothing to filter, and a lone "All 0"
              chip is a control that does nothing. */}
          {chipRepos.length > 0 ? (
            <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
              <Chip
                onClick={() => setRepo(null)}
                active={!repoSlug}
                count={total}
              >
                All
              </Chip>
              {chipRepos.map((repo) => (
                <Chip
                  key={repo.slug}
                  onClick={() => setRepo(repo.slug)}
                  active={repoSlug === repo.slug}
                  count={counts[repo.slug] ?? 0}
                >
                  {repo.slug}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-app-section">
            {/* One group for everything the reads couldn't get. The roster
                call leads it when it was the thing that failed: a board
                standing on its pinned repos alone looks like an estate with
                no work, which is how a spent rate limit once passed for
                broken repos. Under it, each repo that couldn't be reached is
                named with what GitHub said, and the rest of the board
                stands. */}
            {rosterError || errors.length > 0 ? (
              <GroupedSection header="Couldn't be read">
                {rosterError ? (
                  <>
                    <GroupedRow
                      icon={<TriangleAlert />}
                      variant="destructive"
                      label="The estate's repo list"
                      chevron={false}
                    />
                    {/* Our sentence first: what GitHub said arrives with
                        its own punctuation, or none. */}
                    <GroupedBlock>
                      Only the repos this board pins are below. {rosterError}
                    </GroupedBlock>
                  </>
                ) : null}
                {errors.map((error) => (
                  <Fragment key={error.repo.fullName}>
                    <GroupedRow
                      icon={<TriangleAlert />}
                      variant="destructive"
                      label={<span className="font-mono">{error.repo.slug}</span>}
                      chevron={false}
                    />
                    {/* What GitHub said, in full. As a row's description it
                        truncated on a phone, and half an error message is
                        worse than none. */}
                    <GroupedBlock>{error.message}</GroupedBlock>
                  </Fragment>
                ))}
              </GroupedSection>
            ) : null}

            {/* The now-strip: today's picks, runs in flight, what's stuck —
                estate-wide, one glance, and the screen's leading group. */}
            {visibleStrip.length > 0 ? (
              <GroupedSection
                header="Now"
                footer="Today's picks, runs in flight, and anything stuck. Tap one to read the whole ticket."
              >
                {visibleStrip.map((ticket) => (
                  <TicketPeek
                    key={`${ticket.repo.fullName}/${ticket.path}`}
                    ticket={ticket}
                  >
                    <TicketDetail ticket={ticket} launches={ticket.launches} />
                  </TicketPeek>
                ))}
              </GroupedSection>
            ) : null}

            {visibleSections.length === 0 && visibleStrip.length === 0 ? (
              total > 0 ? (
                <EmptyBoard title="Nothing in this repo">
                  Every other ticket is still there —{" "}
                  <button
                    type="button"
                    onClick={() => setRepo(null)}
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
                <RepoSectionView key={section.repo.fullName} section={section} />
              ))
            )}

            <BoardGroup launch={board.estateCheck} />
          </div>
        </>
      )}
    </div>
  )
}
