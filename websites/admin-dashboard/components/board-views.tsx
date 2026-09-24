"use client"

import { Fragment } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Activity,
  Copy,
  GitBranch,
  House,
  Scissors,
  TriangleAlert,
  UserRound,
} from "lucide-react"

import {
  GlanceFigure,
  GlanceRow,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  Meter,
} from "@jamie-nisbet/ui"

import { ticketKey, type ListBatch, type ListSection } from "@/components/board-model"
import { BoardTicketRow } from "@/components/board-ticket-row"
import { CopyLaunchRow, CopySplitButton } from "@/components/launch-menu"
import { RepoMaintenance } from "@/components/repo-maintenance"
import { TicketDetail } from "@/components/ticket-detail"
import { primaryLaunch } from "@/lib/launchers"
import type { BoardData, BoardTicket, LaunchSet } from "@/lib/tickets"

// The renderer arrives with the first breakdown or ticket opened, not with the
// board — react-markdown is the heaviest thing either needs.
const Markdown = dynamic(() =>
  import("@/components/markdown").then((m) => m.Markdown)
)

// What the board's pane shows — one view per kind of selection, plus the
// estate overview for when there is none. The batch view is the epic's own:
// its progress, its actions, its tickets and its breakdown, in pieces the
// phone's list level 1 lays out in its own order. The ticket view is the
// existing TicketDetail; the repo and overview views carry what the board
// showed before the master–detail layout (a repo's maintenance, the masthead
// figures and the read errors), so nothing that was reachable stopped being
// reachable. Their own designs come later in the tickets-master-detail epic
// (stubs 3 and 5).

/** The board's caveat, said once, at the foot of the overview. */
const BOARD_FOOTNOTE = (
  <>
    Each repo&apos;s <span className="font-mono">.icm/intake/</span>, read from
    its default branch. A ticket changes by editing its file in the repo, not here — and every
    launcher on this board hands you a prompt to send yourself.
  </>
)

export function TicketView({ ticket }: { ticket: BoardTicket }) {
  return (
    <GroupedSection>
      <div className="px-4 py-4">
        <TicketDetail ticket={ticket} launches={ticket.launches} />
      </div>
    </GroupedSection>
  )
}

/** A batch's scan line — where it lives, how far it has got, what's open:
 *  the pane's subtitle, and the phone's level-1 header. */
