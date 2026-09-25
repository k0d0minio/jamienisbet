"use client"

import { Fragment } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Activity, Copy, GitBranch, House, Scissors, TriangleAlert, UserRound } from "lucide-react"

import {
  PriorityTag,
  RecordBlock,
  RecordRow,
  RecordSection,
  StatusDot,
} from "@jamie-nisbet/ui"

import {
  blockedReason,
  ticketKey,
  type Figure,
  type ListBatch,
  type RepoFocus,
} from "@/components/board-model"
import { DeskCopyButton, DeskLaunchMenu, EpicMeter } from "@/components/ticket-reader"
import { copyToClipboard } from "@/lib/clipboard"
import { primaryLaunch, type Launch } from "@/lib/launchers"
import type { BoardData, BoardTicket, LaunchSet, TicketFetchError } from "@/lib/tickets"

// Work's pane three at the desk when what is selected is not a ticket — an
// epic or pile, a repo, or nothing (the estate overview) — on the desk tier
// (spec work-reader §1): record sections under mono eyebrows, hairlines, mono
// figures, no grouped slabs. The phone's repo level (work-phone.tsx) draws the
// repo view too.

const Markdown = dynamic(() =>
  import("@/components/markdown").then((m) => m.Markdown)
)

/** The board's caveat, said once, at the foot of the overview. */
const BOARD_FOOTNOTE = (
  <>
    Each repo&apos;s <span className="font-mono">.icm/intake/</span>, read from its default
    branch. A ticket changes by editing its file in the repo, not here — and every launcher on
    this board hands you a prompt to send yourself.
  </>
)

const LIST_HEADER: Record<ListBatch["kind"], string> = {
  epic: "Stubs, in sequence",
  triage: "Tickets, by priority",
  backlog: "Tickets, by priority",
  runs: "Runs in flight",
}

