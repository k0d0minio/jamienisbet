"use client"

import { useOptimistic, useRef, useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  Checkbox,
  Input,
  PendingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  addTaskAction,
  deleteTaskAction,
  setTaskClientAction,
  setTaskCompletedAction,
} from "@/app/(app)/actions"

// Serializable projection of a biz.tasks row for this client component.
export type TaskItem = {
  id: string
  title: string
  // Who the todo is about. A title like "send the quote" says nothing on its
  // own — the lead is what makes it actionable, so it travels with the row.
  clientId: string | null
  clientName: string | null
  dueDate: string | null // ISO
  overdue: boolean
  completed: boolean
}

/** The leads a todo can be pointed at, as the picker needs them. */
export type TaskLead = { id: string; name: string }

// Radix won't take an empty string as an item value, so "no lead" needs a
// sentinel of its own; it never leaves this file.
const NO_LEAD = "__none__"

/** The lead a todo hangs off, as a picker — showing whose it is and changing it
 *  are the same control, so a todo written before you knew can be attached
 *  later without retyping it. */
function TaskLeadSelect({
  task,
  leads,
  onChange,
}: {
  task: TaskItem
  leads: TaskLead[]
  onChange: (clientId: string | null) => void
}) {
  // A todo can point at a lead that has since been archived, and the archived
  // one isn't in the picker's list. Carry it as an option of its own so the
  // trigger reads as that name rather than going blank.
  const options =
    task.clientId && !leads.some((lead) => lead.id === task.clientId)
      ? [...leads, { id: task.clientId, name: task.clientName ?? "Unknown lead" }]
      : leads

  return (
    <Select
      value={task.clientId ?? NO_LEAD}
      onValueChange={(next) => onChange(next === NO_LEAD ? null : next)}
    >
      <SelectTrigger
        size="sm"
        aria-label={`Lead for "${task.title}"`}
        className={cn(
          "h-7 w-auto max-w-40 gap-1 border-transparent px-2 text-xs shadow-none hover:bg-muted",
          !task.clientId && "text-muted-foreground"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_LEAD}>No lead</SelectItem>
        {options.map((lead) => (
          <SelectItem key={lead.id} value={lead.id}>
            {lead.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Ticking a todo is the single most repeated action on the phone, and every
// one of them used to mean a round-trip before the box even filled in. These
// are the edits the list applies to itself the instant the thumb lifts; the
// `tasks` prop underneath is the server's answer, so a refused write simply
// reappears as it was and the toast says so.
type TaskPatch =
  | { type: "completed"; id: string; completed: boolean }
  | { type: "deleted"; id: string }
  | { type: "client"; id: string; clientId: string | null; clientName: string | null }

function applyPatch(tasks: TaskItem[], patch: TaskPatch): TaskItem[] {
  if (patch.type === "deleted") {
    return tasks.filter((task) => task.id !== patch.id)
  }
  return tasks.map((task) => {
    if (task.id !== patch.id) return task
    if (patch.type === "completed") return { ...task, completed: patch.completed }
    return { ...task, clientId: patch.clientId, clientName: patch.clientName }
  })
}

export function TaskList({
  tasks,
  // When set, todos added here hang off that lead and also show on its profile.
  clientId,
  // The leads a todo can be pointed at. Passed on the leads screen, where the
  // list mixes everyone's todos; omitted on a lead's own profile, where every
  // todo already belongs to the person you are looking at.
  leads,
}: {
  tasks: TaskItem[]
  clientId?: string
  leads?: TaskLead[]
}) {
  // Two transitions on purpose: the row edits are optimistic and show their
  // result in the row itself, while the add form has a button that spins. One
  // shared flag would set that button spinning every time a box was ticked.
  const [, startTransition] = useTransition()
  const [adding, startAdding] = useTransition()
  const [items, patchTasks] = useOptimistic(tasks, applyPatch)
  const formRef = useRef<HTMLFormElement>(null)
  // The new todo's lead. Controlled rather than left to the form's own reset,
  // because the picker posts through a hidden input.
  const [newLead, setNewLead] = useState<string>(NO_LEAD)

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on the list — add the first todo below.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((task) => (
            <li
              key={task.id}
              className="group flex items-start gap-3 rounded-md px-2 py-2 sm:items-center sm:py-1.5"
            >
              <Checkbox
                checked={task.completed}
                aria-label={task.title}
                className="mt-0.5 sm:mt-0"
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    const completed = checked === true
                    patchTasks({ type: "completed", id: task.id, completed })
                    try {
                      await setTaskCompletedAction(task.id, completed)
                    } catch {
                      toast.error(`Couldn't tick off "${task.title}"`)
                    }
                  })
                }
              />
              {/* Whose it is and when it's due drop under the title on a phone
                  rather than squeezing it into columns — a todo is mostly its
                  wording. */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span
                  className={cn(
                    "text-sm sm:flex-1",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </span>
                <div className="-ml-2 flex shrink-0 items-center gap-2 sm:ml-0">
                  {leads ? (
                    <TaskLeadSelect
                      task={task}
                      leads={leads}
                      onChange={(next) =>
                        startTransition(async () => {
                          patchTasks({
                            type: "client",
                            id: task.id,
                            clientId: next,
                            // `leads?.` rather than leaning on the narrowing
                            // from the `leads ?` above: whether TypeScript
                            // carries that into a callback depends on rules
                            // that have moved between versions.
                            clientName:
                              leads?.find((lead) => lead.id === next)?.name ??
                              null,
                          })
                          try {
                            await setTaskClientAction(task.id, next)
                          } catch {
                            toast.error("Couldn't move that todo to another lead")
                          }
                        })
                      }
                    />
                  ) : null}
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
              </div>
              {/* There is no hover on a phone, so the delete is always there
                  on small screens and only reveals on hover from `sm` up. */}
              <button
                type="button"
                aria-label={`Delete "${task.title}"`}
                className="-mr-1 shrink-0 rounded-sm p-2 text-muted-foreground transition-colors hover:text-destructive active:text-destructive sm:p-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                onClick={() =>
                  startTransition(async () => {
                    patchTasks({ type: "deleted", id: task.id })
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
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={(formData) =>
          startAdding(async () => {
            try {
              await addTaskAction(formData)
              formRef.current?.reset()
              setNewLead(NO_LEAD)
            } catch {
              toast.error("Couldn't add that todo")
            }
          })
        }
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {/* On a lead's own page the lead is fixed; on the leads screen it comes
            off the picker, which posts through here rather than as a bare
            Radix select. */}
        <input
          type="hidden"
          name="clientId"
          value={clientId ?? (newLead === NO_LEAD ? "" : newLead)}
        />
        <Input
          name="title"
          placeholder="Add a todo…"
          required
          // A todo is a sentence, so the keyboard capitalises and corrects; the
          // return key says "add" rather than the generic newline arrow.
          enterKeyHint="done"
          autoCapitalize="sentences"
          className="sm:min-w-40 sm:flex-1"
        />
        {/* Who it's for gets a row of its own on a phone: crammed in beside the
            date it would be a 100px box holding someone's name. */}
        {leads ? (
          <Select value={newLead} onValueChange={setNewLead}>
            <SelectTrigger
              aria-label="Lead this todo is for"
              className="w-full sm:w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LEAD}>No lead</SelectItem>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
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
          <PendingButton
            variant="outline"
            pending={adding}
            aria-label="Add todo"
            className="shrink-0 px-3"
            // pendingText replaces the children, so the plus gives way to the
            // spinner rather than sitting beside it — the button keeps its
            // width on a phone, where it is icon-only.
            pendingText={<span className="hidden sm:inline">Adding…</span>}
          >
            <Plus />
            <span className="hidden sm:inline">Add</span>
          </PendingButton>
        </div>
      </form>
    </div>
  )
}
