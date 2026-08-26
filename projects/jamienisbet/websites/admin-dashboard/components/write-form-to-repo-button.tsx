"use client"

import { useState, useTransition } from "react"
import { GitCommitHorizontal } from "lucide-react"

import { Button, cn } from "@jamie-nisbet/ui"

import { writeFormAnswersToRepo } from "@/app/(app)/actions"

// "Write to repo" on an answered form: commit the rendered answers into the
// client's delivery repo so sessions working there read the client's own words.
// Deliberate rather than automatic — a repo commit is an outward write, so it
// happens on a click, and the outcome (committed where, or why not) is said
// on the spot.
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
        {pending ? "Writing…" : "Write to repo"}
      </Button>
      {result ? (
        <span
          className={cn(
            "text-xs break-all",
            result.ok ? "text-muted-foreground" : "text-destructive"
          )}
        >
          {result.message}
        </span>
      ) : null}
    </>
  )
}
