"use client"

import { Check, Mail, MessageCircle } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

import {
  InboxActions,
  KIND_TAG,
  LogTouch,
  type InboxHandlers,
} from "@/components/inbox-detail"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import type { InboxRow } from "@/lib/inbox-row"

// One follow-up in the queue.
//
// At the desk (from `lg`) a single dense line — kind tag, name, who or where,
// age — and a click selects it into the detail pane. Below `lg` the same row
// in two lines, and a tap opens it in place with its actions (one open at a
// time); outreach and stale rows also keep the leads list's swipes (D-32):
// right marks the lead touched, left reveals the doors to reach them on.

export function InboxRowItem({
  row,
  selected,
  desk,
  logging,
  handlers,
  onPick,
  rowRef,
}: {
  row: InboxRow
  /** At the desk: the pane shows it. On the phone: it is open in place. */
  selected: boolean
  desk: boolean
  logging: boolean
  handlers: InboxHandlers
  onPick: () => void
  rowRef: (node: HTMLButtonElement | null) => void
}) {
  const open = !desk && selected

  const button = (
    <button
      ref={rowRef}
      type="button"
      onClick={onPick}
      aria-current={desk && selected ? "true" : undefined}
      aria-expanded={desk ? undefined : open}
      className={cn(
        // Opaque on purpose: on the phone the swipe tray sits behind it.
        "flex w-full min-w-0 items-start gap-3 border-b border-desk-line bg-desk-surface px-5 text-left",
        "min-h-desk-row py-2 transition-colors duration-100 hover:bg-desk-hover",
        "lg:h-desk-row lg:items-center lg:py-0",
        selected && "bg-desk-sunken hover:bg-desk-sunken",
        open && "border-b-0"
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:items-center lg:gap-3">
        <span className="truncate font-mono text-desk-micro text-desk-fg-2 lg:w-32 lg:shrink-0">
          {KIND_TAG[row.kind]}
        </span>
        <span
          className={cn(
            "truncate text-desk-ui lg:min-w-0 lg:flex-1",
            selected ? "font-semibold" : "font-medium"
          )}
        >
          {row.name}
        </span>
        {row.who ? (
          <span className="truncate font-mono text-desk-meta text-desk-fg-3 lg:max-w-48 lg:shrink-0">
            {row.who}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 font-mono text-desk-meta tabular-nums lg:w-16 lg:text-right",
          row.late ? "text-desk-blocked" : "text-desk-fg-3"
        )}
      >
        <span aria-hidden>{row.age}</span>
        <span className="sr-only">{row.ageSpoken}</span>
      </span>
    </button>
  )

  return (
    <li>
      {!desk && row.kind !== "wake" ? (
        <SwipeRow
          actions={<ReachTray row={row} />}
          commit={{
            label: "Touched",
            icon: <Check className="size-6" aria-hidden />,
            className: "bg-desk-ink text-desk-ink-fg",
            onCommit: () => handlers.touched(row),
          }}
        >
          <span className="sr-only">{`Swipe for actions on ${row.name}`}</span>
          {button}
        </SwipeRow>
      ) : (
        button
      )}

      {open ? (
        <div className="flex flex-col gap-3 border-b border-desk-line bg-desk-sunken px-5 pt-1 pb-4">
          <p className="text-desk-body text-desk-fg-2">{row.text}</p>
          <InboxActions row={row} handlers={handlers} layout="phone" />
          {logging ? <LogTouch row={row} handlers={handlers} /> : null}
        </div>
      ) : null}
    </li>
  )
}

/** The swipe-left tray: the doors that are links, WhatsApp and email — the
 *  same two the leads list offers under a thumb. */
function ReachTray({ row }: { row: InboxRow }) {
  const icon = "size-6"
  return (
    <>
      {row.reach
        .filter((link) => link.channel === "whatsapp" || link.channel === "email")
        .map((link) => (
          <SwipeAction
            key={link.channel}
            label={link.label}
            icon={
              link.channel === "whatsapp" ? (
                <MessageCircle className={icon} aria-hidden />
              ) : (
                <Mail className={icon} aria-hidden />
              )
            }
            className={
              link.channel === "whatsapp"
                ? "bg-success text-success-foreground"
                : "bg-desk-ink text-desk-ink-fg"
            }
            href={link.href}
            external={link.external}
          />
        ))}
    </>
  )
}
