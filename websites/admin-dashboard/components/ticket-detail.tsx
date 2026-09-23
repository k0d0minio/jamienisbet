import Link from "next/link"

import { CopyButton } from "@/components/copy-button"
import { LaunchButton } from "@/components/launch-menu"
import { Markdown } from "@/components/markdown"
import { primaryLaunch, type Launch } from "@/lib/launchers"
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
  launches,
}: {
  ticket: Ticket
  /** Every registered target for this ticket, the default first
   * (`launchesForTicket`). */
  launches: Launch[]
}) {
  const primary = primaryLaunch(launches)
  // Where the default target's link cannot preselect a model or effort
  // (README § Tickets), the recommendation is said beside the button, to be
  // picked in the composer. The menu says the same per target.
  const recommendation = primary?.url ? primary.hint : null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {!ticket.pickup ? (
          <span className="text-app-footnote text-app-label-3">
            {ticket.kind === "run"
              ? "A lane run in flight — the operator merges its PR; nothing to pick up."
              : "No prompt section in this ticket."}
          </span>
        ) : (
          <>
            {/* The board's one real action: a new session with the prompt
                already pasted and the repo already picked, on the default
                tool — and every other registered tool one chevron away. Copy
                stays beside it for every other surface a prompt goes to, and
                it is the whole fallback when a prompt is too long to ride in
                a URL. */}
            <LaunchButton launches={launches} />
            {recommendation ? (
              <span className="text-app-footnote text-app-label-3">
                Recommended{" "}
                <span className="font-mono text-app-label-2">
                  {recommendation}
                </span>
              </span>
            ) : null}
            <CopyButton
              value={ticket.pickup}
              label={ticket.pickupKind === "verb" ? "Copy pick-up" : "Copy prompt"}
              what={ticket.pickupKind === "verb" ? "Pick-up verb" : "Prompt"}
              className="text-app-footnote"
            />
            {primary?.unavailableReason ? (
              <span className="text-app-footnote text-app-label-3">
                {primary.unavailableReason}.
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

      {/* Exactly what the buttons above send — the pipeline verb where the
          repo carries the router, the prompt body where it does not (icm-board
          decision D26). Said on the ticket so there is never a surprise about
          which one a tap will paste. */}
      {ticket.pickup ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-app-footnote text-app-label-3">
          <span>Sends</span>
          <code className="rounded-xs bg-app-press px-1.5 py-0.5 font-mono text-app-caption text-app-label-2 break-all">
            {ticket.pickupKind === "verb"
              ? ticket.pickup
              : `${ticket.pickup.slice(0, 80)}${ticket.pickup.length > 80 ? "…" : ""}`}
          </code>
          {ticket.pickupKind === "verb" ? (
            <span>— the repo carries the /pipeline router</span>
          ) : (
            <span>— the prompt body; this repo has no /pipeline router yet</span>
          )}
        </p>
      ) : null}

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
