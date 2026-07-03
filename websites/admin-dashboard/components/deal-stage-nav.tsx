"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@jamie-nisbet/ui"

import { DEAL_STAGES } from "@/lib/deal-stages"

// The deal's own tab bar — a horizontally scrollable pill row that moves
// between the hub, the three stage pages, and the documents list without a
// trip back to the overview. Scrolls under the thumb on a phone; wraps to a
// single visible row on desktop. Highlighting is driven by the URL so it
// stays correct after client navigation.
export function DealStageNav({ dealId }: { dealId: string }) {
  const pathname = usePathname()

  const tabs = [
    { href: `/deals/${dealId}`, label: "Overview", exact: true },
    ...DEAL_STAGES.map((s) => ({
      href: `/deals/${dealId}/${s.slug}`,
      label: `${s.step} · ${s.short}`,
      exact: false,
    })),
    { href: `/deals/${dealId}/documents`, label: "Documents", exact: false },
  ]

  return (
    <nav
      aria-label="Deal stages"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max gap-2 pb-1">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
