import type { Metadata } from "next"
import { connection } from "next/server"
import { GitBranch } from "lucide-react"

import { GroupedBlock, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"
import { BoardRefresh } from "@/components/board-refresh"
import { TicketsBoard } from "@/components/tickets-board"
import { readBoard, repoMaintenanceLaunchers } from "@/lib/tickets"

export const metadata: Metadata = { title: "Tickets" }

// No `dynamic = "force-dynamic"` here on purpose. `connection()` below is what
// makes this request-time, and it leaves the board its cache: force-dynamic
// sets `fetchCache: "force-no-store"` across the segment, which overrides the
// revalidate on every GitHub read in `lib/tickets.ts` and re-fetches the whole
// estate on every render. See the header of that file.

// The server's whole part in the board: read it once and hand it over as plain
// data. Filtering, drilling into a batch and opening a ticket, a batch or a
// repo all happen in the browser from there (components/tickets-board.tsx);
// this page runs again only when the refresh control asks it to.
export default async function TicketsPage() {
  // The board is live state — a read per request, never prerendered.
  await connection()
  const board = await readBoard()

  // No token, no board — but a stated absence rather than a broken screen, the
  // way every missing-configuration case in this app degrades.
  if (!board) {
    return (
      <AppScreen title="Tickets">
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
    )
  }

  // A repo whose only open work is a run in flight has no section in the
  // board, so nothing built its maintenance launchers — and its repo view
  // needs them. Built here, where lib/tickets can be reached.
  const sectioned = new Set(board.sections.map((s) => s.repo.fullName))
  const extraMaintenance = Object.fromEntries(
    board.strip
      .filter((t) => t.kind === "run" && !sectioned.has(t.repo.fullName))
      .map((t) => [t.repo.fullName, repoMaintenanceLaunchers(t.repo)])
  )

  return (
    <AppScreen title="Tickets" actions={<BoardRefresh readAt={board.readAt} />}>
      <TicketsBoard board={board} extraMaintenance={extraMaintenance} />
    </AppScreen>
  )
}
