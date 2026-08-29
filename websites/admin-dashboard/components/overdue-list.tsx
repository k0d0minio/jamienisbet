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
 *  once it has actually passed. */
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
  const [pending, startTransition] = useTransition()
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
          description={todo.clientName}
          value={<Due iso={todo.dueDate} late={todo.late} />}
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
          // What it repeats as, and whatever the row was filed with — the
          // source and as-of date the standing rule asks for.
          description={
            [
              item.recurrence !== "none" ? item.recurrence : null,
              item.notes,
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          value={<Due iso={item.dueDate} late={item.late} />}
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
              disabled={pending}
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
              Done
            </Button>
          }
        />
      ))}
    </GroupedSection>
  )
}
