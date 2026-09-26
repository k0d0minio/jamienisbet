"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Check, ChevronDown, Copy } from "lucide-react"

import {
  DeskButton,
  DeskMenu,
  DeskMenuContent,
  DeskMenuItem,
  DeskMenuTrigger,
  PriorityTag,
  RecordSection,
  StatusDot,
  cn,
  type DeskStatus,
} from "@jamie-nisbet/ui"

import { blockedReason, ticketKey, type ListBatch } from "@/components/board-model"
import { prLine } from "@/components/work-model"
import { copyToClipboard } from "@/lib/clipboard"
import {
  launchLinkProps,
  primaryAction,
  primaryLaunch,
  type Launch,
  type PrimaryAction,
} from "@/lib/launchers"
import type { BoardTicket, TicketPr } from "@/lib/tickets"

// Work's reader (spec work-reader, D-8, D-10) — pane three at the desk when a
// ticket is selected, and the phone's pushed reader (spec work-phone §4): the
// same head and body in one column there, with the act in a bar of its own. Everything needed before launching, at once, with no
// tab and no disclosure: a head (where it lives, what it is, where it
// stands, the one act), the stub as written with the exact text the launch
// sends, and a side column with the stub's lines, its epic's build order and
// what the breakdown understood.
//
// Launch is the primary act; Copy prompt copies exactly what it sends. A
// ticket GitHub says is running (its PR, or a run folder — D-11) shows what is
// running instead of Launch. Nothing is stored when Launch is pressed: the
// board stays read-only, and the link is a pre-filled session a human sends.

// The renderer arrives with the first ticket opened, not with the board.
const Markdown = dynamic(() =>
  import("@/components/markdown").then((m) => m.Markdown)
)

/** The meta rows the head already says: the blocked reason. */
const BLOCKED_KEYS = new Set(["Blocked", "Waiting on"])

/** The eyebrow every reader section sits under. */
const EYEBROW = "font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-3 uppercase"

// ---------------------------------------------------------------------------
// The stub, split into the reader's three parts.

type Section = { heading: string | null; text: string }

/** A markdown body cut at each `## ` heading, ignoring any inside a fenced
 *  block; the text before the first heading is a section with none. */
function sections(body: string): Section[] {
  const out: Section[] = []
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] }
  // The open fence's marker: closed only by a run of the same character at
  // least as long (CommonMark), so a shorter fence inside it stays content.
  let fence: string | null = null
  for (const line of body.split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker && (fence === null || (marker[0] === fence[0] && marker.length >= fence.length))) {
      fence = fence === null ? marker : null
    } else if (fence === null) {
      const heading = line.match(/^##\s+(.+?)\s*$/)
      if (heading) {
        out.push({ heading: current.heading, text: current.lines.join("\n").trim() })
        current = { heading: heading[1], lines: [] }
        continue
      }
    }
    current.lines.push(line)
  }
  out.push({ heading: current.heading, text: current.lines.join("\n").trim() })
  return out.filter((s) => s.heading !== null || s.text !== "")
}

const isNotes = (heading: string | null) => heading !== null && /^notes for define$/i.test(heading)
const isPrompt = (heading: string | null) => heading !== null && /^(agent\s+)?prompt$/i.test(heading)

/** What this is (every section but these two, as written), Notes for Define,
 *  and the stub's own Prompt section. */
function readerParts(body: string): { what: string; notes: string | null; prompt: string | null } {
  const all = sections(body)
  const what = all
    .filter((s) => !isNotes(s.heading) && !isPrompt(s.heading))
    .map((s) => (s.heading === null ? s.text : `## ${s.heading}\n\n${s.text}`))
    .join("\n\n")
    .trim()
  return {
    what,
    notes: all.find((s) => isNotes(s.heading))?.text || null,
    prompt: all.find((s) => isPrompt(s.heading))?.text || null,
  }
}

/** The breakdown's `## What I understood` section, or null. */
export function understood(breakdown: string | null): string | null {
  if (!breakdown) return null
  const found = sections(breakdown).find(
    (s) => s.heading !== null && /^what i understood$/i.test(s.heading)
  )
  return found?.text || null
}

// ---------------------------------------------------------------------------
// Small pieces.

