"use client"

import { ChevronRight, Copy, GitBranch } from "lucide-react"

import { cn, toast } from "@jamie-nisbet/ui"

import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import {
  ACTIVE_ROW,
  CURSOR_SCROLL_MARGIN,
  GROUP_DOT,
  priorityClass,
} from "@/components/ticket-look"
import type { Ticket } from "@/lib/tickets"

export async function copyPrompt(prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt)
    toast("Prompt copied")
  } catch {
    toast.error("Couldn't reach the clipboard")
  }
}

/** A run's stage, short: what its row says in the column a stub's priority
 *  takes. */
const RUN_STAGE_LABEL: Record<NonNullable<Ticket["runStage"]>, string> = {
  build: "build next",
  release: "release next",
  lane: "lane",
}

// One ticket on list level 1 — a stub in its batch, or a run in flight: a scan
// line (sequence, status dot, title, priority) that selects the ticket, wearing
// the same gestures as the rest of the board — swipe right to copy what it
// sends, swipe left for copy-prompt and GitHub. The ticket itself opens in the
// pane, or pushed over the list on a phone.
//
// A row in its group rather than a bordered card of its own: no radius, no
// border, the group's slab owning the corners and clipping the tray to them.
export function BoardTicketRow({
  ticket,
  first,
  active,
  optionId,
  onSelect,
}: {
  ticket: Ticket
  /** First row in its group — the slab's own edge closes it, so it draws no
   *  hairline above itself. */
  first?: boolean
  /** The pane is showing this ticket (or, in the list's listbox, the
   *  keyboard's cursor is on it). */
  active?: boolean
  /** Set when the row is an option in the list's listbox (level 1): its id,
   *  for the listbox's `aria-activedescendant`. */
  optionId?: string
  onSelect: () => void
}) {
  // What the board sends for this ticket — the pipeline verb where the repo
  // carries the router, the prompt body otherwise (D26). Bound to a const so
  // the narrowing survives into the tray's closure.
  const prompt = ticket.pickup
  const trailing =
    ticket.kind === "run"
      ? ticket.runStage
        ? RUN_STAGE_LABEL[ticket.runStage]
        : null
      : ticket.priority

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

  return (
    // Inside the listbox the list item is scaffolding; the button is the
    // option.
    <li role={optionId ? "none" : undefined}>
      <SwipeRow
        actions={actions}
        commit={
          prompt
            ? {
                // Copy, like the opened ticket's button: no tool link is the
                // default until it is proven. The leading full swipe takes the
                // tint, as it does everywhere else in the app.
                label: "Copy",
                icon: <Copy className="size-6" aria-hidden />,
                className: "bg-app-tint text-primary-foreground",
                onCommit: () => copyPrompt(prompt),
              }
            : undefined
        }
      >
        <span className="sr-only">{`Swipe for actions on ${ticket.title}`}</span>
        <button
          type="button"
          id={optionId}
          role={optionId ? "option" : undefined}
          aria-selected={optionId ? Boolean(active) : undefined}
          onClick={onSelect}
          aria-current={!optionId && active ? "true" : undefined}
          className={cn(
            "relative flex min-h-app-touch w-full items-center gap-3 bg-app-group px-4 py-2.5 text-left",
            "transition-colors spring-press active:bg-app-press",
            active && ACTIVE_ROW,
            optionId && CURSOR_SCROLL_MARGIN,
            !first &&
              // Inset to the padding, not the label column: the sequence is
              // part of the scan line, and a hairline that skipped it would
              // cut the number off from its row.
              "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator"
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
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-app-callout font-medium text-app-label",
              // A run's title is its slug — an identifier, so mono.
              ticket.kind === "run" && "font-mono"
            )}
          >
            {ticket.title}
          </span>
          {trailing ? (
            <span
              className={cn(
                "shrink-0 text-app-footnote",
                ticket.kind === "run"
                  ? "font-mono text-app-label-3"
                  : priorityClass(ticket.priority)
              )}
            >
              {trailing}
            </span>
          ) : null}
          <ChevronRight className="size-4 shrink-0 text-app-label-3" aria-hidden />
        </button>
      </SwipeRow>
    </li>
  )
}
