"use client"

import { useRef, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import {
  Input,
  Label,
  PendingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { addTaskAction } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Writing a todo down, from the feed. The working-list strip used to carry an
// always-open add form above the leads list; when the strip went, the todo it
// wrote had to land somewhere that is always reachable.
//
// This is that somewhere: a `+` on the Needs you title bar. The stub offered
// the Overdue section's header instead, but that section only renders when
// something is overdue — which is exactly the day you would want to write a
// todo down and find nowhere to do it. The bar is sticky on every scroll
// position and on every size, so this is the least ceremonious spot there is.
// A todo about someone in particular is still added from their profile
// (components/lead-todos.tsx), where the lead is already known.
//
// No floating disc: that belongs to Leads, where adding a person is the one
// thing on the screen that makes something. A feed whose best day is empty
// should not carry a permanent button hovering over "nothing needs you".

/** The leads a todo can be pointed at, as the picker needs them. */
export type TodoLead = { id: string; name: string }

// Radix won't take an empty string as an item value, so "no lead" needs a
// sentinel of its own; it never leaves this file.
const NO_LEAD = "__none__"

export function AddTodo({ leads }: { leads: TodoLead[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  // The picker posts through a hidden input, so its value is held here rather
  // than left to the form's own reset.
  const [lead, setLead] = useState<string>(NO_LEAD)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Add a todo"
          title="Add a todo"
          className={cn(
            "flex size-app-touch shrink-0 items-center justify-center rounded-app-control",
            // Tinted: it is the one control on this screen that makes
            // something rather than resolving something.
            "text-app-tint transition-colors spring-press active:bg-app-press"
          )}
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </SheetTrigger>

      {/* Three fields, one of them optional — the medium detent holds all of
          it above the keyboard, and the handle drags it up when the picker
          needs the room. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>Add a todo</SheetTitle>
          <SheetDescription>
            It shows here once it is due, and on the lead&apos;s profile if you
            point it at one.
          </SheetDescription>
        </SheetHeader>

        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              hapticTick()
              try {
                const title = String(formData.get("title") ?? "").trim()
                await addTaskAction(formData)
                formRef.current?.reset()
                setLead(NO_LEAD)
                setOpen(false)
                toast(`Added "${title}"`)
              } catch {
                toast.error("Couldn't add that todo")
              }
            })
          }
          className="mt-4 grid gap-3"
        >
          <input
            type="hidden"
            name="clientId"
            value={lead === NO_LEAD ? "" : lead}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="feed-todo-title">What needs doing</Label>
            <Input
              id="feed-todo-title"
              name="title"
              required
              autoFocus
              placeholder="Chase the quote…"
              // A todo is a sentence, so the keyboard capitalises and corrects;
              // the return key says "done" rather than the generic newline.
              enterKeyHint="done"
              autoCapitalize="sentences"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="feed-todo-due">Due</Label>
            <Input id="feed-todo-due" name="dueDate" type="date" />
            <p className="text-app-footnote text-app-label-3">
              A todo without a date is filed but never chases you — the feed
              only shows what has come due.
            </p>
          </div>

          {leads.length > 0 ? (
            <div className="grid gap-1.5">
              <Label htmlFor="feed-todo-lead">Who it&apos;s about</Label>
              <Select value={lead} onValueChange={setLead}>
                <SelectTrigger id="feed-todo-lead" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LEAD}>No lead</SelectItem>
                  {leads.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <PendingButton
            pending={pending}
            pendingText="Adding…"
            className="w-full sm:w-fit"
          >
            Add todo
          </PendingButton>
        </form>
      </SheetContent>
    </Sheet>
  )
}
