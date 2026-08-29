import type { Metadata } from "next"
import Link from "next/link"
import { Activity } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
} from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BatchCard } from "@/components/batch-card"
import { BoardRefresh } from "@/components/board-refresh"
import { BoardTicketRow } from "@/components/board-ticket-row"
import { Chip } from "@/components/chip"
import { RepoMaintenance } from "@/components/repo-maintenance"
import { TicketDetail } from "@/components/ticket-detail"
import { TicketPeek } from "@/components/ticket-peek"
import {
  claudeSessionUrl,
  claudeTerminalUrl,
  estateCheckSessionUrl,
  listBoard,
  recutSessionUrl,
  repoMaintenanceLaunchers,
  type RepoSection,
} from "@/lib/tickets"

export const metadata: Metadata = { title: "Tickets" }
export const dynamic = "force-dynamic"

// The line under the large title. loading.tsx carries the same words, so the
// header holds its shape while the board's GitHub reads land under it.
const BOARD_SUBTITLE = (
  <>
    Each repo&apos;s <code>.icm/intake/</code>, read from main — edit in the
    repo, not here.
  </>
)

// The estate's work backlog, read batch-first: a pinned "now" strip (today's
// picks, runs in flight, what's stuck), then one section per repo whose intake
// has anything open, each batch a line item that opens into its sequenced
// stubs. This screen is read-only by design — a ticket changes by editing its
// file in the repo — so every button here is either a link or a Claude Code
// session with a prompt pre-filled, and the human sends it.

function RepoSectionView({ section }: { section: RepoSection }) {
  const { repo } = section
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate font-mono text-sm font-medium">{repo.slug}</h2>
        {repo.clientId ? (
          <Link
            href={`/leads/${repo.clientId}`}
            className="truncate text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {repo.clientName}
          </Link>
        ) : null}
        <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {section.open} open
        </span>
        <RepoMaintenance
          repoSlug={repo.slug}
          repoUrl={`https://github.com/${repo.fullName}`}
          launchers={repoMaintenanceLaunchers(repo)}
        />
      </div>
      {/* Phone: one column of batch lines. Desktop: the same lines, two up —
          the board breathes instead of stretching. */}
      <div className="grid gap-2 sm:grid-cols-2">
        {section.batches.map((batch) => (
          <BatchCard
            key={batch.slug}
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
                    prompt: batch.next.prompt,
                    sessionUrl: claudeSessionUrl(batch.next),
                  }
                : null
            }
            recutUrl={
              batch.kind === "epic" ? recutSessionUrl(repo, batch.slug) : null
            }
          >
            {batch.tickets.map((ticket) => (
              <BoardTicketRow
                key={ticket.path}
                ticket={ticket}
                sessionUrl={claudeSessionUrl(ticket)}
              >
                <TicketDetail
                  ticket={ticket}
                  sessionUrl={claudeSessionUrl(ticket)}
                  terminalUrl={claudeTerminalUrl(ticket)}
                />
              </BoardTicketRow>
            ))}
          </BatchCard>
        ))}
      </div>
    </section>
  )
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>
}) {
  const params = await searchParams

  const { configured, repos, tickets, sections, strip, errors, dbError } =
    await listBoard()
  const repoSlug = repos.some((r) => r.slug === params.repo)
    ? params.repo
    : undefined

  const visibleSections = repoSlug
    ? sections.filter((s) => s.repo.slug === repoSlug)
    : sections
  const visibleStrip = repoSlug
    ? strip.filter((t) => t.repo.slug === repoSlug)
    : strip

  const countFor = (slug?: string): number =>
    slug ? tickets.filter((t) => t.repo.slug === slug).length : tickets.length

  // The roster is every owner repo; only repos with something on the board get
  // a chip, so the rail doesn't drown in empty client stubs.
  const chipRepos = repos.filter((repo) => countFor(repo.slug) > 0)

  return (
    <AppScreen title="Tickets" subtitle={BOARD_SUBTITLE}>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <BoardRefresh />
          {/* The estate-wide maintenance button: a session on icm-board with
              the consistency pass prompted, sent by the human. */}
          <Button asChild variant="secondary" size="sm">
            <a href={estateCheckSessionUrl()} target="_blank" rel="noreferrer">
              <Activity aria-hidden />
              Estate check
            </a>
          </Button>
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
              {chipRepos.map((repo) => (
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

            {/* The now-strip: today's picks, runs in flight, what's stuck —
                estate-wide, one glance. A rail on the phone, wrapping on
                desktop. Tap a card to peek at the full ticket. */}
            {visibleStrip.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h2 className="flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
                  Now
                  <span className="font-mono tabular-nums opacity-70">
                    {visibleStrip.length}
                  </span>
                </h2>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                  {visibleStrip.map((ticket) => (
                    <TicketPeek key={`${ticket.repo.fullName}/${ticket.path}`} ticket={ticket}>
                      <TicketDetail
                        ticket={ticket}
                        sessionUrl={claudeSessionUrl(ticket)}
                        terminalUrl={claudeTerminalUrl(ticket)}
                      />
                    </TicketPeek>
                  ))}
                </div>
              </section>
            ) : null}

            {visibleSections.length === 0 && visibleStrip.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {tickets.length > 0
                    ? "Nothing in this repo."
                    : "No open tickets — cut some into a repo's .icm/intake/."}
                </CardContent>
              </Card>
            ) : (
              visibleSections.map((section) => (
                <RepoSectionView key={section.repo.fullName} section={section} />
              ))
            )}
          </>
        )}
      </div>
    </AppScreen>
  )
}
