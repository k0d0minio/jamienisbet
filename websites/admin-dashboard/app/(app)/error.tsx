"use client"

import { useEffect } from "react"
import { RotateCw, TriangleAlert } from "lucide-react"

import { Button, GroupedBlock, GroupedList, GroupedSection } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// The boundary for the four screens. Each of them is a live read of something
// that isn't here — Neon, Stripe, every repo's `.icm/intake/` over the GitHub
// API — so "it didn't come back" is a state they all have, and the tier's
// fourth designed state (BRAND.md § four states) is what it should look like.
//
// The screens degrade one source at a time on their own: a missing key or a
// section that throws leaves a footnote and the rest of the feed. This catches
// what that can't — the read that took the whole render down with it — and it
// still has to read like the app rather than like a crash: the compact bar and
// the app menu are where they always are, the words are plain, and the one
// thing that helps is under a thumb.
//
// A lead's own profile keeps its own boundary
// (`leads/[id]/error.tsx`), because it can name the record that didn't load.
//
// No stack trace: in production a Next error boundary is handed a digest and
// nothing else, and the trace belongs in the logs either way.
export default function AppError({
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
    <AppScreen title="Didn't load" subtitle="Something upstream refused">
      <GroupedList className="px-0">
        <GroupedSection footer="Nothing has been changed. If it keeps happening, the database, Stripe or GitHub is the place to look.">
          <GroupedBlock>
            <span className="mb-2 flex items-center gap-2 text-app-callout text-app-label">
              <TriangleAlert className="size-5 text-destructive" aria-hidden />
              This screen didn&apos;t come back
            </span>
            <p>
              One of the things it reads didn&apos;t answer. Try again — every
              screen here is a live read, so a second attempt is all it takes
              when whatever was down has come back.
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
