"use client"

import { useOptimistic, useRef, useState, useTransition } from "react"
import { Circle, CircleCheck, Trash2 } from "lucide-react"

import {
  AppInput,
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  addTaskAction,
  deleteTaskAction,
  setTaskCompletedAction,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Todos hanging off this lead, as grouped rows: tap the row to tick it,
// delete on the accessory, and add on the line that is always sitting at the
// foot of the group. Every todo here already belongs to the person you are
// looking at, so there is no lead picker and no name on the row — the leads
// screen's mixed list is a different component (task-list.tsx), and it goes
// when the working-list strip does.
//
// Adding used to be a sheet, which is a lot of screen for one sentence. The
// input is simply there instead: type, return, added — and the row appears
// before the round trip does. The due date is the only other thing a todo can
// carry, and it unfolds under the line once you are actually writing one,
// rather than sitting there empty the rest of the time.

// Serializable projection of a biz.tasks row for this client component.
export type LeadTask = {
  id: string
  title: string
  dueDate: string | null // ISO
  overdue: boolean
  completed: boolean
  /** A row the list has added to itself and the server hasn't confirmed. It
   *  reads as a todo but can't be ticked or deleted — its id isn't real yet. */
  pending?: boolean
}

// Ticking a todo is the single most repeated action on the phone, and every
// one of them used to mean a round-trip before the row even changed. These are
// the edits the list applies to itself the instant the thumb lifts; the
// `tasks` prop underneath is the server's answer, so a refused write simply
// reappears as it was and the toast says so.
type TaskPatch =
  | { type: "completed"; id: string; completed: boolean }
  | { type: "deleted"; id: string }
  | { type: "added"; task: LeadTask }

function applyPatch(tasks: LeadTask[], patch: TaskPatch): LeadTask[] {
  if (patch.type === "added") {
    return [...tasks, patch.task]
  }
  if (patch.type === "deleted") {
    return tasks.filter((task) => task.id !== patch.id)
  }
  return tasks.map((task) =>
    task.id === patch.id ? { ...task, completed: patch.completed } : task
  )
}

/** The due date as it reads on a row: a short day and month in mono, tinted
 *  only when it has already passed. */
function DueDate({ task }: { task: LeadTask }) {
  if (!task.dueDate || task.completed) return null
  return (
    <span
      className={cn(
        "font-mono",
        task.overdue ? "font-medium text-destructive" : "text-app-label-3"
      )}
    >
      {new Date(task.dueDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}
    </span>
  )
}

export function LeadTodos({
  clientId,
  clientName,
  tasks,
}: {
  clientId: string
  clientName: string
  tasks: LeadTask[]
}) {
  // Two transitions on purpose: the row edits are optimistic and show their
  // result in the row itself, while the add line has a button that spins. One
  // shared flag would set that button spinning every time a row was ticked.
  const [, startTransition] = useTransition()
  const [adding, startAdding] = useTransition()
  const [items, patchTasks] = useOptimistic(tasks, applyPatch)

  const [title, setTitle] = useState("")
  const [due, setDue] = useState("")
  const titleBox = useRef<HTMLInputElement>(null)

  // The due date and the button unfold once there are words on the line —
  // on focus alone, tapping the field by accident would push the group open
  // and put a dead, disabled button under your thumb.

  function add() {
    const trimmed = title.trim()
    if (trimmed === "") return

    const dueDate = due
    setTitle("")
    setDue("")
    // Straight back to the line — a list is usually written more than one at
    // a time.
    titleBox.current?.focus()

    startAdding(async () => {
      const formData = new FormData()
      // On a lead's own page the lead is fixed — no picker, no doubt.
      formData.set("clientId", clientId)
      formData.set("title", trimmed)
      if (dueDate !== "") formData.set("dueDate", dueDate)

      const parsed = dueDate !== "" ? new Date(dueDate) : null
      patchTasks({
        type: "added",
        task: {
          id: `pending-${trimmed}-${Date.now()}`,
          title: trimmed,
          dueDate: parsed ? parsed.toISOString() : null,
          overdue: parsed !== null && parsed.getTime() < Date.now(),
          completed: false,
          pending: true,
        },
      })
      hapticTick()

      try {
        await addTaskAction(formData)
      } catch {
        // The row vanishes with the optimistic layer, so the failure has to
        // say so somewhere — and hand the words back.
        toast.error("Couldn't add that todo")
        setTitle(trimmed)
        setDue(dueDate)
      }
    })
  }

  return (
    <GroupedSection
      header="Todos"
      footer={`Open todos for ${clientName}. They also show on the leads screen.`}
    >
      {items.length === 0 ? (
        <GroupedBlock>
          Nothing on the list — a &ldquo;chase them Tuesday&rdquo; lives here,
          with the person it is about.
        </GroupedBlock>
      ) : (
        items.map((task) =>
          task.pending ? (
            // Already on the list, not yet a row that can be operated on.
            <GroupedRow
              key={task.id}
              icon={<Circle />}
              label={task.title}
              value={<DueDate task={task} />}
              chevron={false}
              aria-busy
              className="text-app-label-3"
            />
          ) : (
            <GroupedRow
              key={task.id}
              role="checkbox"
              aria-checked={task.completed}
              icon={task.completed ? <CircleCheck /> : <Circle />}
              label={
                <span className={cn(task.completed && "line-through")}>
                  {task.title}
                </span>
              }
              value={<DueDate task={task} />}
              className={cn(task.completed && "text-app-label-3")}
              onClick={() =>
                startTransition(async () => {
                  const completed = !task.completed
                  patchTasks({ type: "completed", id: task.id, completed })
                  hapticTick()
                  try {
                    await setTaskCompletedAction(task.id, completed)
                  } catch {
                    toast.error(`Couldn't tick off "${task.title}"`)
                  }
                })
              }
              accessory={
                // There is no hover on a phone, so the delete is simply always
                // there — one 44px target at the end of the row.
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete "${task.title}"`}
                  className="text-app-label-3 hover:text-destructive active:text-destructive"
                  onClick={() =>
                    startTransition(async () => {
                      patchTasks({ type: "deleted", id: task.id })
                      hapticTick()
                      try {
                        await deleteTaskAction(task.id)
                        // The row is already gone from the list, so the
                        // deletion has to say so somewhere.
                        toast(`Deleted "${task.title}"`)
                      } catch {
                        toast.error(`Couldn't delete "${task.title}"`)
                      }
                    })
                  }
                >
                  <Trash2 />
                </Button>
              }
            />
          )
        )
      )}

      <GroupedBlock>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            add()
          }}
        >
          <AppInput
            ref={titleBox}
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a todo…"
            aria-label={`Add a todo for ${clientName}`}
            // A todo is a sentence, so the keyboard capitalises and corrects;
            // the return key says "done" rather than the generic newline
            // arrow, and pressing it is what adds the todo.
            enterKeyHint="done"
            autoCapitalize="sentences"
            autoComplete="off"
          />

          {title.trim() !== "" ? (
            <div className="flex items-center gap-2">
              <AppInput
                name="dueDate"
                type="date"
                value={due}
                onChange={(event) => setDue(event.target.value)}
                aria-label="Due date (optional)"
                // Full width beside the button on a phone; capped once there
                // is room, because a due date is never 1500px of information.
                className="min-w-0 flex-1 sm:max-w-52"
              />
              <PendingButton pending={adding} pendingText="Adding…">
                Add
              </PendingButton>
            </div>
          ) : null}
        </form>
      </GroupedBlock>
    </GroupedSection>
  )
}
