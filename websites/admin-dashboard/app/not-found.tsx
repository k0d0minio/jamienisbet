import Link from "next/link"
import { Inbox, MapPinOff } from "lucide-react"

import { GroupedBlock, GroupedList, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"

import { AppScreen } from "@/components/app-screen"

// What a URL that isn't a screen looks like — including the one that actually
// happens: a lead's page reached from a bookmark after the record was deleted
// (`notFound()` in `leads/[id]/page.tsx`). Next's own 404 is a bare white page
// with a stack of routing jargon on it, which in an installed app reads as the
// app having broken rather than as a wrong turn.
//
// It sits at the app root rather than inside `(app)`, so it also answers a URL
// that matches no route at all. That costs it the tab bar — nothing outside the
// authenticated group renders the shell — which is why the way back is a row
// rather than a tab: a dead end in a standalone window with no browser chrome
// needs a door in it.
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl pb-screen-safe">
      <AppScreen title="Not here" subtitle="Nothing at this address">
        <GroupedList className="px-0">
          <GroupedSection footer="A lead that has been deleted leaves its address behind — a bookmark or a back button can still reach it.">
            <GroupedBlock>
              <span className="mb-2 flex items-center gap-2 text-app-callout text-app-label">
                <MapPinOff className="size-5 text-app-label-3" aria-hidden />
                There is no screen at this address
              </span>
              <p>
                Either it never existed, or whatever was here has been deleted
                since the link was made.
              </p>
            </GroupedBlock>
          </GroupedSection>

          <GroupedSection>
            <GroupedRow asChild icon={<Inbox />} label="Back to what needs you">
              <Link href="/" />
            </GroupedRow>
          </GroupedSection>
        </GroupedList>
      </AppScreen>
    </main>
  )
}