export function BatchSummary({
  section,
  batch,
}: {
  section: ListSection
  batch: ListBatch
}) {
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

/** The thin progress bar under an epic's title — what the breakdown planned
 *  against what is still open. Nothing for a batch with no plan. */
export function BatchMeter({ batch }: { batch: ListBatch }) {
  if (batch.planned === null) return null
  return (
    <Meter
      value={batch.done}
      max={batch.planned}
      size="sm"
      aria-label={`${batch.done} of ${batch.planned} done`}
    />
  )
}

const LIST_HEADER: Record<ListBatch["kind"], string> = {
  epic: "Stubs, in sequence",
  triage: "Tickets, by priority",
  backlog: "Tickets, by priority",
  runs: "Runs in flight",
}

/** A batch's tickets as level-1 rows — the list's own, and the epic view's.
 *  A tap selects the ticket; the swipes are the row's. */
export function BatchTickets({
  batch,
  selectedTicket,
  onSelectTicket,
}: {
  batch: ListBatch
  /** The selected ticket's key (`ticketKey`), if any, for its highlight. */
  selectedTicket: string | null
  onSelectTicket: (key: string) => void
}) {
  return (
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
  )
}

/** A batch's own actions: copy what's next, recut the epic, open the folder —
 *  the same actions its row's swipes carry, for the thumb that would rather
 *  tap than aim. */
export function BatchActions({ batch }: { batch: ListBatch }) {
  // The next ticket in full, for its launch targets — `next` carries only
  // what a list row needs.
  const next = batch.next
    ? (batch.tickets.find((t) => t.id === batch.next?.id) ?? null)
    : null
  const recommendation = next ? (primaryLaunch(next.launches)?.hint ?? null) : null
  return (
    <GroupedSection
      footer={
        batch.recut
          ? "A recut copies a prompt for a session that re-grounds the breakdown in the current state of the code. You send it."
          : undefined
      }
    >
      {next?.pickup ? (
        // The same split button the ticket itself carries: the pick-up on the
        // clipboard, every tool behind the chevron. The row says which stub
        // that is, and the model it is recommended on.
        <GroupedRow
          icon={<Copy />}
          label={next.title}
          description={
            recommendation ? (
              <>
                Next · recommended{" "}
                <span className="font-mono">{recommendation}</span>
              </>
            ) : (
              "Next"
            )
          }
          chevron={false}
          accessory={
            <CopySplitButton
              value={next.pickup}
              label="Copy next"
              what={next.pickupKind === "verb" ? "Pick-up verb" : "Prompt"}
              launches={next.launches}
            />
          }
        />
      ) : null}
      {batch.recut ? (
        // Tinted: re-grounding the epic is this view's affirmative action.
        <CopyLaunchRow
          icon={<Scissors />}
          variant="tint"
          label="Recut this batch"
          description="Refresh, resequence, split, retire"
          prompt={batch.recut.prompt}
          launches={batch.recut.launches}
        />
      ) : null}
      <GroupedRow
        icon={<GitBranch />}
        label={batch.kind === "runs" ? "Open the runs on GitHub" : "Open on GitHub"}
        href={batch.htmlUrl}
        target="_blank"
        rel="noreferrer"
        chevron={false}
      />
    </GroupedSection>
  )
}

/** The view's title stands in for the breakdown's own `# ` line. */
function withoutTitle(markdown: string): string {
  return markdown.replace(/^\s*# [^\n]*\n*/, "")
}

/** An epic's breakdown, rendered — what was understood, what was decided, the
 *  build order. A quiet line where the epic has none; nothing for the
 *  pseudo-batches, which never do. */
export function BatchBreakdown({ batch }: { batch: ListBatch }) {
  if (batch.kind !== "epic") return null
  if (batch.breakdown === null) {
    return (
      <p className="px-4 text-app-footnote text-app-label-3">
        No <span className="font-mono">breakdown.md</span> in this epic.
      </p>
    )
  }
  return (
    <GroupedSection header="Breakdown">
      <div className="px-4 py-4 md:px-5">
        <Markdown>{withoutTitle(batch.breakdown)}</Markdown>
      </div>
    </GroupedSection>
  )
}

/** The batch in the pane: its progress, its actions, its tickets, and — for
 *  an epic — the breakdown. The title and scan line are the pane's own. */
export function BatchView({
  batch,
  selectedTicket,
  onSelectTicket,
}: {
  batch: ListBatch
  selectedTicket: string | null
  onSelectTicket: (key: string) => void
}) {
  return (
    <>
      <BatchMeter batch={batch} />
      <BatchActions batch={batch} />
      <BatchTickets
        batch={batch}
        selectedTicket={selectedTicket}
        onSelectTicket={onSelectTicket}
      />
      <BatchBreakdown batch={batch} />
    </>
  )
}

/** The repo: who it is for, and the housekeeping its intake needs. */
export function RepoView({ section }: { section: ListSection }) {
  const { repo } = section
  return (
    <>
      <GroupedSection>
        {repo.clientId ? (
          // The join back to the big picture is one tap.
          <GroupedRow
            asChild
            icon={<UserRound />}
            label={repo.clientName ?? "Client"}
            description="The client this repo delivers for"
          >
            <Link href={`/leads/${repo.clientId}`} />
          </GroupedRow>
        ) : (
          <GroupedRow
            icon={<House />}
            label="House repo"
            description="It belongs to no client"
            chevron={false}
          />
        )}
      </GroupedSection>
      <RepoMaintenance
        repoUrl={`https://github.com/${repo.fullName}`}
        launchers={section.maintenance}
      />
    </>
  )
}

/** What the estate adds up to, what couldn't be read, and the board's own
 *  maintenance — the pane when nothing is selected, the foot of the list on a
 *  phone. */
export function EstateOverview({
  figures,
  board,
}: {
  figures: { key: string; value: number; label: string }[]
  board: Pick<BoardData, "errors" | "rosterError" | "estateCheck">
}) {
  const { errors, rosterError } = board
  return (
    <div className="flex flex-col gap-app-section">
      {/* Mono figures for whatever the rail is showing. */}
      {figures.length > 0 ? (
        <GlanceRow>
          {figures.map((figure) => (
            <GlanceFigure key={figure.key} value={figure.value} label={figure.label} />
          ))}
        </GlanceRow>
      ) : null}

      {/* One group for everything the reads couldn't get. The roster call
          leads it when it was the thing that failed: a board standing on its
          pinned repos alone looks like an estate with no work, which is how a
          spent rate limit once passed for broken repos. Under it, each repo
          that couldn't be reached is named with what GitHub said, and the
          rest of the board stands. */}
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
              {/* Our sentence first: what GitHub said arrives with its own
                  punctuation, or none. */}
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
                  truncated on a phone, and half an error message is worse
                  than none. */}
              <GroupedBlock>{error.message}</GroupedBlock>
            </Fragment>
          ))}
        </GroupedSection>
      ) : null}

      <EstateCheck launch={board.estateCheck} />
    </div>
  )
}

/** The board's own maintenance, and the rule the whole screen obeys. */
function EstateCheck({ launch }: { launch: LaunchSet }) {
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
