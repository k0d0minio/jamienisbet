"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import { DeskButton, cn, toast } from "@jamie-nisbet/ui"

import {
  logTouchAction,
  saveNextAction,
  type NextStepSuggestion,
} from "@/app/(app)/actions"
import type { InboxKind, InboxRow } from "@/lib/inbox-row"
import { CHANNELS, channelLabel, outcomesFor } from "@/lib/touches"

// The Inbox's actions, and the pane they sit in at the desk.
//
// One table decides what a row offers (the spec's kind table): a primary (↵),
// a secondary, and the rest. The desk's detail pane and the phone's expanded
// row both render it, so the two surfaces can never disagree about what a
// follow-up can be cleared with. Nothing here sends anything — reach is a
// link into somebody else's app, and a touch is logged by hand (D-33).

export const KIND_TAG: Record<InboxKind, string> = {
  outreach: "Outreach",
  waiting: "Waiting on you",
  wake: "Wake",
}

/** What the queue does when an action is taken — owned by the list, which
 *  holds the rows, the selection and the optimistic removals. */
export type InboxHandlers = {
  touched: (row: InboxRow) => void
  tomorrow: (row: InboxRow) => void
  wake: (row: InboxRow) => void
  later: (row: InboxRow) => void
  openLog: (row: InboxRow) => void
  closeLog: () => void
  /** Run a write that clears the row: it leaves the list at once, and comes
   *  back with a toast if the write fails. */
  clear: (
    row: InboxRow,
    run: () => Promise<void>,
    done: string,
    failed: string
  ) => void
}

type InboxAction =
  | {
      id: string
      label: string
      href: string
      external: boolean
      shortcut?: string[]
    }
  | { id: string; label: string; run: () => void; shortcut?: string[] }

type ActionSet = {
  primary: InboxAction
  secondary: InboxAction
  rest: InboxAction[]
}

/** The kind table. */
function actionsFor(row: InboxRow, h: InboxHandlers): ActionSet {
  const openLead: InboxAction = {
    id: "open",
    label: "Open lead",
    href: `/leads/${row.id}`,
    external: false,
  }
  const reach: InboxAction[] = row.reach.map((link) => ({
    id: `reach-${link.channel}`,
    label: link.label,
    href: link.href,
    external: link.external,
  }))
  const [firstReach, ...otherReach] = reach
  const touched: InboxAction = {
    id: "touched",
    label: "Mark touched",
    run: () => h.touched(row),
  }
  const tomorrow: InboxAction = {
    id: "tomorrow",
    label: "Tomorrow",
    run: () => h.tomorrow(row),
    shortcut: ["s"],
  }

  if (row.kind === "outreach") {
    return {
      primary: firstReach ?? openLead,
      secondary: {
        id: "log",
        label: "Log a touch",
        run: () => h.openLog(row),
        shortcut: ["e"],
      },
      rest: [
        tomorrow,
        ...otherReach,
        touched,
        ...(firstReach ? [openLead] : []),
      ],
    }
  }

  if (row.kind === "waiting") {
    return {
      primary: firstReach ?? openLead,
      secondary: { ...touched, shortcut: ["e"] },
      rest: [...otherReach, ...(firstReach ? [openLead] : [])],
    }
  }

  return {
    primary: {
      id: "wake",
      label: "Wake",
      run: () => h.wake(row),
      shortcut: ["e"],
    },
    secondary: {
      id: "later",
      label: "Later · +90 days",
      run: () => h.later(row),
    },
    rest: [tomorrow, ...reach, openLead],
  }
}

