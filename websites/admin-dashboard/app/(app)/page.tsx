import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { GitBranch } from "lucide-react"

import { GroupedBlock, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BoardRefresh } from "@/components/board-refresh"
import { TicketsBoard } from "@/components/tickets-board"
import { WorkDesk, WorkDeskNotConfigured } from "@/components/work-desk"
import { WorkScreen } from "@/components/work-screen"
import { readBoard, repoMaintenanceLaunchers } from "@/lib/tickets"

export const metadata: Metadata = { title: "Work" }

// No `dynamic = "force-dynamic"` here on purpose. `connection()` below is what
// makes this request-time, and it leaves the board its cache: force-dynamic
// sets `fetchCache: "force-no-store"` across the segment, which overrides the
// revalidate on every GitHub read in `lib/tickets.ts` and re-fetches the whole
// estate on every render. See the header of that file.

// Work — home. The estate's tickets are where the day goes, so the app opens
// on them (D-6); the Needs you feed that used to live here moved to /inbox,
// and /tickets redirects here with its query intact (next.config.ts).
//
// The server's whole part in the board: read it once and hand it over as plain
// data, to both of Work's layouts — the three desk panes from `lg`
// (components/work-desk.tsx) and the phone board under it
// (components/tickets-board.tsx); WorkScreen keeps the one the window is
// wide enough for. Choosing a view, an epic or a ticket all happens in the
// browser from there; this page runs again only when the refresh control
// asks it to.
export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; filter?: string }>
}) {
  const params = await searchParams

  // Before the feed, this route was the leads list, and its two view params
  // rode in the query string — so a bookmark or a home-screen shortcut of "my
  // open leads" is a `/?filter=open`. Those still mean the list, which lives
  // at /leads; the board's own params (?t= ?b= ?r= ?repo=) never collide.
  if (params.archived != null || params.filter != null) {
    const query = new URLSearchParams()
    if (params.archived) query.set("archived", params.archived)
    if (params.filter) query.set("filter", params.filter)
    const suffix = query.toString()
    redirect(suffix ? `/leads?${suffix}` : "/leads")
  }

  // The board is live state — a read per request, never prerendered.
  await connection()
  const board = await readBoard()

  // No token, no board — but a stated absence rather than a broken screen, the
  // way every missing-configuration case in this app degrades.
  if (!board) {
    return (
      <WorkScreen
        desk={<WorkDeskNotConfigured />}
        phone={
          <AppScreen title="Work" wide>
            <div className="flex flex-col gap-app-section pt-1 pb-2">
              <GroupedSection footer="Everything else in the app works without it.">
                <GroupedRow
                  icon={<GitBranch />}
                  label="GitHub isn't configured here"
                  chevron={false}
                />
                <GroupedBlock>
                  Set <span className="font-mono">GITHUB_TOKEN</span>{" "}
                  in this environment to read each repo&rsquo;s{" "}
                  <span className="font-mono">.icm/intake/</span>. The variable is
                  listed in <span className="font-mono">.env.example</span>.
                </GroupedBlock>
              </GroupedSection>
            </div>
          </AppScreen>
        }
      />
    )
  }

  // A repo whose read failed has no tickets, so no section, and nothing built
  // its maintenance launchers — but its view (opened from its error row) still
  // carries them: a failed read is usually a rate limit or a token's reach, and
  // a session can still work in the repo. Built here, where lib/tickets can be
  // reached.
  const sectioned = new Set(board.sections.map((s) => s.repo.fullName))
  const unreadableMaintenance = Object.fromEntries(
    board.errors
      .filter((e) => !sectioned.has(e.repo.fullName))
      .map((e) => [e.repo.fullName, repoMaintenanceLaunchers(e.repo)])
  )

  return (
    <WorkScreen
      desk={<WorkDesk board={board} unreadableMaintenance={unreadableMaintenance} />}
      phone={
        <AppScreen
          title="Work"
          wide
          actions={<BoardRefresh readAt={board.readAt} />}
        >
          <TicketsBoard board={board} unreadableMaintenance={unreadableMaintenance} />
        </AppScreen>
      }
    />
  )
}
