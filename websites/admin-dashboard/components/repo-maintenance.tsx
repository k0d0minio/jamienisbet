"use client"

import { ExternalLink, GitBranch, Wrench } from "lucide-react"

import {
  GroupedRow,
  GroupedSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@jamie-nisbet/ui"

import type { MaintenanceLauncher } from "@/lib/tickets"

// A repo section's last row: the housekeeping a repo's intake needs, in a sheet
// of launchers — each one a Claude Code session link with the prompt pre-filled
// (triage the backlog, sweep finished work). The board never writes; a human
// sends every session. Launchers arrive serialized from the server so the
// prompt copy lives in lib/tickets with the rest of the contract knowledge.
//
// It used to be a wrench squeezed into the section's heading, which put a 44px
// control inside a line of 13px prose and left it easy to miss on a phone. A
// row at the foot of the group is where a native list puts the action that
// applies to the whole group, and it can say what it is.
export function RepoMaintenance({
  repoSlug,
  repoUrl,
  launchers,
}: {
  repoSlug: string
  repoUrl: string
  launchers: MaintenanceLauncher[]
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <GroupedRow
          icon={<Wrench />}
          label="Maintenance"
          description="Triage, sweep, and the repo on GitHub"
        />
      </SheetTrigger>

      {/* Two detents: the launchers fit the half sheet with the board still
          visible behind it, and a drag up brings their hints fully into view. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>
            Maintenance · <span className="font-mono">{repoSlug}</span>
          </SheetTitle>
          <SheetDescription>
            Each opens a Claude Code session with the prompt filled in — you
            send it.
          </SheetDescription>
        </SheetHeader>

        <GroupedSection footer="The board itself never writes. Nothing here changes a ticket until you send the session and it commits.">
          {launchers.map((launcher) => (
            <GroupedRow
              key={launcher.key}
              icon={<ExternalLink />}
              label={launcher.title}
              description={launcher.hint}
              href={launcher.url}
              target="_blank"
              rel="noreferrer"
              chevron={false}
            />
          ))}
          <GroupedRow
            icon={<GitBranch />}
            label="Open the repo on GitHub"
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            chevron={false}
          />
        </GroupedSection>
      </SheetContent>
    </Sheet>
  )
}
