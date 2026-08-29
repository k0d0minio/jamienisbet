"use client"

import { useEffect } from "react"
import { RotateCw, TriangleAlert } from "lucide-react"

import { Button, GroupedBlock, GroupedList, GroupedSection } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// When the profile itself can't be read — Neon unreachable, a GitHub read that
// threw rather than degrading — the screen says so in plain words and offers
// the one thing that helps. No stack traces: the message a Next error boundary
// receives in production is a digest anyway, and it belongs in the logs.
export default function LeadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <AppScreen title="Lead" subtitle="Couldn't load this one">
      <GroupedList className="px-0">
        <GroupedSection footer="If it keeps happening, the database or GitHub is the place to look.">
          <GroupedBlock>
            <span className="mb-2 flex items-center gap-2 text-app-callout text-app-label">
              <TriangleAlert className="size-5 text-destructive" aria-hidden />
              This lead didn&apos;t come back
            </span>
            <p>
              Something upstream refused the read. Nothing has been changed —
              try again, and the record will be exactly as it was.
            </p>
          </GroupedBlock>
        </GroupedSection>
        <Button type="button" onClick={reset} className="w-full sm:w-fit">
          <RotateCw />
          Try again
        </Button>
      </GroupedList>
    </AppScreen>
  )
}
