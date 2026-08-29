"use client"

import { useOptimistic, useTransition } from "react"
import { Check, CalendarClock, Circle, Trash2 } from "lucide-react"

import {
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  completeComplianceDateAction,
  deleteTaskAction,
  setTaskCompletedAction,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// The feed's Overdue section: todos that have come due and the compliance
// dates that are past or nearly there, in one group ordered by how late they
// are. Both kinds act **in place** — this is the half of the feed that does
// not deep-link, because ticking a todo has no better home to send you to.
//
// It replaces the working-list strip's todo and compliance lists, which were
// the last two shadcn-idiom lists in the app: a checkbox, a `Select` and an
// inline form, all sized for a mouse. Same actions, same server actions, on
// the app tier's grouped rows.
//
// Resolving a row takes it out of the list the instant the thumb lifts. That
// is the right optimism for a feed: the section is "what needs you", and a
// ticked todo does not. The server's answer arrives underneath, so a refused
// write simply puts the row back and the toast says what didn't happen.

/** A todo, as the feed's row needs it. */
export type OverdueTodo = {
  id: string
  title: string
  /** Who it is about — a title like "send the quote" says nothing alone. */
  clientName: string | null
  dueDate: string // ISO — the feed only carries todos that have one
  /** Past its date, rather than due today. */
  late: boolean
}

/** A compliance obligation, as the feed's row needs it. */
export type OverdueCompliance = {
  id: string
  title: string
  notes: string | null
  dueDate: string // ISO
  recurrence: string
  /** Past its date, rather than merely coming up. */
  late: boolean
}

type Resolved = { todos: string[]; compliance: string[] }

function resolve(state: Resolved, patch: Partial<Resolved>): Resolved {
  return {
    todos: [...state.todos, ...(patch.todos ?? [])],
    compliance: [...state.compliance, ...(patch.compliance ?? [])],
  }
}

/** A due date as it reads on a row: short day and month in mono, tinted only
 *  once it has actually passed.
 *
 *  It leads the row's *second* line rather than sitting in the trailing value
 *  slot, which is where it started. A phone row that carries an icon, a date
 *  and a trailing control has about 200px left for its label, and a todo is
 *  mostly its wording — "Send Keel the revised scope" came out as "Send Keel
 *  the revi…". On the second line the date still leads and still carries the
 *  tint, so what is late is scanned just as fast, and the title gets the whole
 *  width on every size. */
function Due({ iso, late }: { iso: string; late: boolean }) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        late ? "font-medium text-destructive" : "text-app-label-3"
      )}
    >
      {new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}
    </span>
  )
}

/** The second line: the date, then whatever else the row files under. */
function Detail({
  iso,
  late,
  rest,
}: {
  iso: string
  late: boolean
  rest: (string | null)[]
}) {
  const tail = rest.filter(Boolean).join(" · ")
  return (
    <>
      <Due iso={iso} late={late} />
      {tail ? ` · ${tail}` : null}
    </>
  )
}

export function OverdueList({
  todos,
  compliance,
  filed,
}: {
  todos: OverdueTodo[]
  compliance: OverdueCompliance[]
  /** Open todos that aren't due yet, or carry no date at all. Counted in the
   *  footer so the section reads as a filter rather than as the whole list —
   *  they are on their leads' profiles until their date comes round. */
  filed: number
}) {
  // One transition for both kinds of row. Nothing reads its pending flag: a
  // resolved row leaves the list on the tap, which is a better guard against a
  // double-fire than a disabled control — and a shared flag would have grey
  // out every "Done" button the moment a todo was ticked.
  const [, startTransition] = useTransition()
  const [resolved, markResolved] = useOptimistic<Resolved, Partial<Resolved>>(
    { todos: [], compliance: [] },
    resolve
  )

  const openTodos = todos.filter((t) => !resolved.todos.includes(t.id))
  const openCompliance = compliance.filter(
    (c) => !resolved.compliance.includes(c.id)
  )
  const empty = openTodos.length === 0 && openCompliance.length === 0

  return (
    <GroupedSection
      header="Overdue"
      // The compliance caveat is the standing one, and it belongs under the
      // rows rather than beside each of them: every date here is a reminder to
      // ask, never an answer.
      footer={
        [
          compliance.length > 0
            ? "Compliance dates are decision-support only — every one still needs your contabilista's confirmation."
            : null,
          filed > 0
            ? `${filed} more todo${filed === 1 ? " is" : "s are"} filed but not due yet.`
            : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      {empty ? (
        <GroupedBlock>Cleared — nothing left overdue.</GroupedBlock>
      ) : null}

      {openTodos.map((todo) => (
        <GroupedRow
          key={todo.id}
          role="checkbox"
          aria-checked={false}
          icon={<Circle />}
          label={todo.title}
          description={
            <Detail
              iso={todo.dueDate}
              late={todo.late}
              rest={[todo.clientName]}
            />
          }
          onClick={() =>
            startTransition(async () => {
              markResolved({ todos: [todo.id] })
              hapticTick()
              try {
                await setTaskCompletedAction(todo.id, true)
              } catch {
                toast.error(`Couldn't tick off "${todo.title}"`)
              }
            })
          }
          accessory={
            // There is no hover on a phone, so the delete is simply always
            // there — one 44px target at the end of the row. A todo that has
            // gone stale is dismissed here rather than being ticked as done it
            // never was.
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete "${todo.title}"`}
              className="text-app-label-3 hover:text-destructive active:text-destructive"
              onClick={() =>
                startTransition(async () => {
                  markResolved({ todos: [todo.id] })
                  hapticTick()
                  try {
                    await deleteTaskAction(todo.id)
                    // The row is gone by the time this lands, so the toast is
                    // the only place the outcome can be read.
                    toast(`Deleted "${todo.title}"`)
                  } catch {
                    toast.error(`Couldn't delete "${todo.title}"`)
                  }
                })
              }
            >
              <Trash2 />
            </Button>
          }
        />
      ))}

      {openCompliance.map((item) => (
        <GroupedRow
          key={item.id}
          icon={<CalendarClock />}
          label={item.title}
          // When it is due, what it repeats as, and whatever the row was filed
          // with — the source and as-of date the standing rule asks for.
          description={
            <Detail
              iso={item.dueDate}
              late={item.late}
              rest={[
                item.recurrence !== "none" ? item.recurrence : null,
                item.notes,
              ]}
            />
          }
          // The row itself does nothing: completing a recurring obligation
          // re-arms the next occurrence, which is too much to hang off a
          // mis-tap while scrolling. The button beside it is the deliberate
          // version of the same act-in-place.
          chevron={false}
          accessory={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Mark "${item.title}" done`}
              onClick={() =>
                startTransition(async () => {
                  markResolved({ compliance: [item.id] })
                  hapticTick()
                  try {
                    await completeComplianceDateAction(item.id)
                  } catch {
                    toast.error(`Couldn't mark "${item.title}" done`)
                  }
                })
              }
            >
              <Check aria-hidden />
              {/* The word is what makes a consequential act legible, and it
                  costs about 55px — which on a phone is the difference between
                  "IRS 1st payment on account" and "IRS 1st payment on a…". So
                  it waits for the room: icon-only under `sm`, where the
                  aria-label carries it, and spelled out above. */}
              <span className="hidden sm:inline">Done</span>
            </Button>
          }
        />
      ))}
    </GroupedSection>
  )
}
