"use client"

import { useOptimistic, useState, useTransition } from "react"
import { Circle, CircleCheck, Plus, Trash2 } from "lucide-react"

import {
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  Input,
  Label,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
// delete on the accessory, add through a sheet. Every todo here already
// belongs to the person you are looking at, so there is no lead picker and no
// name on the row — the leads screen's mixed list is a different component
// (task-list.tsx), and it goes when the working-list strip does.

// Serializable projection of a biz.tasks row for this client component.
export type LeadTask = {
  id: string
  title: string
  dueDate: string | null // ISO
  overdue: boolean
  completed: boolean
}

// Ticking a todo is the single most repeated action on the phone, and every
// one of them used to mean a round-trip before the row even changed. These are
// the edits the list applies to itself the instant the thumb lifts; the
// `tasks` prop underneath is the server's answer, so a refused write simply
// reappears as it was and the toast says so.
type TaskPatch =
  | { type: "completed"; id: string; completed: boolean }
  | { type: "deleted"; id: string }

function applyPatch(tasks: LeadTask[], patch: TaskPatch): LeadTask[] {
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
  // result in the row itself, while the add form has a button that spins. One
  // shared flag would set that button spinning every time a row was ticked.
  const [, startTransition] = useTransition()
  const [adding, startAdding] = useTransition()
  const [items, patchTasks] = useOptimistic(tasks, applyPatch)
  const [open, setOpen] = useState(false)

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
        items.map((task) => (
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
                      // The row is already gone from the list, so the deletion
                      // has to say so somewhere.
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
        ))
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <GroupedRow icon={<Plus />} label="Add a todo" />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add a todo</SheetTitle>
            <SheetDescription>
              It hangs off {clientName} and shows on the leads screen too.
            </SheetDescription>
          </SheetHeader>
          <form
            action={(formData) =>
              startAdding(async () => {
                try {
                  await addTaskAction(formData)
                  setOpen(false)
                } catch {
                  toast.error("Couldn't add that todo")
                }
              })
            }
            className="grid gap-3"
          >
            {/* On a lead's own page the lead is fixed — no picker, no doubt. */}
            <input type="hidden" name="clientId" value={clientId} />
            <div className="grid gap-1.5">
              <Label htmlFor="todo-title">What needs doing</Label>
              <Input
                id="todo-title"
                name="title"
                required
                autoFocus
                placeholder="Chase them about the quote…"
                // A todo is a sentence, so the keyboard capitalises and
                // corrects; the return key says "done" rather than the
                // generic newline arrow.
                enterKeyHint="done"
                autoCapitalize="sentences"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="todo-due">Due (optional)</Label>
              <Input id="todo-due" name="dueDate" type="date" />
            </div>
            <PendingButton
              pending={adding}
              pendingText="Adding…"
              className="w-full sm:w-fit"
            >
              Add todo
            </PendingButton>
          </form>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
