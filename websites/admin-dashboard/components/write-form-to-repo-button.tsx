"use client"

import { useState, useTransition } from "react"
import { GitCommitHorizontal } from "lucide-react"

import { Button, cn } from "@jamie-nisbet/ui"

import { writeFormAnswersToRepo } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// "Snapshot to deal folder" on an answered form: commit the rendered answers
// into the relationship's folder in icm-board (`workspaces/deals/<slug>/…/
// answers/`) so a `/client` session reads the lead's own words. Deliberate
// rather than automatic — a commit is an outward write, so it happens on a
// click, never overwrites, and the outcome (committed where, or why not) is
// said on the spot.
export function WriteFormToRepoButton({
  linkId,
  clientId,
}: {
  linkId: string
  clientId: string
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  )

  function onWrite() {
    hapticTick()
    startTransition(async () => {
      setResult(await writeFormAnswersToRepo(linkId, clientId))
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onWrite}
      >
        <GitCommitHorizontal />
        {pending ? "Committing…" : "Snapshot to deal folder"}
      </Button>
      {result ? (
        <span
          className={cn(
            "text-app-footnote break-all",
            result.ok ? "text-app-label-3" : "text-destructive"
          )}
        >
          {result.message}
        </span>
      ) : null}
    </>
  )
}