/** `repo / epic / slug` — where the ticket lives, as a path. */
function crumbs(ticket: BoardTicket): string {
  const id = ticket.kind === "legacy" ? `backlog/${ticket.id}` : ticket.id
  return [ticket.repo.slug, ...id.split("/")].join(" / ")
}

/** "3h" — how long a PR has been open, against the board's own read time so
 *  the server and the browser render the same words. */
export function openedAgo(openedAt: string, readAt: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(readAt) - Date.parse(openedAt)) / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

/** A thin progress bar — done against total. */
export function EpicMeter({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((100 * done) / total) : 0
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} of ${total} done`}
      className="h-0.5 w-full bg-desk-line"
    >
      <div className="h-full bg-desk-ink" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** Every registered tool, for a ticket that has more than the default. One
 *  that can't carry this launch stays listed, dimmed, with its reason. */
export function DeskLaunchMenu({
  launches,
  label = "Open in a tool",
}: {
  launches: Launch[]
  label?: string
}) {
  return (
    <DeskMenu>
      <DeskMenuTrigger asChild>
        <DeskButton type="button" variant="ghost" size="icon" aria-label={label}>
          <ChevronDown aria-hidden />
        </DeskButton>
      </DeskMenuTrigger>
      <DeskMenuContent align="end">
        {launches.map((launch) =>
          launch.url ? (
            // The item hands its element to the link, so its second line is
            // drawn inside the link rather than by `description` (which would
            // wrap the child and break the Slot).
            <DeskMenuItem key={launch.targetId} asChild>
              <a href={launch.url} {...launchLinkProps(launch)}>
                <span className="flex min-w-0 flex-col">
                  <span>{launch.label}</span>
                  {launch.hint ? (
                    <span className="text-desk-meta text-desk-fg-3">Recommended {launch.hint}</span>
                  ) : null}
                </span>
              </a>
            </DeskMenuItem>
          ) : (
            <DeskMenuItem key={launch.targetId} disabled description={launch.unavailableReason}>
              {launch.label}
            </DeskMenuItem>
          )
        )}
      </DeskMenuContent>
    </DeskMenu>
  )
}

/** Copy, with a moment of "Copied" — primary when a link can't carry the
 *  launch (then ⌘↵ presses it), secondary beside Launch otherwise. */
export function DeskCopyButton({
  value,
  what,
  label,
  primary = false,
  keys = true,
  className,
}: {
  value: string
  /** What landed on the clipboard, for the toast. */
  what: string
  label: string
  primary?: boolean
  /** Show and declare ⌘↵ when primary — the desk's; the phone has no keys. */
  keys?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()
  async function onCopy() {
    if (!(await copyToClipboard(value, what))) return
    setCopied(true)
    setTimeout(() => startTransition(() => setCopied(false)), 1500)
  }
  return (
    <DeskButton
      type="button"
      variant={primary ? "primary" : "secondary"}
      shortcut={primary && keys ? ["⌘", "↵"] : undefined}
      aria-keyshortcuts={primary && keys ? "Meta+Enter Control+Enter" : undefined}
      onClick={onCopy}
      className={className}
    >
      {copied ? "Copied" : label}
    </DeskButton>
  )
}

/** What is running, in place of Launch: the PR, its stage and its age — or
 *  the run folder, when no PR matched it. */
function RunningBadge({
  ticket,
  readAt,
  className,
}: {
  ticket: BoardTicket
  readAt: string
  className?: string
}) {
  const pr: TicketPr | null = ticket.pr
  return (
    <span
      className={cn(
        "inline-flex min-h-desk-control min-w-0 items-center gap-2 rounded-desk-control bg-desk-running-soft px-2.5 text-desk-ui text-desk-fg",
        className
      )}
    >
      <StatusDot status="running" />
      {pr ? (
        <>
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline-offset-2 hover:underline"
          >
            {prLine(pr)}
          </a>
          <span className="font-mono text-desk-meta text-desk-fg-2">
            opened {openedAgo(pr.openedAt, readAt)} ago
          </span>
        </>
      ) : (
        <a
          href={ticket.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline-offset-2 hover:underline"
        >
          Run in flight · <span className="font-mono text-desk-meta">{ticket.path}</span>
        </a>
      )}
    </span>
  )
}

/** Status · priority · complexity · `n of m` · size · client — anything the
 *  ticket lacks is left out with its separator. */
function ReaderSummary({ ticket }: { ticket: BoardTicket }) {
  const size = ticket.meta.find(([key]) => key === "Size")?.[1] ?? null
  const segments: React.ReactNode[] = [
    <StatusDot key="status" status={ticket.status} showLabel />,
  ]
  if (ticket.priority) segments.push(<PriorityTag key="priority" priority={ticket.priority} />)
  if (ticket.complexity)
    segments.push(
      <span key="complexity" className="font-mono text-desk-meta">
        {ticket.complexity}
      </span>
    )
  if (ticket.sequence !== null && ticket.sequenceTotal !== null)
    segments.push(
      <span key="sequence" className="font-mono text-desk-meta tabular-nums">
        {ticket.sequence} of {ticket.sequenceTotal}
      </span>
    )
  if (size)
    segments.push(
      <span key="size" className="font-mono text-desk-meta">
        size {size}
      </span>
    )
  segments.push(
    ticket.repo.clientId ? (
      <Link
        key="client"
        href={`/leads/${ticket.repo.clientId}`}
        className="underline underline-offset-2 hover:text-desk-fg"
      >
        {ticket.repo.clientName}
      </Link>
    ) : (
      <span key="client">house</span>
    )
  )
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-desk-ui text-desk-fg-2">
      {segments.map((segment, i) => (
        <span key={i} className="inline-flex items-center gap-x-2">
          {i > 0 ? <span aria-hidden className="text-desk-fg-3">·</span> : null}
          {segment}
        </span>
      ))}
    </p>
  )
}

// ---------------------------------------------------------------------------
// The head.

/** The action row: Launch (or what is running), the recommendation, Copy
 *  prompt, the other tools — then why a launch can't be offered, if it can't. */
function ReaderActions({
  ticket,
  action,
  readAt,
}: {
  ticket: BoardTicket
  action: PrimaryAction
  readAt: string
}) {
  // What GitHub says is under way — a matched PR — offers no Launch. A run
  // folder on main with no PR is a run to resume, so it keeps its Launch.
  const running = ticket.pr !== null
  const recommendation = primaryLaunch(ticket.launches)?.hint ?? null
  const what = ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt"
  const note = running
    ? null
    : action.kind === "copy"
      ? action.reason
      : action.kind === "none"
        ? ticket.kind === "run"
          ? "A lane run in flight — the operator merges its PR; nothing to launch."
          : "No prompt section in this ticket — nothing to launch."
        : null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {ticket.status === "running" ? <RunningBadge ticket={ticket} readAt={readAt} /> : null}
        {!running && action.kind === "launch" ? (
          <DeskButton asChild variant="primary">
            <a
              href={action.launch.url ?? undefined}
              {...launchLinkProps(action.launch)}
              aria-keyshortcuts="Meta+Enter Control+Enter"
            >
              Launch in {action.launch.label}
              <span aria-hidden className="font-mono text-desk-micro font-normal opacity-70">
                ⌘↵
              </span>
            </a>
          </DeskButton>
        ) : null}
        {ticket.pickup ? (
          <DeskCopyButton
            value={ticket.pickup}
            what={what}
            label="Copy prompt"
            primary={!running && action.kind === "copy"}
          />
        ) : null}
        {!running && recommendation ? (
          // No link can preselect a model or effort (lib/launchers), so the
          // recommendation is said beside the button, to be picked in the
          // session the link opens.
          <span className="text-desk-meta text-desk-fg-3">
            Recommended{" "}
            <span className="font-mono text-desk-fg-2">{recommendation}</span>
          </span>
        ) : null}
        {!running && ticket.pickup && ticket.launches.length > 1 ? (
          <DeskLaunchMenu launches={ticket.launches} />
        ) : null}
      </div>
      {note ? <p className="text-desk-meta text-desk-fg-3">{note}</p> : null}
    </div>
  )
}

/** Where the ticket lives, what it is, where it stands, and the one act.
 *  `compact` is the phone's: its back bar carries GitHub ↗ and its launch bar
 *  the act, so the head is the path, the title and the status alone. */
export function ReaderHead({
  ticket,
  readAt,
  compact = false,
}: {
  ticket: BoardTicket
  readAt: string
  compact?: boolean
}) {
  const reason = ticket.status === "blocked" ? blockedReason(ticket) : null
  const action = primaryAction(ticket.launches, ticket.pickup)
  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-desk-line px-5 py-3">
      <div className="flex items-center gap-3">
        <p
          className={cn(
            "min-w-0 flex-1 font-mono text-desk-meta text-desk-fg-3",
            compact ? "break-words" : "truncate"
          )}
        >
          {crumbs(ticket)}
        </p>
        {compact ? null : (
          <DeskButton asChild variant="ghost" size="sm">
            <a href={ticket.htmlUrl} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </DeskButton>
        )}
      </div>
      <h2 className="text-desk-title font-bold text-desk-fg">{ticket.title}</h2>
      <ReaderSummary ticket={ticket} />
      {reason ? (
        <p className="text-desk-ui text-desk-blocked">
          <span className="font-semibold">Blocked:</span> {reason}
        </p>
      ) : null}
      {compact ? null : (
        <div className="pt-1">
          <ReaderActions ticket={ticket} action={action} readAt={readAt} />
        </div>
      )}
    </header>
  )
}

/** Copy prompt as a 44px icon — the launch bar's secondary, beside Launch. */
function CopyIconButton({ value, what }: { value: string; what: string }) {
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()
  async function onCopy() {
    if (!(await copyToClipboard(value, what))) return
    setCopied(true)
    setTimeout(() => startTransition(() => setCopied(false)), 1500)
  }
  return (
    <DeskButton
      type="button"
      variant="secondary"
      size="icon"
      aria-label={copied ? "Prompt copied" : "Copy prompt"}
      onClick={onCopy}
      className="size-11 shrink-0"
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </DeskButton>
  )
}

/**
 * The phone reader's act (spec work-phone §4), in a bar that stays in view
 * while the body scrolls: Launch full width, Copy prompt beside it, the other
 * tools behind a menu once there are more than one, and the recommendation
 * under them. The same decision the desk's action row makes — a prompt past
 * the link's cap makes Copy prompt the primary, a matched PR shows what is
 * running in place of Launch, a run folder with no PR keeps Launch to resume.
 * Every control is 44px here by construction, not only under a thumb.
 */
export function ReaderLaunchBar({
  ticket,
  readAt,
  className,
}: {
  ticket: BoardTicket
  readAt: string
  className?: string
}) {
  const action = primaryAction(ticket.launches, ticket.pickup)
  const running = ticket.pr !== null
  const recommendation = primaryLaunch(ticket.launches)?.hint ?? null
  const what = ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt"
  const note = running
    ? null
    : action.kind === "copy"
      ? action.reason
      : action.kind === "none"
        ? ticket.kind === "run"
          ? "A lane run in flight — the operator merges its PR; nothing to launch."
          : "No prompt section in this ticket — nothing to launch."
        : null
  const menu = !running && ticket.pickup && ticket.launches.length > 1

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-desk-line bg-desk-surface px-4 py-2.5",
        className
      )}
    >
      {/* A run folder with no PR is resumed with Launch; say what it is. */}
      {ticket.status === "running" && !running ? (
        <RunningBadge ticket={ticket} readAt={readAt} className="min-h-11 w-full" />
      ) : null}
      <div className="flex items-center gap-2">
        {running ? (
          <RunningBadge ticket={ticket} readAt={readAt} className="min-h-11 flex-1" />
        ) : action.kind === "launch" ? (
          <DeskButton asChild variant="primary" className="h-11 flex-1 justify-center">
            <a href={action.launch.url ?? undefined} {...launchLinkProps(action.launch)}>
              Launch in {action.launch.label}
            </a>
          </DeskButton>
        ) : action.kind === "copy" && ticket.pickup ? (
          <DeskCopyButton
            value={ticket.pickup}
            what={what}
            label="Copy prompt"
            primary
            keys={false}
            className="h-11 flex-1 justify-center"
          />
        ) : (
          <p className="flex min-h-11 flex-1 items-center text-desk-meta text-desk-fg-3">{note}</p>
        )}
        {ticket.pickup && (running || action.kind === "launch") ? (
          <CopyIconButton value={ticket.pickup} what={what} />
        ) : null}
        {menu ? (
          <div className="flex size-11 shrink-0 items-center justify-center">
            <DeskLaunchMenu launches={ticket.launches} />
          </div>
        ) : null}
      </div>
      {!running && recommendation ? (
        // No link can preselect a model or effort (lib/launchers), so the
        // recommendation is said under the button, to pick in the session.
        <p className="font-mono text-desk-meta text-desk-fg-3">{recommendation} · recommended</p>
      ) : null}
      {note && action.kind === "copy" ? (
        <p className="text-desk-meta text-desk-fg-3">{note}</p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The body.

function ReaderSection({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className={EYEBROW}>{title}</h3>
      {children}
    </section>
  )
}

/** The `depends-on` list, each slug that is on the board a link that selects
 *  it — the same URL state a row click sets. */
function DependsOn({
  value,
  keys,
  onSelect,
}: {
  value: string
  keys: ReadonlyMap<string, string>
  onSelect: (key: string) => void
}) {
  const slugs = value.split(",").map((s) => s.trim()).filter(Boolean)
  return (
    <>
      {slugs.map((slug, i) => {
        const key = keys.get(slug)
        return (
          <span key={slug}>
            {i > 0 ? ", " : null}
            {key ? (
              <a
                href={`?t=${encodeURIComponent(key)}`}
                onClick={(e) => {
                  // A modified click keeps the browser's own meaning.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  e.preventDefault()
                  onSelect(key)
                }}
                className="text-desk-fg underline underline-offset-2"
              >
                {slug}
              </a>
            ) : (
              slug
            )}
          </span>
        )
      })}
    </>
  )
}

/** The stub's dash-lines, label on the left and the value in mono. */
function StubLines({
  ticket,
  dependencyKeys,
  onSelectTicket,
}: {
  ticket: BoardTicket
  dependencyKeys: ReadonlyMap<string, string>
  onSelectTicket: (key: string) => void
}) {
  const meta = ticket.meta.filter(([key]) => !BLOCKED_KEYS.has(key))
  if (meta.length === 0) return null
  return (
    <RecordSection header={ticket.kind === "run" ? "Run" : "Stub"}>
      <dl className="flex flex-col">
        {meta.map(([key, value]) => (
          <div
            key={key}
            className="flex min-h-desk-row items-baseline gap-3 border-b border-desk-line py-1.5"
          >
            <dt className="w-24 shrink-0 text-desk-meta text-desk-fg-3">{key}</dt>
            <dd className="min-w-0 font-mono text-desk-meta break-words text-desk-fg-2">
              {key === "Depends on" ? (
                <DependsOn value={value} keys={dependencyKeys} onSelect={onSelectTicket} />
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </RecordSection>
  )
}

/** The epic: its progress and its build order, each stub with a ticket on
 *  the board one click away, the selected one marked. */
function EpicOrder({
  ticket,
  batch,
  onSelectTicket,
}: {
  ticket: BoardTicket
  batch: ListBatch
  onSelectTicket: (key: string) => void
}) {
  const rows = batch.rows ?? []
  if (rows.length === 0) return null
  const total = batch.planned ?? rows.length
  const open = new Map(batch.tickets.map((t) => [t.id, t]))
  return (
    <RecordSection
      header={batch.title}
      actions={
        <span className="font-mono text-desk-micro tabular-nums text-desk-fg-3">
          {batch.done} of {total} done
        </span>
      }
    >
      <EpicMeter done={batch.done} total={total} />
      <ol className="flex flex-col pt-1">
        {rows.map((row) => {
          const own = row.ticketId ? open.get(row.ticketId) : undefined
          const status: DeskStatus =
            row.state === "done" ? "done" : row.state === "running" ? "running" : (own?.status ?? "open")
          const current = row.ticketId !== null && row.ticketId === ticket.id
          const key = row.ticketId ? `${ticket.repo.slug}/${row.ticketId}` : null
          const content = (
            <>
              <StatusDot status={status} />
              <span className="w-5 shrink-0 text-right font-mono text-desk-meta tabular-nums text-desk-fg-3">
                {row.sequence ?? "–"}
              </span>
              <span className="min-w-0 flex-1 truncate">{row.title}</span>
            </>
          )
          const rowClass = cn(
            "flex h-desk-row w-full min-w-0 items-center gap-2 rounded-desk-control px-2 text-left text-desk-ui",
            row.state === "done" ? "text-desk-fg-3" : "text-desk-fg",
            current && "bg-desk-sunken font-semibold"
          )
          return (
            <li key={row.slug}>
              {key && row.state !== "done" && !current ? (
                <button
                  type="button"
                  onClick={() => onSelectTicket(key)}
                  className={cn(rowClass, "transition-colors duration-100 hover:bg-desk-hover")}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass} aria-current={current ? "step" : undefined}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </RecordSection>
  )
}

/** The stub as written, the exact launch text, and the side column. */
export function ReaderBody({
  ticket,
  batch,
  onSelectTicket,
  stacked = false,
}: {
  ticket: BoardTicket
  /** The batch it sits in — the epic's build order, its breakdown, and the
   *  tickets a `depends-on` slug can link to. */
  batch: ListBatch
  onSelectTicket: (key: string) => void
  /** The phone's one column: the side column under the body at any width. */
  stacked?: boolean
}) {
  const { what, notes, prompt } = readerParts(ticket.body)
  const epic = batch.kind === "epic"
  const excerpt = epic ? understood(batch.breakdown) : null
  // A stub's id is `<epic>/<slug>` and `depends-on` names the bare slug.
  const dependencyKeys = new Map(
    batch.tickets
      .filter((t) => t.kind === "stub" && t.id !== ticket.id)
      .map((t): [string, string] => [t.id.slice(t.id.lastIndexOf("/") + 1), ticketKey(t)])
  )
  // A verb is what the launch sends, so the stub's own prompt is kept below
  // it for reading; a prompt body *is* the stub's prompt, said once.
  const stubPrompt = ticket.pickupKind === "verb" ? prompt : null

  return (
    <div className="@container">
      <div
        className={cn(
          "grid grid-cols-1 gap-8 p-5",
          !stacked && "@2xl:grid-cols-[minmax(0,1fr)_16rem]"
        )}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {what ? (
            <ReaderSection title="What this is">
              <Markdown>{what}</Markdown>
            </ReaderSection>
          ) : null}
          {notes ? (
            <ReaderSection title="Notes for Define">
              <Markdown>{notes}</Markdown>
            </ReaderSection>
          ) : null}
          {ticket.pickup ? (
            <ReaderSection title="Prompt · what the launch sends">
              <p className="font-mono text-desk-meta text-desk-fg-3">
                {ticket.repo.fullName} · mode code
              </p>
              <pre className="overflow-x-auto rounded-desk-control border border-desk-line bg-desk-sunken p-3 font-mono text-desk-meta break-words whitespace-pre-wrap text-desk-fg">
                {ticket.pickup}
              </pre>
            </ReaderSection>
          ) : null}
          {stubPrompt ? (
            <ReaderSection title="The stub's prompt">
              <Markdown>{stubPrompt}</Markdown>
            </ReaderSection>
          ) : null}
          {!what && !notes && !ticket.pickup ? (
            <p className="text-desk-ui text-desk-fg-3">Nothing written in this ticket beyond its lines.</p>
          ) : null}
        </div>

        <aside aria-label="About this ticket" className="flex min-w-0 flex-col gap-6">
          <StubLines ticket={ticket} dependencyKeys={dependencyKeys} onSelectTicket={onSelectTicket} />
          {epic ? <EpicOrder ticket={ticket} batch={batch} onSelectTicket={onSelectTicket} /> : null}
          {excerpt ? (
            <RecordSection header="What I understood">
              <Markdown>{excerpt}</Markdown>
              <a
                href={`${batch.htmlUrl.replace("/tree/", "/blob/")}/breakdown.md`}
                target="_blank"
                rel="noreferrer"
                className="pt-2 text-desk-meta text-desk-fg underline underline-offset-2"
              >
                Read the whole breakdown ↗
              </a>
            </RecordSection>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
