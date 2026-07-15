"use client"

import { useRef, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button, Checkbox, Input, cn } from "@jamie-nisbet/ui"

import {
  addTaskAction,
  deleteTaskAction,
  setTaskCompletedAction,
} from "@/app/(app)/today/actions"

// Serializable projection of a biz.tasks row for this client component.
export type TaskItem = {
  id: string
  title: string
  dueDate: string | null // ISO
  overdue: boolean
  completed: boolean
}

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
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
              className="group flex items-center gap-3 rounded-md px-2 py-1.5"
            >
              <Checkbox
                checked={task.completed}
                disabled={pending}
                aria-label={task.title}
                onCheckedChange={(checked) =>
                  startTransition(() =>
                    setTaskCompletedAction(task.id, checked === true)
                  )
                }
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  task.completed && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </span>
              {task.dueDate && !task.completed && (
                <span
                  className={cn(
                    "text-xs",
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
              <button
                type="button"
                aria-label={`Delete "${task.title}"`}
                disabled={pending}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
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
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          name="title"
          placeholder="Add a todo…"
          required
          className="min-w-40 flex-1"
        />
        <Input name="dueDate" type="date" className="w-36" aria-label="Due date" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          <Plus />
          Add
        </Button>
      </form>
    </div>
  )
}
