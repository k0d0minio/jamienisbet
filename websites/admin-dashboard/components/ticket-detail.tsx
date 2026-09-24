"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

import { blockedReason } from "@/components/board-model"
import { CopySplitButton } from "@/components/launch-menu"
import { GROUP_DOT, GROUP_LABELS, priorityClass } from "@/components/ticket-look"
import { primaryLaunch, type Launch } from "@/lib/launchers"
import type { BoardTicket, Ticket } from "@/lib/tickets"

// The renderer arrives with the first ticket opened, not with the board: most
// visits read a handful of tickets or none, and react-markdown is the heaviest
// thing a ticket needs.
const Markdown = dynamic(() =>
  import("@/components/markdown").then((m) => m.Markdown)
)

// The meta rows that say why a ticket is blocked. The summary line says it,
// above the fold, so the table below doesn't say it twice.
const BLOCKED_KEYS = new Set(["Blocked", "Waiting on"])

/**
 * Where a ticket stands, in one line: status · priority · `n of m` · repo ·
 * client, then the reason when it is blocked. The pane sets it under the
 * ticket's title. Anything the ticket doesn't carry is left out with its
 * separator; the id isn't here — the title and the back label already say
 * which ticket this is, and the pick-up carries it.
 */
export function TicketSummary({ ticket }: { ticket: BoardTicket }) {
  // The estate overview's Blocked group gives the same reason, from the same
  // rule; a ticket filed under blocked without one says nothing more.
  const reason = ticket.group === "blocked" ? blockedReason(ticket) : null
  const segments: React.ReactNode[] = [
    <span key="status" className="inline-flex items-center gap-1.5">
      <span
        className={cn("size-2 shrink-0 rounded-full", GROUP_DOT[ticket.group])}
        aria-hidden
      />
      {GROUP_LABELS[ticket.group]}
    </span>,
  ]
  if (ticket.priority)
    segments.push(
      <span key="priority" className={cn("font-mono", priorityClass(ticket.priority))}>
        {ticket.priority}
      </span>
    )
  if (ticket.sequence !== null && ticket.sequenceTotal !== null)
    segments.push(
      <span key="sequence" className="font-mono tabular-nums">
        {ticket.sequence} of {ticket.sequenceTotal}
      </span>
    )
  segments.push(
    <span key="repo" className="font-mono">
      {ticket.repo.slug}
    </span>
  )
  // The repo is on the board because a client row points at it — the join
  // back to the big picture is one tap. The house repo belongs to no client;
  // it just says so.
  segments.push(
    ticket.repo.clientId ? (
      <Link
        key="client"
        href={`/leads/${ticket.repo.clientId}`}
        className="text-app-tint underline underline-offset-2"
      >
        {ticket.repo.clientName}
      </Link>
    ) : (
      <span key="client">house</span>
    )
  )
  if (reason)
    segments.push(
      <span key="reason" className="text-app-label-2">
        {reason}
      </span>
    )

  // Wraps on a phone, never truncates: a blocked reason is the part you came
  // to read.
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {segments.map((segment, i) => (
        <span key={i} className="inline-flex items-center gap-x-1.5">
          {i > 0 ? <span aria-hidden>·</span> : null}
          {segment}
        </span>
      ))}
    </span>
  )
}

/** A ticket body split around its `## Prompt` section — heading to the next
 *  `## ` or the end — ignoring any `## Prompt` inside a fenced block. */
function splitPrompt(body: string): {
  before: string
  prompt: string | null
  after: string
} {
  const lines = body.split("\n")
  let fence: string | null = null
  let start = -1
  let end = lines.length
  for (let i = 0; i < lines.length; i++) {
    const marker = lines[i].match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker) {
      if (fence === null) fence = marker[0]
      else if (marker[0] === fence) fence = null
      continue
    }
    if (fence !== null) continue
    if (start === -1) {
      if (/^##\s+Prompt\s*$/i.test(lines[i])) start = i
    } else if (/^##\s/.test(lines[i])) {
      end = i
      break
    }
  }
  if (start === -1) return { before: body, prompt: null, after: "" }
  return {
    before: lines.slice(0, start).join("\n").trim(),
    prompt: lines.slice(start + 1, end).join("\n").trim(),
    after: lines.slice(end).join("\n").trim(),
  }
}