function ActionButton({
  action,
  variant,
  role,
  className,
}: {
  action: InboxAction
  variant: "primary" | "secondary" | "ghost"
  /** Marks the element the keyboard's ↵ clicks. */
  role?: "primary"
  className?: string
}) {
  const marker = role === "primary" ? "" : undefined
  const shortcut = action.shortcut ?? (role === "primary" ? ["↵"] : undefined)

  if ("href" in action) {
    const hint = shortcut ? (
      <span aria-hidden className="font-mono text-desk-micro font-normal opacity-70">
        {shortcut.join("")}
      </span>
    ) : null
    return (
      <DeskButton asChild variant={variant} className={className}>
        {action.external ? (
          <a href={action.href} target="_blank" rel="noreferrer" data-inbox-primary={marker}>
            {action.label}
            {hint}
          </a>
        ) : action.href.startsWith("/") ? (
          <Link href={action.href} data-inbox-primary={marker}>
            {action.label}
            {hint}
          </Link>
        ) : (
          <a href={action.href} data-inbox-primary={marker}>
            {action.label}
            {hint}
          </a>
        )}
      </DeskButton>
    )
  }

  return (
    <DeskButton
      variant={variant}
      shortcut={shortcut}
      onClick={action.run}
      className={className}
      data-inbox-primary={marker}
    >
      {action.label}
    </DeskButton>
  )
}

/**
 * The actions of one row. At the desk a row of buttons, primary first; on the
 * phone the primary and secondary as two full-width buttons — 44px under a
 * thumb, through the tokens — and the rest as a line of text buttons.
 */
