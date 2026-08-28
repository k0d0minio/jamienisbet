"use client"

import { useState } from "react"
import { ExternalLink, Wrench } from "lucide-react"

import {
  IconButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jamie-nisbet/ui"

import type { MaintenanceLauncher } from "@/lib/tickets"

// The wrench on a repo section: a sheet of maintenance launchers — each one a
// Claude Code session link with the housekeeping prompt pre-filled (triage the
// backlog, sweep finished work). The board never writes; a human sends every
// session. Launchers arrive serialized from the server so the prompt copy
// lives in lib/tickets with the rest of the contract knowledge.
export function RepoMaintenance({
  repoSlug,
  repoUrl,
  launchers,
}: {
  repoSlug: string
  repoUrl: string
  launchers: MaintenanceLauncher[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        aria-label={`Maintenance for ${repoSlug}`}
        onClick={() => setOpen(true)}
      >
        <Wrench aria-hidden />
      </IconButton>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Maintenance · {repoSlug}</SheetTitle>
            <SheetDescription>
              Each opens a Claude Code session with the prompt filled in — you
              send it. The board itself never writes.
            </SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-2">
            {launchers.map((launcher) => (
              <li key={launcher.key}>
                <a
                  href={launcher.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-14 flex-col justify-center gap-0.5 rounded-lg border bg-card px-4 py-3 transition-colors active:bg-muted/50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {launcher.title}
                    <ExternalLink
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {launcher.hint}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm transition-colors active:bg-muted/50"
              >
                Open the repo on GitHub
                <ExternalLink
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
              </a>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
