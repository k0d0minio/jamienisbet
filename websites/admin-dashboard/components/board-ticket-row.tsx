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
//
// A row in the sheet's group rather than a bordered card of its own: no radius,
// no border, the group's slab owning the corners and clipping the tray to them.
export function BoardTicketRow({
  ticket,
  sessionUrl,
  first,
  children,
}: {
  ticket: Ticket
  sessionUrl: string | null
  /** First row in the sheet's group — the slab's own edge closes it, so it
   *  draws no hairline above itself. */
  first?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // What the board sends for this ticket — the pipeline verb where the repo
  // carries the router, the prompt body otherwise (D26). Bound to a const so
  // the narrowing survives into the tray's closure.
  const prompt = ticket.pickup

  const icon = "size-6" // tray icons read at a glance mid-swipe

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

  // The hairline rides inside the moving content, so it travels with the row
  // rather than cutting across the revealed tray. An open row keeps its own
  // top line and hands the bottom one to the reading surface below it.
  const hairline =
    "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator"

  return (
    <li>
      <SwipeRow
        actions={actions}
        commit={
          sessionUrl
            ? {
                label: "Start",
                icon: <ExternalLink className="size-6" aria-hidden />,
                // The leading full swipe takes the tint, as it does everywhere
                // else in the app.
                className: "bg-app-tint text-primary-foreground",
                onCommit: () => openSession(sessionUrl),
              }
            : undefined
        }
      >
        <span className="sr-only">{`Swipe for actions on ${ticket.title}`}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "relative flex min-h-app-touch w-full items-center gap-3 bg-app-group px-4 py-2.5 text-left",
            "transition-colors spring-press active:bg-app-press",
            !first && hairline
          )}
        >
          {/* The sequence number is the batch's whole point — it leads, and it
              is a figure, so it sets in mono. */}
          <span className="w-4 shrink-0 text-center font-mono text-app-caption tabular-nums text-app-label-3">
            {ticket.sequence ?? "·"}
          </span>
          <span
            className={cn("size-2.5 shrink-0 rounded-full", GROUP_DOT[ticket.group])}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-app-callout font-medium text-app-label">
            {ticket.title}
          </span>
          {ticket.priority ? (
            <span
              className={cn(
                "shrink-0 text-app-footnote",
                priorityClass(ticket.priority)
              )}
            >
              {ticket.priority}
            </span>
          ) : null}
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-app-label-3 transition-transform spring-press",
              open && "rotate-90"
            )}
            aria-hidden
          />
        </button>
      </SwipeRow>
      {/* Outside the SwipeRow so the reading surface holds still under a
          finger that's still swiping the scan line above it. */}
      {open ? (
        <div className={cn("relative bg-app-group px-4 py-4", hairline)}>
          {children}
        </div>
      ) : null}
    </li>
  )
}
