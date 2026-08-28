"use client"

import { useState } from "react"
import { ChevronRight, Copy, ExternalLink, GitBranch } from "lucide-react"

import { cn, toast } from "@jamie-nisbet/ui"

import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import { GROUP_DOT, priorityClass } from "@/components/ticket-look"
import type { Ticket } from "@/lib/tickets"

/** Open a Claude Code session in a new tab from a gesture. Swipes commit on
 * pointer-up — still a user gesture, so the popup is normally allowed; when a
 * blocker eats it anyway, say so instead of failing silently. */
export function openSession(url: string) {
  const opened = window.open(url, "_blank", "noopener")
  if (!opened) toast.error("Couldn't open a new tab — use the row's buttons")
}

export async function copyPrompt(prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt)
    toast("Prompt copied")
  } catch {
    toast.error("Couldn't reach the clipboard")
  }
}

// One stub inside an open batch sheet: a scan line (sequence, status dot,
// title, priority) that expands in place to the full ticket, wearing the same
// gestures as the rest of the board — swipe right to start it in Claude Code,
// swipe left for copy-prompt and GitHub. The expanded content is the
// server-rendered TicketDetail, passed through as children; its buttons are
// the same actions for the mouse the swipes are for the thumb.
export function BoardTicketRow({
  ticket,
  sessionUrl,
  children,
}: {
  ticket: Ticket
  sessionUrl: string | null
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // Bound to a const so the narrowing survives into the tray's closure.
  const prompt = ticket.prompt

  const icon = "size-5" // tray icons read at a glance mid-swipe

  const actions = (
    <>
      {prompt ? (
        <SwipeAction
          label="Copy"
          icon={<Copy className={icon} aria-hidden />}
          className="bg-muted-foreground text-background"
          onClick={() => copyPrompt(prompt)}
        />
      ) : null}
      <SwipeAction
        label="GitHub"
        icon={<GitBranch className={icon} aria-hidden />}
        className="bg-primary text-primary-foreground"
        href={ticket.htmlUrl}
        external
      />
    </>
  )

  return (
    <li className="rounded-lg border bg-card text-card-foreground">
      <SwipeRow
        // The row's own clip — the tray is revealed inside it, so it has to
        // carry the same radius as the card, or the reveal shows square
        // corners over the rounded ones.
        className="rounded-lg"
        actions={actions}
        commit={
          sessionUrl
            ? {
                label: "Start",
                icon: <ExternalLink className="size-5" aria-hidden />,
                className: "bg-primary text-primary-foreground",
                onCommit: () => openSession(sessionUrl),
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-12 w-full items-center gap-3 bg-card px-3 py-2 text-left transition-colors active:bg-muted/50"
        >
          {/* The sequence number is the batch's whole point — it leads. */}
          <span className="w-4 shrink-0 text-center font-mono text-xs tabular-nums text-muted-foreground">
            {ticket.sequence ?? "·"}
          </span>
          <span
            className={cn("size-2 shrink-0 rounded-full", GROUP_DOT[ticket.group])}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {ticket.title}
          </span>
          {ticket.priority ? (
            <span className={cn("shrink-0 text-xs", priorityClass(ticket.priority))}>
              {ticket.priority}
            </span>
          ) : null}
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
            aria-hidden
          />
        </button>
      </SwipeRow>
      {/* Outside the SwipeRow so the reading surface holds still under a
          finger that's still swiping the scan line above it. */}
      {open ? <div className="border-t px-3 py-4">{children}</div> : null}
    </li>
  )
}