export function InboxActions({
  row,
  handlers,
  layout,
}: {
  row: InboxRow
  handlers: InboxHandlers
  layout: "pane" | "phone"
}) {
  const { primary, secondary, rest } = actionsFor(row, handlers)

  if (layout === "phone") {
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton action={primary} variant="primary" role="primary" />
          <ActionButton action={secondary} variant="secondary" />
        </div>
        {rest.length > 0 ? (
          <div className="-mx-2.5 flex flex-wrap">
            {rest.map((action) => (
              <ActionButton key={action.id} action={action} variant="ghost" />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionButton action={primary} variant="primary" role="primary" />
      <ActionButton action={secondary} variant="secondary" />
      {rest.map((action) => (
        <ActionButton key={action.id} action={action} variant="ghost" />
      ))}
    </div>
  )
}

const fieldClass =
  "h-desk-control w-full min-w-0 rounded-desk-control border border-desk-line-strong bg-desk-surface px-2 text-desk-ui text-desk-fg"

/** The `YYYY-MM-DD` slice a date field wants, out of an ISO timestamp. */
function dateValue(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Log a touch without leaving the queue: the channel starts on the row's
 * door, the outcome is what that door can produce, a note is optional. When
 * the cadence answers with a next step, the form turns into it — accept it
 * (or edit it first) and the row clears; "Not now" leaves the step as it was
 * and the row where it is. Only the operator's own submit ever logs anything.
 */
export function LogTouch({
  row,
  handlers,
}: {
  row: InboxRow
  handlers: InboxHandlers
}) {
  const [channel, setChannel] = useState(row.logChannel)
  const [suggestion, setSuggestion] = useState<NextStepSuggestion | null>(null)
  const [pending, startTransition] = useTransition()
  const outcomes = outcomesFor(channel)

  function onLog(formData: FormData) {
    startTransition(async () => {
      const result = await logTouchAction(row.id, formData)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      if (result.suggestion) {
        setSuggestion(result.suggestion)
      } else {
        toast(`Logged — nothing follows a no for ${row.name}`)
        handlers.closeLog()
      }
    })
  }

  function onSave(formData: FormData) {
    const park = suggestion?.kind === "park"
    handlers.closeLog()
    handlers.clear(
      row,
      () => saveNextAction(row.id, formData),
      park ? `Parked ${row.name}` : `Next step set for ${row.name}`,
      `Couldn't save the next step for ${row.name}`
    )
  }

  if (suggestion) {
    const park = suggestion.kind === "park"
    const heading = park
      ? "That's the cadence — park them?"
      : suggestion.kind === "reply"
        ? "They're talking — next step?"
        : "Logged. Next step?"
    const detail = [
      suggestion.step ? `Step ${suggestion.step} of ${suggestion.steps}` : null,
      suggestion.channel ? channelLabel(suggestion.channel) : null,
    ]
      .filter(Boolean)
      .join(" · ")

    return (
      <form
        action={onSave}
        className="flex flex-col gap-3 rounded-desk-pane border border-desk-line p-4"
        aria-label={`Next step for ${row.name}`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-desk-ui font-semibold">{heading}</h3>
          {detail ? (
            <span className="font-mono text-desk-meta text-desk-fg-3">
              {detail}
            </span>
          ) : null}
        </div>
        {park ? (
          <input type="hidden" name="park" value="1" />
        ) : (
          <label className="flex flex-col gap-1 text-desk-meta text-desk-fg-2">
            Next step
            <input
              name="action"
              defaultValue={suggestion.action}
              maxLength={200}
              autoCapitalize="sentences"
              enterKeyHint="done"
              autoFocus
              className={fieldClass}
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-desk-meta text-desk-fg-2">
          {park ? "Wake date" : "Due"}
          <input
            name="dueDate"
            type="date"
            required
            defaultValue={dateValue(
              park ? (suggestion.wakeAt ?? suggestion.dueAt) : suggestion.dueAt
            )}
            className={cn(fieldClass, "sm:max-w-52")}
          />
        </label>
        <div className="flex items-center gap-2">
          <DeskButton type="submit">{park ? "Park them" : "Set it"}</DeskButton>
          <DeskButton
            type="button"
            variant="ghost"
            onClick={() => {
              toast(`Logged — the step for ${row.name} is still due`)
              handlers.closeLog()
            }}
          >
            Not now
          </DeskButton>
        </div>
      </form>
    )
  }

  return (
    <form
      action={onLog}
      className="flex flex-col gap-3 rounded-desk-pane border border-desk-line p-4"
      aria-label={`Log a touch with ${row.name}`}
    >
      <h3 className="text-desk-ui font-semibold">Log a touch</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-desk-meta text-desk-fg-2">
          Channel
          <select
            name="channel"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            className={fieldClass}
          >
            {CHANNELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-desk-meta text-desk-fg-2">
          What came of it
          <select
            // Keyed to the channel: its outcomes differ, and the first one
            // is the likely answer on each door.
            key={channel}
            name="outcome"
            defaultValue={outcomes[0]?.value}
            autoFocus
            className={fieldClass}
          >
            {outcomes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-desk-meta text-desk-fg-2">
        Note (optional)
        <input
          name="note"
          maxLength={500}
          autoCapitalize="sentences"
          enterKeyHint="done"
          className={fieldClass}
        />
      </label>
      <div className="flex items-center gap-2">
        <DeskButton type="submit" loading={pending}>
          Log touch
        </DeskButton>
        <DeskButton
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={handlers.closeLog}
        >
          Cancel
        </DeskButton>
      </div>
    </form>
  )
}

/** The desk's detail pane for the selected row. */
export function InboxDetail({
  row,
  handlers,
  logging,
}: {
  row: InboxRow
  handlers: InboxHandlers
  logging: boolean
}) {
  const channel = row.reach[0]?.label

  return (
    <article
      aria-label={row.name}
      className="flex max-w-2xl flex-col gap-4 px-8 py-7"
    >
      <p
        className={cn(
          "font-mono text-desk-meta",
          row.late ? "text-desk-blocked" : "text-desk-fg-2"
        )}
      >
        {KIND_TAG[row.kind]}
        {channel ? ` · ${channel}` : ""}
      </p>
      <h2 className="text-desk-title">{row.name}</h2>
      <p className="font-mono text-desk-meta text-desk-fg-3">
        {[row.who, row.ageSpoken].filter(Boolean).join(" · ")}
      </p>
      <p className="text-desk-body">{row.text}</p>

      <dl className="flex flex-col border-t border-desk-line">
        {row.facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-4 border-b border-desk-line py-2"
          >
            <dt className="text-desk-ui text-desk-fg-2">{fact.label}</dt>
            <dd className="min-w-0 text-right font-mono text-desk-meta">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <InboxActions row={row} handlers={handlers} layout="pane" />

      {logging ? <LogTouch row={row} handlers={handlers} /> : null}

      <p className="text-desk-meta text-desk-fg-3">
        Nothing is sent from here: WhatsApp, Mail or the phone opens with
        nothing sent, and you log the touch.
      </p>
    </article>
  )
}