/** Mono figures in a row — what a view adds up to. */
function Figures({ figures }: { figures: Figure[] }) {
  if (figures.length === 0) return null
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {figures.map((figure) => (
        <div key={figure.key} className="flex flex-col-reverse">
          <dt className="text-desk-meta text-desk-fg-3">{figure.label}</dt>
          <dd className="font-mono text-desk-figure tabular-nums text-desk-fg">{figure.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** A row whose click copies a prompt, with the tools one chevron away — the
 *  maintenance, recut and estate-check launchers. */
function CopyLaunchRecord({
  icon,
  label,
  description,
  variant,
  prompt,
  launches,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  variant?: "default" | "tint"
  prompt: string
  launches: Launch[]
}) {
  return (
    <RecordRow
      icon={icon}
      label={label}
      description={description}
      variant={variant}
      value={<span className="text-desk-meta text-desk-fg-3">Copy</span>}
      onClick={() => void copyToClipboard(prompt, "Prompt")}
      accessory={
        launches.length > 0 ? (
          <DeskLaunchMenu launches={launches} label={`${label} — open in a tool`} />
        ) : undefined
      }
    />
  )
}

/** A ticket as a record row: its state, its title, its priority. */
function TicketRecord({ ticket, onSelect }: { ticket: BoardTicket; onSelect: () => void }) {
  return (
    <RecordRow
      icon={<StatusDot status={ticket.status} />}
      label={
        <span className="text-desk-fg">
          {ticket.sequence !== null ? (
            <span className="mr-2 font-mono text-desk-meta text-desk-fg-3">{ticket.sequence}</span>
          ) : null}
          {ticket.title}
        </span>
      }
      value={<PriorityTag priority={ticket.priority} />}
      onClick={onSelect}
    />
  )
}

/** An epic or a pile: its progress, its actions, its tickets and — for an
 *  epic — its breakdown. The title and scan line are the pane's. */
export function DeskBatchView({
  batch,
  onSelectTicket,
}: {
  batch: ListBatch
  onSelectTicket: (key: string) => void
}) {
  const next = batch.next ? (batch.tickets.find((t) => t.id === batch.next?.id) ?? null) : null
  const recommendation = next ? (primaryLaunch(next.launches)?.hint ?? null) : null
  return (
    <>
      {batch.planned !== null ? <EpicMeter done={batch.done} total={batch.planned} /> : null}
      <RecordSection
        header="Actions"
        footer={
          batch.recut
            ? "A recut copies a prompt for a session that re-grounds the breakdown in the current state of the code. You send it."
            : undefined
        }
      >
        {next?.pickup ? (
          <RecordRow
            icon={<Copy />}
            label={next.title}
            description={
              recommendation ? (
                <>
                  Next · recommended <span className="font-mono">{recommendation}</span>
                </>
              ) : (
                "Next"
              )
            }
            accessory={
              <span className="flex items-center gap-1">
                <DeskCopyButton
                  value={next.pickup}
                  what={next.pickupKind === "verb" ? "Pick-up verb" : "Prompt"}
                  label="Copy next"
                />
                {next.launches.length > 0 ? <DeskLaunchMenu launches={next.launches} /> : null}
              </span>
            }
          />
        ) : null}
        {batch.recut ? (
          <CopyLaunchRecord
            icon={<Scissors />}
            variant="tint"
            label="Recut this batch"
            description="Refresh, resequence, split, retire"
            prompt={batch.recut.prompt}
            launches={batch.recut.launches}
          />
        ) : null}
        <RecordRow
          icon={<GitBranch />}
          label={batch.kind === "runs" ? "Open the runs on GitHub" : "Open on GitHub"}
          href={batch.htmlUrl}
          target="_blank"
          rel="noreferrer"
        />
      </RecordSection>
      <RecordSection header={LIST_HEADER[batch.kind]}>
        {batch.tickets.length === 0 ? (
          <RecordBlock>Nothing open here.</RecordBlock>
        ) : (
          batch.tickets.map((ticket) => (
            <TicketRecord
              key={ticket.path}
              ticket={ticket}
              onSelect={() => onSelectTicket(ticketKey(ticket))}
            />
          ))
        )}
      </RecordSection>
      {batch.kind === "epic" ? (
        batch.breakdown === null ? (
          <p className="text-desk-meta text-desk-fg-3">
            No <span className="font-mono">breakdown.md</span> in this epic.
          </p>
        ) : (
          <RecordSection header="Breakdown">
            <Markdown>{batch.breakdown.replace(/^\s*# [^\n]*\n*/, "")}</Markdown>
          </RecordSection>
        )
      ) : null}
    </>
  )
}

/** The repo: what it adds up to, whether it — and its pull requests — could
 *  be read, who it is for, and the housekeeping its intake needs. */
export function DeskRepoView({
  focus,
  figures,
  prError,
}: {
  focus: RepoFocus
  figures: Figure[]
  /** What GitHub said when this repo's pull requests couldn't be read. */
  prError: string | null
}) {
  const { repo } = focus
  return (
    <>
      <Figures figures={figures} />
      {focus.error ? (
        <RecordSection header="Couldn't be read">
          <RecordRow icon={<TriangleAlert />} variant="destructive" label="Its last read failed" />
          {/* What GitHub said, in full. */}
          <RecordBlock>{focus.error}</RecordBlock>
        </RecordSection>
      ) : null}
      {prError ? (
        <RecordSection header="Pull requests">
          <RecordRow
            icon={<TriangleAlert />}
            variant="destructive"
            label="Couldn't be read — running here comes from run folders alone"
          />
          <RecordBlock>{prError}</RecordBlock>
        </RecordSection>
      ) : null}
      <RecordSection header="Client">
        {repo.clientId ? (
          <RecordRow
            asChild
            icon={<UserRound />}
            label={repo.clientName ?? "Client"}
            description="The client this repo delivers for"
          >
            <Link href={`/leads/${repo.clientId}`} />
          </RecordRow>
        ) : (
          <RecordRow icon={<House />} label="House repo" description="It belongs to no client" />
        )}
      </RecordSection>
      <RecordSection
        header="Maintenance"
        footer="The board itself never writes. Nothing here changes a ticket until you send the session and it commits."
      >
        {focus.maintenance.map((launcher) => (
          <CopyLaunchRecord
            key={launcher.key}
            icon={<Copy />}
            label={launcher.title}
            description={launcher.hint}
            prompt={launcher.launch.prompt}
            launches={launcher.launch.launches}
          />
        ))}
        <RecordRow
          icon={<GitBranch />}
          label="Open the repo on GitHub"
          href={`https://github.com/${repo.fullName}`}
          target="_blank"
          rel="noreferrer"
        />
      </RecordSection>
    </>
  )
}

/** What the estate adds up to, what is stuck, what couldn't be read, and the
 *  board's own maintenance — pane three when nothing is selected. */
export function DeskEstateOverview({
  figures,
  blocked,
  board,
  onSelectTicket,
  onSelectRepo,
}: {
  figures: Figure[]
  /** The tickets the Blocked figure counts, in board order. */
  blocked: BoardTicket[]
  board: Pick<BoardData, "errors" | "prErrors" | "rosterError" | "estateCheck">
  onSelectTicket: (key: string) => void
  onSelectRepo: (slug: string) => void
}) {
  const { errors, prErrors, rosterError } = board
  return (
    <>
      <Figures figures={figures} />

      {blocked.length > 0 ? (
        <RecordSection header="Blocked">
          {blocked.map((ticket) => {
            const reason = blockedReason(ticket)
            return (
              <RecordRow
                key={ticketKey(ticket)}
                icon={<StatusDot status="blocked" />}
                label={<span className="text-desk-fg">{ticket.title}</span>}
                description={
                  <>
                    <span className="font-mono">{ticket.repo.slug}</span>
                    {reason ? ` · ${reason}` : null}
                  </>
                }
                onClick={() => onSelectTicket(ticketKey(ticket))}
              />
            )
          })}
        </RecordSection>
      ) : null}

      {/* The roster call leads when it failed — a board on its pinned repos
          alone looks like an estate with no work. Then each repo that
          couldn't be reached, with what GitHub said in full. */}
      {rosterError || errors.length > 0 ? (
        <RecordSection header="Couldn't be read">
          {rosterError ? (
            <>
              <RecordRow
                icon={<TriangleAlert />}
                variant="destructive"
                label="The estate's repo list"
              />
              <RecordBlock>Only the repos this board pins are below. {rosterError}</RecordBlock>
            </>
          ) : null}
          {errors.map((error) => (
            <ReadError key={error.repo.fullName} error={error} onSelectRepo={onSelectRepo} />
          ))}
        </RecordSection>
      ) : null}

      {/* The tickets stand; only what is running is less certain there. */}
      {prErrors.length > 0 ? (
        <RecordSection
          header="Pull requests couldn't be read"
          footer="Running in these repos comes from run folders alone until the next read."
        >
          {prErrors.map((error) => (
            <ReadError key={error.repo.fullName} error={error} onSelectRepo={onSelectRepo} />
          ))}
        </RecordSection>
      ) : null}

      <EstateCheck launch={board.estateCheck} />
    </>
  )
}

function ReadError({
  error,
  onSelectRepo,
}: {
  error: TicketFetchError
  onSelectRepo: (slug: string) => void
}) {
  return (
    <Fragment>
      <RecordRow
        icon={<TriangleAlert />}
        variant="destructive"
        label={<span className="font-mono">{error.repo.slug}</span>}
        onClick={() => onSelectRepo(error.repo.slug)}
      />
      <RecordBlock>{error.message}</RecordBlock>
    </Fragment>
  )
}

/** The board's own maintenance, and the rule the whole screen obeys. */
function EstateCheck({ launch }: { launch: LaunchSet }) {
  return (
    <RecordSection header="Estate" footer={BOARD_FOOTNOTE}>
      <CopyLaunchRecord
        icon={<Activity />}
        label="Estate check"
        description="A consistency pass across every repo"
        prompt={launch.prompt}
        launches={launch.launches}
      />
    </RecordSection>
  )
}
