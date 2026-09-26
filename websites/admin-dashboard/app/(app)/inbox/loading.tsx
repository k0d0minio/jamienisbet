import { Pane, PaneBody, PaneHeader, Skeleton } from "@jamie-nisbet/ui"

// The queue's shape while it reads: the same two panes, the gates' loading
// line, the follow-ups' group header, and a handful of rows — not a guess at
// how many, since a quiet day resolving into fewer rows reads better than a
// busy one being cut short. Built from the
// page's own primitives, so the real screen replaces it without the list
// jumping under a pointer already on its way to a row.

function RowSkeleton() {
  return (
    <li className="flex min-h-desk-row items-start gap-3 border-b border-desk-line px-5 py-2 lg:h-desk-row lg:items-center lg:py-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
        <Skeleton className="h-3 w-20 lg:w-32 lg:shrink-0" />
        <Skeleton className="h-3.5 w-2/5 lg:flex-1" />
        <Skeleton className="h-3 w-1/3 lg:w-24" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0" />
    </li>
  )
}

export default function InboxLoading() {
  return (
    <div
      aria-busy
      aria-label="Loading the Inbox"
      className="flex flex-col lg:-mb-8 lg:h-dvh lg:flex-row"
    >
      <Pane
        aria-label="Inbox"
        className="max-lg:border-r-0 lg:w-2/5 lg:max-w-xl lg:min-w-96 lg:shrink-0"
      >
        <PaneHeader title="Inbox" titleAs="h1" />
        <PaneBody>
          {/* The gates' one-line placeholder — the group streams in after
              the follow-ups, so it holds its place as a single line. */}
          <div className="flex min-h-desk-row items-center gap-3 border-b border-desk-line px-5 py-2">
            <span className="font-mono text-desk-micro text-desk-fg-3">
              Reading GitHub
            </span>
            <Skeleton className="h-3 flex-1" />
          </div>
          <div className="flex h-desk-row items-center border-b border-desk-line bg-desk-hover px-5 font-mono text-desk-micro tracking-desk-eyebrow text-desk-fg-2 uppercase">
            Follow-ups
          </div>
          <ul>
            {[0, 1, 2, 3, 4].map((index) => (
              <RowSkeleton key={index} />
            ))}
          </ul>
        </PaneBody>
      </Pane>
      <Pane aria-hidden className="hidden flex-1 lg:flex">
        <PaneBody className="flex flex-col gap-4 px-8 py-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
        </PaneBody>
      </Pane>
    </div>
  )
}
