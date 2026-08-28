import { Skeleton } from "@jamie-nisbet/ui"

// Tickets is a fan-out of GitHub reads — every connected repo's `.icm/intake/`
// folder, fetched on every visit (`dynamic = "force-dynamic"`). On a phone on
// mobile data that is a second or two of nothing, so the shape of the board
// arrives first: the filter rail, then two status groups of collapsed rows.
//
// Sized against page.tsx deliberately — the chips are the Chip height, the rows
// are the `min-h-14` summary — so the real board replaces this without the page
// jumping under a thumb that has already started moving.

function TicketRowSkeleton() {
  return (
    <li className="flex min-h-14 items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
      <Skeleton className="size-2 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <Skeleton className="size-4 shrink-0" />
    </li>
  )
}

function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <TicketRowSkeleton key={i} />
        ))}
      </ul>
    </section>
  )
}

export default function TicketsLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* The heading is static copy — it renders for real, and having it hold
          still is most of why this reads as loading rather than as broken. */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Each repo&apos;s <code>.icm/intake/</code>, read from main — edit in
          the repo, not here.
        </p>
      </div>

      {/* Repo filter rail. */}
      <div className="-mx-4 flex items-center gap-1 overflow-hidden px-4 sm:mx-0 sm:px-0">
        {[3.5, 6, 5, 7].map((w, i) => (
          <Skeleton key={i} className="h-11 shrink-0" style={{ width: `${w}rem` }} />
        ))}
      </div>

      <GroupSkeleton rows={2} />
      <GroupSkeleton rows={3} />

      <span className="sr-only" role="status">
        Loading tickets
      </span>
    </div>
  )
}
