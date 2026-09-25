import { RecordSection, Skeleton } from "@jamie-nisbet/ui"

import { DeskScreen } from "@/components/desk-screen"
import { LoadingLine } from "@/components/loading-line"
import { MoneyFigure, MoneyFigures } from "@/components/money-figures"

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
    <div className="flex min-h-desk-row items-center gap-3 border-b border-desk-line py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* The name line and the meta line under it — two different bar
            heights, or the list reads as one grey block. */}
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  )
}

export default function MoneyLoading() {
  return (
    <DeskScreen
      title="Money"
      subtitle={<LoadingLine>Loading Stripe</LoadingLine>}
      masthead={
        <MoneyFigures aria-hidden>
          {/* Two, not three: a balance the account has none of is omitted on
              the real screen, and a bar that resolves into nothing is a worse
              guess than one fewer bar. They take the sunken fill, which reads
              on the canvas in both themes. */}
          {[0, 1].map((i) => (
            <MoneyFigure
              key={i}
              value={<Skeleton className="my-1 h-5 w-24 bg-desk-sunken" />}
              label={<Skeleton className="mt-1 h-2.5 w-16 bg-desk-sunken" />}
            />
          ))}
        </MoneyFigures>
      }
    >
      <div className="flex flex-col gap-6 pt-1 pb-2">
        <RecordSection header="Invoices">
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </RecordSection>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
          <RecordSection header="Payment links">
            {[0, 1].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </RecordSection>

          <RecordSection header="Recent payments">
            {[0, 1].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </RecordSection>
        </div>

        <span className="sr-only" role="status">
          Loading money
        </span>
      </div>
    </DeskScreen>
  )
}
