import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { Button } from "@jamie-nisbet/ui"

import { CopyButton } from "@/components/copy-button"
import { Markdown } from "@/components/markdown"
import type { Ticket } from "@/lib/tickets"

// One ticket, opened for reading: the actions that matter, the metadata, then
// the ticket rendered as it was written in the repo. Server-rendered and
// passed into the client shells (a batch sheet's expanded row, a strip peek)
// as children, so react-markdown stays out of the client bundle.
export function TicketDetail({
  ticket,
  sessionUrl,
}: {
  ticket: Ticket
  sessionUrl: string | null
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {ticket.prompt && sessionUrl ? (
          <>
            {/* The board's one real action: a new Claude Code session with
                the prompt already pasted and the repo already picked. Copy
                stays beside it for every other surface a prompt goes to. */}
            <Button asChild size="sm">
              <a href={sessionUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Start in Claude Code
              </a>
            </Button>
            <CopyButton value={ticket.prompt} label="Copy prompt" what="Prompt" />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {ticket.kind === "run"
              ? "A run in flight — the work lives on its branch and PR."
              : "No prompt section in this ticket."}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs">
          {/* The repo is on the board because a client row points at it — the
              join back to the big picture is one tap. The house repo belongs
              to no client; it just says so. */}
          {ticket.repo.clientId ? (
            <Link
              href={`/leads/${ticket.repo.clientId}`}
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {ticket.repo.clientName}
            </Link>
          ) : (
            <span className="text-muted-foreground">house</span>
          )}
          <a
            href={ticket.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Open on GitHub
          </a>
        </span>
      </div>

      {ticket.meta.length > 0 ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {ticket.meta.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{key}</dt>
              <dd>{value}</dd>
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
