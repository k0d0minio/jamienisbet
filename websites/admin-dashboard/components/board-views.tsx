"use client"

import { Fragment } from "react"
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

import { copyPrompt } from "@/components/board-ticket-row"
import { ticketKey, type ListBatch, type ListSection } from "@/components/board-model"
import { CopyLaunchRow } from "@/components/launch-menu"
import { RepoMaintenance } from "@/components/repo-maintenance"
import { TicketDetail } from "@/components/ticket-detail"
import type { BoardData, BoardTicket, LaunchSet } from "@/lib/tickets"

// What the board's pane shows — one view per kind of selection, plus the
// estate overview for when there is none. The ticket view is TicketDetail
// (its summary line is the pane's subtitle); the batch, repo and overview views carry what the board showed
// before the master–detail layout (the batch sheet's launchers, a repo's
// maintenance, the masthead figures and the read errors), so nothing that was
// reachable stopped being reachable. Their own designs come later in the
// tickets-master-detail epic (stubs 3–5).

/** The board's caveat, said once, at the foot of the overview. */
const BOARD_FOOTNOTE = (
  <>
    Each repo&apos;s <span className="font-mono">.icm/intake/</span>, read from
    its default branch. A ticket changes by editing its file in the repo, not here — and every
    launcher on this board hands you a prompt to send yourself.
  </>
)

export function TicketView({
  ticket,
  batch,
  onSelectTicket,
}: {
  ticket: BoardTicket
  /** The batch it was opened from — its tickets are what a `depends-on`
   *  slug can link to. */
  batch: ListBatch
  onSelectTicket: (key: string) => void
}) {
  // A stub's id is `<epic>/<slug>` and `depends-on` names the bare slug; only
  // the epic's own open tickets are on the board to link to.
  const dependencyKeys = new Map(
    batch.tickets
      .filter((t) => t.kind === "stub" && t !== ticket)
      .map((t): [string, string] => [t.id.slice(t.id.lastIndexOf("/") + 1), ticketKey(t)])
  )
  return (
    <GroupedSection>
      <div className="px-4 py-4">
        <TicketDetail
          ticket={ticket}
          launches={ticket.launches}
          dependencyKeys={dependencyKeys}
          onSelectTicket={onSelectTicket}
        />
      </div>
    </GroupedSection>
  )
}

/** A batch's own actions — the ones its sheet used to carry: copy what's
 *  next, recut the epic, open the folder. The same actions its row's swipes
 *  carry, for the thumb that would rather tap than aim. */
export function BatchView({ batch }: { batch: ListBatch }) {
  const nextPrompt = batch.next?.pickup ?? null
  return (
    <>
      {batch.planned !== null ? (
        <Meter
          value={batch.done}
          max={batch.planned}
          size="sm"
          aria-label={`${batch.done} of ${batch.planned} done`}
        />
      ) : null}
      <GroupedSection
        footer={
          batch.recut
            ? "A recut copies a prompt for a session that re-grounds the breakdown in the current state of the code. You send it."
            : undefined
        }
      >
        {batch.next && nextPrompt ? (
          <GroupedRow
            icon={<Copy />}
            label="Copy next"
            description={batch.next.title}
            onClick={() => void copyPrompt(nextPrompt)}
            chevron={false}
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
          label={
            batch.kind === "runs" ? "Open the runs on GitHub" : "Open the batch on GitHub"
          }
          href={batch.htmlUrl}
          target="_blank"
          rel="noreferrer"
          chevron={false}
        />
      </GroupedSection>
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
