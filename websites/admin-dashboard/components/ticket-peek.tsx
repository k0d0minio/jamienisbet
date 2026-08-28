"use client"

import { useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from "@jamie-nisbet/ui"

import { GROUP_DOT, GROUP_LABELS, priorityClass } from "@/components/ticket-look"
import type { Ticket } from "@/lib/tickets"

// One card on the now-strip: a compact estate-wide glance at a today-pick, a
// run in flight, or a blocked stub. Tap peeks at the full ticket in a sheet —
// the strip answers "what's moving", the sheet answers "what exactly". The
// sheet body is the server-rendered TicketDetail, passed as children.
export function TicketPeek({
  ticket,
  children,
}: {
  ticket: Ticket
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${GROUP_LABELS[ticket.group]} · ${ticket.repo.slug} · ${ticket.title}`}
        className="flex w-44 shrink-0 flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-left text-card-foreground transition-colors active:bg-muted/50"
      >
        <span className="flex w-full items-center gap-1.5 text-xs">
          <span
            className={cn("size-2 shrink-0 rounded-full", GROUP_DOT[ticket.group])}
            aria-hidden
          />
          <span className="min-w-0 truncate font-mono text-muted-foreground">
            {ticket.repo.slug}
          </span>
          {ticket.priority ? (
            <span className={cn("ml-auto shrink-0", priorityClass(ticket.priority))}>
              {ticket.priority}
            </span>
          ) : null}
        </span>
        <span className="w-full truncate text-sm font-medium">{ticket.title}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{ticket.title}</SheetTitle>
            <SheetDescription>
              {GROUP_LABELS[ticket.group]} · {ticket.repo.slug} ·{" "}
              <span className="font-mono">{ticket.id}</span>
            </SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    </>
  )
}
