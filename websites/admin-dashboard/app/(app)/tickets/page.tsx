import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  cn,
} from "@jamie-nisbet/ui"

import { Chip } from "@/components/chip"
import { CopyButton } from "@/components/copy-button"
import {
  TICKET_STATUSES,
  listTickets,
  type Ticket,
  type TicketStatus,
} from "@/lib/tickets"

export const metadata: Metadata = { title: "Tickets" }
export const dynamic = "force-dynamic"

// The estate's work backlog in one place: the `.icm/intake/` tickets of every
// delivery repo connected to an active client, grouped by where they are in
// the day (today → in progress → blocked → ready). This screen is read-only by
// design — a ticket changes by editing its file in the repo, and the one
// action that matters on a phone is **Copy prompt**: grab the ticket's
// pasteable prompt and hand it to a Claude session.

const STATUS_LABELS: Record<TicketStatus, string> = {
  today: "Today",
  "in-progress": "In progress",
  blocked: "Blocked",
  ready: "Ready",
}

// `today` is the pick-up flag; it reads as the accent, not an alarm. Blocked
// is amber, not red — stuck wants attention, it isn't a failure.
const STATUS_DOT: Record<TicketStatus, string> = {
  today: "bg-primary",
  "in-progress": "bg-success",
  blocked: "bg-warning",
  ready: "bg-muted-foreground/40",
}

function priorityClass(priority: string | null): string {
  return priority === "P0"
    ? "text-destructive font-medium"
    : "text-muted-foreground"
}

// One ticket: a native <details> row (no JavaScript, works before hydration —
// the FoldCard idea, per row). The summary is the scan line; opening it shows
// the actions and the full ticket markdown as written in the repo.
function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <li className="rounded-lg border bg-card text-card-foreground">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2.5 transition-colors active:bg-muted/50">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              STATUS_DOT[ticket.status]
            )}
            aria-hidden
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline gap-2 text-xs">
              <span className="font-medium text-muted-foreground">
                {ticket.id}
              </span>
              <span className="text-muted-foreground">{ticket.repo.slug}</span>
              {ticket.priority ? (
                <span className={cn("ml-auto", priorityClass(ticket.priority))}>
                  {ticket.priority}
                </span>
              ) : null}
            </span>
            <span className="truncate text-sm leading-tight font-medium">
              {ticket.title}
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          />
        </summary>

        <div className="flex flex-col gap-4 border-t px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.prompt ? (
              <CopyButton value={ticket.prompt} label="Copy prompt" />
            ) : (
              <span className="text-xs text-muted-foreground">
                No prompt section in this ticket.
              </span>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs">
              {/* The repo is on the board because a client row points at it —
                  the join back to the big picture is one tap. */}
              <Link
                href={`/leads/${ticket.repo.clientId}`}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {ticket.repo.clientName}
              </Link>
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

          {/* The ticket as written — markdown is the interface, so show the
              file itself rather than a re-rendering that could drift from it. */}
          <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {ticket.body}
          </pre>
        </div>
      </details>
    </li>
  )
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>
}) {
  const params = await searchParams

  const { configured, repos, tickets, errors, dbError } = await listTickets()
  const repoSlug = repos.some((r) => r.slug === params.repo)
    ? params.repo
    : undefined

  const visible = repoSlug
    ? tickets.filter((t) => t.repo.slug === repoSlug)
    : tickets
  const groups = TICKET_STATUSES.map((status) => ({
    status,
    tickets: visible.filter((t) => t.status === status),
  })).filter((g) => g.tickets.length > 0)

  const countFor = (slug?: string): number =>
    slug ? tickets.filter((t) => t.repo.slug === slug).length : tickets.length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Each repo&apos;s <code>.icm/intake/</code>, read from main — edit in
          the repo, not here.
        </p>
      </div>

      {!configured ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            GitHub is not configured — set <code>GITHUB_TOKEN</code> to read
            the ticket folders.
          </CardContent>
        </Card>
      ) : dbError ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      ) : repos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No delivery repos connected — connect one from a lead&apos;s
            profile and its <code>.icm/intake/</code> shows up here.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Repo filter rail — same sideways-scrolling chips as Leads. */}
          <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <Chip href="/tickets" active={!repoSlug} count={countFor()}>
              All
            </Chip>
            {repos.map((repo) => (
              <Chip
                key={repo.slug}
                href={`/tickets?repo=${repo.slug}`}
                active={repoSlug === repo.slug}
                count={countFor(repo.slug)}
              >
                {repo.slug}
              </Chip>
            ))}
          </div>

          {errors.map((error) => (
            <Alert key={error.repo.fullName} variant="destructive">
              <AlertTitle>{error.repo.slug} unreachable</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {visible.length === 0 && tickets.length > 0
                  ? "Nothing in this repo."
                  : "No open tickets — cut some into a repo's .icm/intake/."}
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => (
              <section key={group.status} className="flex flex-col gap-2">
                <h2 className="flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
                  {STATUS_LABELS[group.status]}
                  <span className="tabular-nums opacity-70">
                    {group.tickets.length}
                  </span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {group.tickets.map((ticket) => (
                    <TicketRow
                      key={`${ticket.repo.fullName}/${ticket.path}`}
                      ticket={ticket}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
