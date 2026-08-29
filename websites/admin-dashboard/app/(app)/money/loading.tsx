import { Card, CardHeader, Skeleton } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// Money is four Stripe round-trips in parallel (balance, invoices, links,
// payments) plus the lead list for the invoice picker, on every visit. The
// balance is the reason you opened the screen, so its shape lands first — three
// figures, then the invoice list under its heading.
//
// Deliberately mirrors page.tsx's two readings: the phone's single divided card
// of rows, and the three stat cards from `sm` up.

function InvoiceCardSkeleton() {
  return (
    <li className="flex flex-col rounded-lg border bg-card">
      <div className="flex flex-col gap-2 px-4 pt-3 pb-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-14 shrink-0" />
        </div>
      </div>
      <div className="border-t px-3 py-2">
        <Skeleton className="h-8 w-full" />
      </div>
    </li>
  )
}

export default function MoneyLoading() {
  return (
    <AppScreen title="Money">
      <div className="flex flex-col gap-8">
        {/* Phone: the three figures as rows in one card. */}
        <Card className="divide-y gap-0 py-0 sm:hidden">
          {["Available", "Pending", "Outstanding"].map((label) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </Card>

        {/* Desktop: the same three as stat cards. */}
        <div className="hidden gap-4 sm:grid sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              {/* CardHeader, not a bare div — Card already owns the vertical
                  padding, so anything else would sit taller than the real card. */}
              <CardHeader>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Invoices</h2>
            <p className="text-sm text-muted-foreground">
              A new invoice is created as a draft. Emailing it is a separate,
              deliberate step.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <InvoiceCardSkeleton key={i} />
            ))}
          </ul>
        </section>

        <span className="sr-only" role="status">
          Loading money
        </span>
      </div>
    </AppScreen>
  )
}
