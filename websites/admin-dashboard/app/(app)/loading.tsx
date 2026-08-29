import { GroupedSection, Skeleton, cn } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// The feed is the widest read in the app — Neon, Stripe and every repo's
// `.icm/intake/` over the GitHub API, all at once — so it is the screen most
// likely to be looked at before it has landed. The shape goes first, built from
// the same pieces as page.tsx so the real sections replace it without the page
// jumping under a thumb already on its way to a row.
//
// Two sections of three rows, not four of everything: what the feed will
// actually hold is the one thing that can't be known here, and a skeleton that
// guesses high leaves the screen shrinking when the answer arrives. A quiet day
// resolving into fewer rows reads better than a busy one being cut short.
//
// It sits at the `(app)` segment root, but every screen under it — /leads,
// /money, /tickets, a lead's profile — ships its own, so in practice this is
// only ever the feed.

function RowSkeleton({ first }: { first?: boolean }) {
  return (
    <li
      className={cn(
        "relative flex items-center gap-3 bg-app-group px-4 py-2.5 md:gap-4 md:px-5 md:py-3.5",
        !first &&
          "before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          {/* The label line runs at body size, the detail line at footnote —
              two different bar heights, or the list reads as one grey block. */}
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-12 shrink-0" />
        </div>
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="size-4 shrink-0 rounded-full" />
    </li>
  )
}

function SectionSkeleton({ header }: { header: string }) {
  return (
    <div className="flex flex-col">
      {/* The header is knowable — it is the section's name, not its contents —
          so it is set rather than guessed at. Aligned on the row labels, the
          way GroupedSection sets its own. */}
      <div className="px-4 pb-2 text-app-footnote text-app-label-3">
        {header}
      </div>
      <GroupedSection>
        <ul>
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} first={i === 0} />
          ))}
        </ul>
      </GroupedSection>
    </div>
  )
}

export default function NeedsYouLoading() {
  return (
    <AppScreen
      title="Needs you"
      // The count is the one thing the subtitle carries, and it is exactly what
      // isn't known yet — so a bar rather than a guess. It stands on the page
      // canvas, where Skeleton's own fill nearly matches in dark; --app-press
      // is the tier's "one stop off whatever is under you" wash, which darkens
      // in light and lifts in dark.
      subtitle={<Skeleton className="mt-0.5 h-3.5 w-40 bg-app-press" />}
    >
      <div className="flex flex-col gap-app-section pt-1 pb-2">
        <SectionSkeleton header="Waiting on you" />
        <SectionSkeleton header="Overdue" />

        <span className="sr-only" role="status">
          Loading what needs you
        </span>
      </div>
    </AppScreen>
  )
}
