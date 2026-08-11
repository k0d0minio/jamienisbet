"use client"

import { useRef, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button, Checkbox, Input, cn } from "@jamie-nisbet/ui"

import {
  addTaskAction,
  deleteTaskAction,
  setTaskCompletedAction,
} from "@/app/(app)/actions"

// Serializable projection of a biz.tasks row for this client component.
export type TaskItem = {
  id: string
  title: string
  dueDate: string | null // ISO
  overdue: boolean
  completed: boolean
}

export function TaskList({
  tasks,
  // When set, todos added here hang off that lead and also show on its profile.
  clientId,
}: {
  tasks: TaskItem[]
  clientId?: string
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="flex flex-col gap-3">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on the list — add the first todo below.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-start gap-3 rounded-md px-2 py-2 sm:items-center sm:py-1.5"
            >
              <Checkbox
                checked={task.completed}
                disabled={pending}
                aria-label={task.title}
                className="mt-0.5 sm:mt-0"
                onCheckedChange={(checked) =>
                  startTransition(() =>
                    setTaskCompletedAction(task.id, checked === true)
                  )
                }
              />
              {/* The due date drops under the title on a phone rather than
                  squeezing it into a column — a todo is mostly its wording. */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span
                  className={cn(
                    "text-sm sm:flex-1",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </span>
                {task.dueDate && !task.completed && (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      task.overdue
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {new Date(task.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
              {/* There is no hover on a phone, so the delete is always there
                  on small screens and only reveals on hover from `sm` up. */}
              <button
                type="button"
                aria-label={`Delete "${task.title}"`}
                disabled={pending}
                className="-mr-1 shrink-0 rounded-sm p-2 text-muted-foreground transition-opacity hover:text-destructive sm:p-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                onClick={() => startTransition(() => deleteTaskAction(task.id))}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await addTaskAction(formData)
            formRef.current?.reset()
          })
        }
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
        <Input
          name="title"
          placeholder="Add a todo…"
          required
          className="sm:min-w-40 sm:flex-1"
        />
        {/* Date and submit share a line on a phone rather than each taking a
            full-width row — the title is the only field that needs the width. */}
        <div className="flex min-w-0 gap-2">
          {/* A date input won't shrink past the browser's own dd/mm/yyyy
              chrome — roughly 175px — so on a narrow phone the submit drops to
              its icon rather than the pair pushing the page sideways. */}
          <Input
            name="dueDate"
            type="date"
            className="min-w-0 flex-1 sm:w-36 sm:flex-none"
            aria-label="Due date"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            aria-label="Add todo"
            className="shrink-0 px-3"
          >
            <Plus />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
