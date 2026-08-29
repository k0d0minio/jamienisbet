import { GlanceFigure, GlanceRow, GroupedSection, Skeleton } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// Money is four Stripe round-trips on every visit (balance, invoices, links,
// payments) plus the lead list for the invoice picker, so on mobile data there
// is a beat of nothing between tapping the tab and the screen arriving. The
// shape lands first, built from the same pieces as page.tsx so the real screen
// replaces this without the page jumping under a thumb already on its way.
//
// Deliberately not "Money, loading": the title, the balance figures, the
// section headers and a handful of rows are the screen, and all of them are
// knowable before the data is. What can't be known is left as a bar rather than
// guessed at — which is why the create rows aren't drawn either: they are real
// controls, and a control you can't press is worse than one that isn't there
// yet.

function RowSkeleton() {
  return (
    <div className="relative flex min-h-app-touch items-center gap-3 px-4 py-2.5 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator first:before:hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* The name line runs at body size and the meta line at footnote —
            two different bar heights, or the list reads as one grey block. */}
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  )
}

export default function MoneyLoading() {
  return (
    <AppScreen
      title="Money"
      masthead={
        <GlanceRow>
          {/* Two, not three: a balance the account has none of is omitted on
              the real screen, and a bar that resolves into nothing is a worse
              guess than one fewer bar.

              They stand on the page canvas rather than inside a group, where
              Skeleton's own fill is a near-match for the canvas in dark.
              --app-press is the tier's "one stop off whatever is under you"
              wash: it darkens in light and lifts in dark. */}
          {[0, 1].map((i) => (
            <GlanceFigure
              key={i}
              value={<Skeleton className="h-6 w-24 bg-app-press" />}
              label={<Skeleton className="mt-1 h-2.5 w-16 bg-app-press" />}
            />
          ))}
        </GlanceRow>
      }
    >
      <div className="flex flex-col gap-app-section pt-1 pb-2">
        <GroupedSection header="Invoices">
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </GroupedSection>

        <div className="flex flex-col gap-app-section lg:grid lg:grid-cols-2 lg:items-start">
          <GroupedSection header="Payment links">
            {[0, 1].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </GroupedSection>

          <GroupedSection header="Recent payments">
            {[0, 1].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </GroupedSection>
        </div>

        <span className="sr-only" role="status">
          Loading money
        </span>
      </div>
    </AppScreen>
  )
}
