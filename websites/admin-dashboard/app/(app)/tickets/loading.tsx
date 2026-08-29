import { Skeleton } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// Tickets is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
// folder, fetched on every visit (`dynamic = "force-dynamic"`). On a phone on
// mobile data that is a second or two of nothing, so the shape of the board
// arrives first: the filter rail, the now-strip, then a repo section of batch
// lines.
//
// Sized against page.tsx deliberately — the chips are the Chip height, the
// strip cards are the peek card, the batch lines carry the same three rows —
// so the real board replaces this without the page jumping under a thumb that
// has already started moving.

function PeekSkeleton() {
  return (
    <div className="flex w-44 shrink-0 flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-2 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  )
}

function BatchSkeleton() {
  return (
    <div className="flex min-h-14 flex-col justify-center gap-2 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="ml-auto h-3 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  )
}

function SectionSkeleton({ batches }: { batches: number }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="ml-auto h-3 w-12" />
        <Skeleton className="size-9 rounded-md" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: batches }, (_, i) => (
          <BatchSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

export default function TicketsLoading() {
  return (
    // The header is static copy — it renders for real, and having the title
    // hold still through the load is most of why this reads as loading rather
    // than as broken. Same words as page.tsx, so nothing about the header
    // changes when the board arrives under it.
    <AppScreen
      title="Tickets"
      subtitle={
        <>
          Each repo&apos;s <code>.icm/intake/</code>, read from main — edit in
          the repo, not here.
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>

        {/* Repo filter rail. */}
        <div className="-mx-4 flex items-center gap-1 overflow-hidden px-4 sm:mx-0 sm:px-0">
          {[3.5, 6, 5, 7].map((w, i) => (
            <Skeleton
              key={i}
              className="h-11 shrink-0"
              style={{ width: `${w}rem` }}
            />
          ))}
        </div>

        {/* The now-strip. */}
        <section className="flex flex-col gap-2">
          <Skeleton className="h-3 w-10" />
          <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:px-0">
            {Array.from({ length: 4 }, (_, i) => (
              <PeekSkeleton key={i} />
            ))}
          </div>
        </section>

        <SectionSkeleton batches={2} />
        <SectionSkeleton batches={3} />

        <span className="sr-only" role="status">
          Loading tickets
        </span>
      </div>
    </AppScreen>
  )
}
