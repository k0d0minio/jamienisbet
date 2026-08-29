import Link from "next/link"
import { ExternalLink, Terminal } from "lucide-react"

import { Button } from "@jamie-nisbet/ui"

import { CopyButton } from "@/components/copy-button"
import { Markdown } from "@/components/markdown"
import type { Ticket } from "@/lib/tickets"

// One ticket, opened for reading: the actions that matter, the metadata, then
// the ticket rendered as it was written in the repo. Server-rendered and
// passed into the client shells (a batch sheet's expanded row, a now-strip
// peek) as children, so react-markdown stays out of the client bundle.
//
// Deliberately not a grouped list, though it sits in one: it is already inside
// a group's row or a sheet, and a slab nested in a slab reads as neither. What
// changed here is the type — every step is on the app tier's native scale now,
// so a ticket read on a phone sets at the same sizes as the rows around it.
export function TicketDetail({
  ticket,
  sessionUrl,
  terminalUrl,
}: {
  ticket: Ticket
  sessionUrl: string | null
  /** The `claude-cli://` twin of `sessionUrl`; null on the same terms. */
  terminalUrl: string | null
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {!ticket.prompt ? (
          <span className="text-app-footnote text-app-label-3">
            {ticket.kind === "run"
              ? "A run in flight — the work lives on its branch and PR."
              : "No prompt section in this ticket."}
          </span>
        ) : (
          <>
            {/* The board's one real action: a new Claude Code session with
                the prompt already pasted and the repo already picked. Copy
                stays beside it for every other surface a prompt goes to — and
                it is the whole fallback when a prompt is too long to ride in
                a URL. */}
            {sessionUrl ? (
              <Button asChild size="sm" className="text-app-footnote">
                <a href={sessionUrl} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden />
                  Start in Claude Code
                </a>
              </Button>
            ) : null}
            <CopyButton
              value={ticket.prompt}
              label="Copy prompt"
              what="Prompt"
              className="text-app-footnote"
            />
            {/* The desk-bound twin of the same tap: a local terminal session
                in whichever clone this machine last ran `claude` in. Quiet,
                and last — on a phone (the primary surface here) there is no
                handler to catch it, so it must never sit between the two
                actions that do work there. */}
            {terminalUrl ? (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-app-footnote"
              >
                <a href={terminalUrl}>
                  <Terminal aria-hidden />
                  Open in terminal
                </a>
              </Button>
            ) : null}
            {!sessionUrl ? (
              <span className="text-app-footnote text-app-label-3">
                This prompt is too long for a link — copy it into a new session.
              </span>
            ) : null}
          </>
        )}
        <span className="ml-auto flex items-center gap-3 text-app-footnote">
          {/* The repo is on the board because a client row points at it — the
              join back to the big picture is one tap. The house repo belongs
              to no client; it just says so. */}
          {ticket.repo.clientId ? (
            <Link
              href={`/leads/${ticket.repo.clientId}`}
              className="text-app-tint underline underline-offset-2"
            >
              {ticket.repo.clientName}
            </Link>
          ) : (
            <span className="text-app-label-3">house</span>
          )}
          <a
            href={ticket.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-app-tint underline underline-offset-2"
          >
            Open on GitHub
          </a>
        </span>
      </div>

      {/* The ticket's own header lines — priority, size, depends-on. They are
          machine-written key/value pairs, so the values set in mono the way
          every other figure and identifier in the estate does. */}
      {ticket.meta.length > 0 ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-app-footnote">
          {ticket.meta.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-app-label-3">{key}</dt>
              <dd className="font-mono break-words text-app-label-2">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* The ticket, rendered. Markdown is the interface for *writing* a
          ticket; reading one on a phone wants headings and lists, not syntax.
          The unedited file is one tap away on GitHub. */}
      {ticket.body ? <Markdown>{ticket.body}</Markdown> : null}
    </div>
  )
}