// One ticket, opened for reading, in the order a phone wants it above the
// fold: the pane's title and summary line (TicketSummary, set by the board),
// then the one action, then the ticket's metadata, then the ticket as it was
// written in the repo. Rendered in the browser, and only once a ticket is
// actually opened — the board ships each body as its raw markdown, so a
// ticket nobody opens costs its text and nothing more.
//
// Deliberately not a grouped list, though it sits in one: it is already inside
// a group's slab, and a slab nested in a slab reads as neither.
export function TicketDetail({
  ticket,
  launches,
  dependencyKeys,
  onSelectTicket,
}: {
  ticket: Ticket
  /** Every registered target for this ticket, the default first
   * (`launchesForTicket`). */
  launches: Launch[]
  /** Each `depends-on` slug that is a ticket on the board in this epic, to
   *  the key that selects it. A slug missing here stays plain text. */
  dependencyKeys: ReadonlyMap<string, string>
  onSelectTicket: (key: string) => void
}) {
  const primary = primaryLaunch(launches)
  // No link can preselect a model or effort (README § Tickets), so the
  // recommendation is said beside the button, to be picked wherever the
  // prompt is pasted. The menu says the same per target.
  const recommendation = primary?.hint ?? null
  const meta = ticket.meta.filter(([key]) => !BLOCKED_KEYS.has(key))
  const { before, prompt, after } = splitPrompt(ticket.body)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!ticket.pickup ? (
          <span className="text-app-footnote text-app-label-3">
            {ticket.kind === "run"
              ? "A lane run in flight — the operator merges its PR; nothing to pick up."
              : "No prompt section in this ticket."}
          </span>
        ) : (
          <>
            {/* The board's one real action: copy exactly what goes to a
                session — a clipboard works on every surface and every tool,
                and has no length cap — with every registered tool one chevron
                away, a prompt pre-filled in each that can take it. The label
                says which of the two it copies. */}
            <CopySplitButton
              value={ticket.pickup}
              label={ticket.pickupKind === "verb" ? "Copy pick-up" : "Copy prompt"}
              what={ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt"}
              launches={launches}
            />
            {/* Beside the button while there is room, under it when not. */}
            {recommendation ? (
              <span className="text-app-footnote text-app-label-3">
                Recommended{" "}
                <span className="font-mono text-app-label-2">
                  {recommendation}
                </span>
              </span>
            ) : null}
          </>
        )}
        <a
          href={ticket.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex min-h-app-touch items-center text-app-footnote text-app-tint underline underline-offset-2"
        >
          Open on GitHub
        </a>
      </div>

      {/* The ticket's own header lines — size, sequence, depends-on, lane.
          They are machine-written key/value pairs, so the values set in mono
          the way every other figure and identifier in the estate does. */}
      {meta.length > 0 ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-app-footnote">
          {meta.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-app-label-3">{key}</dt>
              <dd className="font-mono break-words text-app-label-2">
                {key === "Depends on" ? (
                  <DependsOn
                    value={value}
                    keys={dependencyKeys}
                    onSelect={onSelectTicket}
                  />
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* The ticket, rendered. Markdown is the interface for *writing* a
          ticket; reading one on a phone wants headings and lists, not syntax.
          The Prompt section is folded where it stands — the button above
          already carries it. The unedited file is one tap away on GitHub. */}
      {before ? <Markdown>{before}</Markdown> : null}
      {prompt !== null ? (
        <details className="group">
          <summary className="flex min-h-app-touch cursor-pointer list-none items-center gap-2 text-app-subhead text-app-label-3 transition-colors hover:text-app-label">
            <ChevronRight
              className="size-4 shrink-0 transition-transform group-open:rotate-90"
              aria-hidden
            />
            Prompt
          </summary>
          <div className="pt-2">
            {prompt ? <Markdown>{prompt}</Markdown> : null}
          </div>
        </details>
      ) : null}
      {after ? <Markdown>{after}</Markdown> : null}
    </div>
  )
}

/** The `depends-on` list, each slug that is on the board a link that selects
 *  it — the same URL state a row tap sets, so no request and no skeleton. */
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
                  // A modified click keeps the browser's own meaning (a new
                  // tab); a plain one selects in place.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  e.preventDefault()
                  onSelect(key)
                }}
                className="text-app-tint underline underline-offset-2"
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
