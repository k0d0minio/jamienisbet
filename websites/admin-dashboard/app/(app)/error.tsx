"use client"

import { useEffect } from "react"
import { RotateCw, TriangleAlert } from "lucide-react"

import { DeskButton, RecordBlock, RecordSection } from "@jamie-nisbet/ui"

import { DeskScreen } from "@/components/desk-screen"

// The boundary for the four screens. Each of them is a live read of something
// that isn't here — Neon, Stripe, every repo's `.icm/intake/` over the GitHub
// API — so "it didn't come back" is a state they all have, and the tier's
// fourth designed state (BRAND.md § four states) is what it should look like.
//
// The screens degrade one source at a time on their own: a missing key or a
// section that throws leaves a footnote and the rest of the feed. This catches
// what that can't — the read that took the whole render down with it — and it
// still has to read like the app rather than like a crash: the title bar and
// the account menu are where they always are, the words are plain, and the one
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
    <DeskScreen title="Didn't load" subtitle="Something upstream refused">
      <div className="flex flex-col gap-6 pt-4">
        <RecordSection footer="Nothing has been changed. If it keeps happening, the database, Stripe or GitHub is the place to look.">
          <RecordBlock>
            <span className="mb-2 flex items-center gap-2 text-desk-body font-semibold text-desk-fg">
              <TriangleAlert className="size-desk-icon text-desk-blocked" aria-hidden />
              This screen didn&apos;t come back
            </span>
            <p>
              One of the things it reads didn&apos;t answer. Try again — every
              screen here is a live read, so a second attempt is all it takes
              when whatever was down has come back.
            </p>
          </RecordBlock>
        </RecordSection>
        <DeskButton type="button" onClick={reset} className="w-full sm:w-fit">
          <RotateCw aria-hidden />
          Try again
        </DeskButton>
      </div>
    </DeskScreen>
  )
}
