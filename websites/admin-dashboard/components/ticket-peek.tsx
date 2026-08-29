"use client"

import {
  GroupedRow,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@jamie-nisbet/ui"

import { GROUP_DOT, GROUP_LABELS, priorityClass } from "@/components/ticket-look"
import type { Ticket } from "@/lib/tickets"

// One line on the now-strip: a today-pick, a run in flight, or a blocked stub,
// estate-wide. Tap peeks at the full ticket in a sheet — the strip answers
// "what's moving", the sheet answers "what exactly". The sheet body is the
// server-rendered TicketDetail, passed as children.
//
// It used to be a 176px card in a rail that scrolled sideways, which meant the
// strip could only ever show three at a time and every title truncated at four
// words. As a row in the board's leading group it gets the whole width, reads
// down like everything else in the app, and stops competing with the repo
// filter rail directly above it.
export function TicketPeek({
  ticket,
  children,
}: {
  ticket: Ticket
  children: React.ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <GroupedRow
          // The board's status vocabulary is a coloured bullet, not a glyph:
          // today is the accent, in flight is green, blocked is amber.
          icon={
            <span
              className={cn("size-2.5 rounded-full", GROUP_DOT[ticket.group])}
            />
          }
          label={ticket.title}
          description={
            <>
              <span className="font-mono">{ticket.repo.slug}</span>
              {` · ${GROUP_LABELS[ticket.group]}`}
            </>
          }
          value={
            ticket.priority ? (
              <span className={priorityClass(ticket.priority)}>
                {ticket.priority}
              </span>
            ) : undefined
          }
        />
      </SheetTrigger>

      {/* Two detents: the actions and metadata fit the half sheet with the
          board still behind it, and a drag up gives the ticket body the room
          it wants to be read in. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>{ticket.title}</SheetTitle>
          <SheetDescription>
            {GROUP_LABELS[ticket.group]} ·{" "}
            <span className="font-mono">{ticket.repo.slug}</span> ·{" "}
            <span className="font-mono">{ticket.id}</span>
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
