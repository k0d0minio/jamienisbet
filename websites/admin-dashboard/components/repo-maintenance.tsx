"use client"

import { Copy, GitBranch } from "lucide-react"

import { GroupedRow, GroupedSection } from "@jamie-nisbet/ui"

import { CopyLaunchRow } from "@/components/launch-menu"
import type { MaintenanceLauncher } from "@/lib/tickets"

// The housekeeping a repo's intake needs (triage the backlog, sweep finished
// work): a tap copies the prompt, and the row's trailing menu opens it
// pre-filled in any registered tool. The board never writes; a human sends
// every session. Launchers arrive serialized from the server so the prompt
// copy lives in lib/tickets with the rest of the contract knowledge.
//
// It used to be a row at the foot of each repo's group that opened these in a
// sheet. The repo has a view of its own now — opened by tapping its header on
// the board — so they sit there as a plain group, one tap closer.
export function RepoMaintenance({
  repoUrl,
  launchers,
}: {
  repoUrl: string
  launchers: MaintenanceLauncher[]
}) {
  return (
    <GroupedSection
      header="Maintenance"
      footer="The board itself never writes. Nothing here changes a ticket until you send the session and it commits."
    >
      {launchers.map((launcher) => (
        <CopyLaunchRow
          key={launcher.key}
          icon={<Copy />}
          label={launcher.title}
          description={launcher.hint}
          prompt={launcher.launch.prompt}
          launches={launcher.launch.launches}
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
  )
}
