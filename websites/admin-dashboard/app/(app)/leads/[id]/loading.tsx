import { LogoLoader, Skeleton } from "@jamie-nisbet/ui"

// A lead's profile is several reads — the record, its sent forms, and the
// questionnaire library out of two GitHub repos — so on mobile data there is a
// beat of nothing. The shape arrives first, in the profile's own frame
// (components/lead-profile.tsx): the head with its action bar, then at the
// desk the record on the left and the tabs on the right, stacked below `lg` —
// so the real profile replaces this without the page jumping under a thumb or
// a pointer already on its way to something.
//
// The name is the one thing this can't know. It says "Lead" — the same word
// the browser tab carries — rather than a bar where a heading should be.

function RecordSkeleton({ rows }: { rows: string[] }) {
  return (
    <div className="flex flex-col">
      <div className="flex min-h-desk-control items-center">
        <Skeleton className="h-2.5 w-16 rounded-desk-key" />
      </div>
      {rows.map((width, i) => (
        <div
          key={i}
          className="flex min-h-desk-row items-center justify-between gap-3 border-b border-desk-line"
        >
          <Skeleton className="h-3 rounded-desk-key" style={{ width }} />
          <Skeleton className="h-3 w-20 rounded-desk-key" />
        </div>
      ))}
    </div>
  )
}

export default function LeadLoading() {
  return (
    <div className="flex flex-col lg:-mb-8 lg:h-dvh">
      <div className="shrink-0 border-b border-desk-line bg-desk-surface px-4 pt-2 lg:px-6">
        <div className="flex min-h-desk-control items-center">
          <Skeleton className="h-3 w-14 rounded-desk-key" />
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-start gap-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h1 className="text-desk-title text-desk-fg">Lead</h1>
              <span
                className="inline-flex items-center gap-1.5 text-desk-meta text-desk-fg-3"
                aria-hidden="true"
              >
                <LogoLoader
                  className="size-3.5"
                  role={undefined}
                  aria-label={undefined}
                />
                Loading the record
              </span>
            </div>
            <Skeleton className="h-6 w-20 rounded-desk-key" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            {["4rem", "6rem", "4rem", "7rem", "7rem", "7rem"].map(
              (width, i) => (
                <Skeleton
                  key={i}
                  className="h-desk-control rounded-desk-control"
                  style={{ width }}
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <div className="flex flex-col gap-6 border-desk-line bg-desk-surface px-4 py-4 lg:w-[26.25rem] lg:shrink-0 lg:border-r lg:px-6">
          <Skeleton className="h-20 w-full rounded-desk-pane" />
          <RecordSkeleton rows={["3rem", "4.5rem", "3.5rem"]} />
          <RecordSkeleton rows={["3.5rem", "3rem", "4rem", "3rem"]} />
          <RecordSkeleton rows={["3rem", "4rem"]} />
        </div>
        <div className="flex min-w-0 flex-col lg:flex-1">
          <div className="flex h-desk-toolbar items-center gap-5 border-t border-b border-desk-line bg-desk-surface px-4 lg:border-t-0 lg:px-6">
            {["3.5rem", "2.5rem", "3rem", "2.5rem"].map((width, i) => (
              <Skeleton
                key={i}
                className="h-3 rounded-desk-key"
                style={{ width }}
              />
            ))}
          </div>
          <div className="flex max-w-3xl flex-col px-4 py-4 lg:px-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-x-2 border-b border-desk-line py-3"
              >
                <Skeleton className="h-3 w-10 rounded-desk-key" />
                <span />
                <Skeleton className="h-3 w-2/3 rounded-desk-key" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading this lead
      </span>
    </div>
  )
}
