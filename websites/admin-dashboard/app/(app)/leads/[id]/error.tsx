"use client"

import { useEffect } from "react"
import { ChevronLeft, RotateCw, TriangleAlert } from "lucide-react"

import { DeskButton } from "@jamie-nisbet/ui"

import { ViewTransitionLink } from "@/components/view-transition-link"

// When the profile itself can't be read — Neon unreachable, a GitHub read that
// threw rather than degrading — the screen says so in plain words and offers
// the one thing that helps. No stack traces: the message a Next error boundary
// receives in production is a digest anyway, and it belongs in the logs.
// Drawn in the profile's own frame, so the way back is where it always is.
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
    <div className="flex flex-col">
      <div className="border-b border-desk-line bg-desk-surface px-4 pt-2 pb-4 lg:px-6">
        <div className="flex min-h-desk-control items-center">
          <ViewTransitionLink
            href="/leads"
            className="-ml-1.5 inline-flex min-h-desk-control items-center gap-0.5 rounded-desk-control pr-2 pl-0.5 text-desk-ui text-desk-fg-3 transition-colors duration-100 hover:bg-desk-hover hover:text-desk-fg"
          >
            <ChevronLeft className="size-desk-icon" aria-hidden />
            Leads
          </ViewTransitionLink>
        </div>
        <h1 className="pt-2 text-desk-title text-desk-fg">Lead</h1>
        <p className="text-desk-ui text-desk-fg-3">Couldn&apos;t load this one</p>
      </div>
      <div className="flex max-w-xl flex-col gap-4 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-desk-heading text-desk-fg">
            <TriangleAlert className="size-4 text-desk-blocked" aria-hidden />
            This lead didn&apos;t come back
          </span>
          <p className="text-desk-body text-desk-fg-2">
            Something upstream refused the read. Nothing has been changed —
            try again, and the record will be exactly as it was.
          </p>
          <p className="text-desk-meta text-desk-fg-3">
            If it keeps happening, the database or GitHub is the place to look.
          </p>
        </div>
        <DeskButton type="button" onClick={reset} className="w-fit">
          <RotateCw aria-hidden />
          Try again
        </DeskButton>
      </div>
    </div>
  )
}
