import {
  GroupedList,
  GroupedRow,
  GroupedSection,
  Skeleton,
} from "@jamie-nisbet/ui"

import { AppProfileScreen } from "@/components/app-screen"

// A lead's profile is four reads — the record, its todos, its sent forms, and
// the questionnaire library out of two GitHub repos — so on mobile data there
// is a beat of nothing. The shape arrives first: the identity, the five action
// discs, then the groups, built from the same primitives as page.tsx so the
// real profile replaces this without the page jumping under a thumb already on
// its way to a row.
//
// The name is the one thing this can't know. It says "Lead" — the same word
// the browser tab carries — rather than a bar where a heading should be.

function SectionSkeleton({ rows, header }: { rows: string[]; header?: boolean }) {
  return (
    <GroupedSection header={header ? <Skeleton className="h-3 w-16" /> : undefined}>
      {rows.map((width, i) => (
        <GroupedRow
          key={i}
          chevron={false}
          label={<Skeleton className="h-3.5" style={{ width }} />}
          value={<Skeleton className="h-3.5 w-14" />}
        />
      ))}
    </GroupedSection>
  )
}

export default function LeadLoading() {
  return (
    <AppProfileScreen
      name="Lead"
      avatar={<Skeleton className="size-16 shrink-0 rounded-full" />}
      meta={<Skeleton className="h-3.5 w-32" />}
      back={<Skeleton className="h-6 w-16" />}
      actions={
        <div className="flex max-w-sm items-start gap-1 px-app-gutter pb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5 py-1"
            >
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      }
    >
      <GroupedList>
        <SectionSkeleton rows={["4rem", "6rem"]} />
        <SectionSkeleton header rows={["3.5rem", "5rem", "4.5rem"]} />
        <SectionSkeleton header rows={["3rem", "4rem"]} />
        <SectionSkeleton header rows={["7rem"]} />
        <span className="sr-only" role="status">
          Loading this lead
        </span>
      </GroupedList>
    </AppProfileScreen>
  )
}
