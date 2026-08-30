"use client"

import { useState, useTransition } from "react"
import { CalendarClock, Flag, Moon } from "lucide-react"

import {
  AppField,
  AppInput,
  Button,
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

import { clearNextAction, saveNextAction } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// What happens next, on the masthead — the one line that turns a record into a
// piece of work.
//
// It sits with the identity rather than in a section because it is the same
// order of fact as the name and the figure: the question this page exists to
// answer is "what do I do about this person", and the answer should be legible
// before a thumb has moved. Everything else on the profile is what they *are*;
// this is what is owed.
//
// It is also the only place the invariant is ever *said*. Nothing refuses to
// save without a next action — so a lead with none reads "No next step" in the
// quiet grey of an empty field, an invitation rather than a warning, and one
// tap sets one. Overdue is the single state that raises its voice, and only
// because a date that has passed is a fact rather than a nag.
//
// A parked lead has no next step by definition; what it has is a date it wakes
// on, so the same control says that instead and edits that instead.

export function LeadNextAction({
  id,
  action,
  /** Pre-formatted on the server ("2 Sep"), so nothing here reads the clock. */
  dueLabel,
  /** The same date as `YYYY-MM-DD`, for the date field. */
  dueValue,
  overdue,
  /** They are parked on nurture: the line is a wake date, not a next step. */
  parked,
  /** A next step is expected on this rung — so an empty one is worth saying.
   *  False for a client, a past client and a lost lead, where "nothing planned"
   *  is the normal state of affairs and the prompt would be noise. */
  expected,
}: {
  id: string
  action: string | null
  dueLabel: string | null
  dueValue: string | null
  overdue: boolean
  parked: boolean
  expected: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [clearing, startClearing] = useTransition()

  // A parked row's line is its wake date; everyone else's is the next step.
  const line = parked
    ? dueLabel
      ? `Wakes ${dueLabel}`
      : "Parked, with no wake date"
    : action

  // Nothing to say and nothing worth prompting for — an active client owes no
  // next step, and an empty chip on their masthead would only be clutter.
  if (!line && !expected) return null

  const empty = !line

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          // Its own line in the masthead's badge row: the sentence can run
          // long, and a next step wrapped around a Stripe glyph reads as
          // neither. `basis-full` rather than `w-full` so the negative margin
          // that hangs the press wash into the gutter doesn't overflow the
          // line — and it is on the control itself rather than a wrapper, so a
          // lead with nothing to say here leaves no empty row behind.
          className={cn(
            "-ml-2.5 flex min-h-app-touch basis-full items-center gap-1.5 rounded-app-control px-2.5",
            "text-left text-app-footnote transition-colors spring-press active:bg-app-press",
            overdue
              ? "font-medium text-destructive"
              : empty
                ? "text-app-label-3"
                : "font-medium text-app-tint"
          )}
        >
          {parked ? (
            <Moon className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <Flag className="size-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 flex-1 truncate">
            {line ?? "No next step"}
          </span>
          {/* A date is a figure, so it sets in mono — and only when it adds
              something the line hasn't already said. */}
          {!parked && dueLabel ? (
            <span className="shrink-0 font-mono text-app-caption tabular-nums">
              {dueLabel}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent detents={["medium"]}>
        <SheetHeader>
          <SheetTitle>{parked ? "When do they wake?" : "Next step"}</SheetTitle>
          <SheetDescription>
            {parked
              ? "A parked lead comes back on a date rather than on a nudge."
              : "What you do about them, and when. Leaving it empty is allowed — it just means nothing is planned."}
          </SheetDescription>
        </SheetHeader>

        <form
          action={(formData) =>
            startTransition(async () => {
              hapticTick()
              try {
                await saveNextAction(id, formData)
                setOpen(false)
              } catch {
                // The sheet stays open on a failure, so what you typed is
                // still there to try again with.
                toast.error(
                  parked ? "Couldn't set the wake date" : "Couldn't save that"
                )
              }
            })
          }
          className="grid gap-3"
        >
          {parked ? (
            <input type="hidden" name="park" value="1" />
          ) : (
            <AppField label="Next step" hint="Short and in your own words.">
              <AppInput
                name="action"
                defaultValue={action ?? ""}
                maxLength={200}
                placeholder="Call back after the lunch service…"
                autoCapitalize="sentences"
                enterKeyHint="next"
              />
            </AppField>
          )}

          <AppField
            label={parked ? "Wake date" : "Due"}
            hint={
              parked
                ? "Ninety days out is the usual answer."
                : "Empty means it never reaches the day's queue."
            }
          >
            <AppInput
              name="dueDate"
              type="date"
              defaultValue={dueValue ?? ""}
              className="w-full sm:max-w-52"
            />
          </AppField>

          <div className="flex items-center gap-2">
            <PendingButton
              pending={pending}
              pendingText="Saving…"
              className="w-full sm:w-fit"
            >
              Save
            </PendingButton>
            {/* Dismissing is a real answer, so it is a real button — quiet,
                and only where there is something to dismiss. */}
            {!parked && action ? (
              <Button
                type="button"
                variant="ghost"
                className="px-3"
                disabled={clearing}
                onClick={() =>
                  startClearing(async () => {
                    hapticTick()
                    try {
                      await clearNextAction(id)
                      setOpen(false)
                    } catch {
                      toast.error("Couldn't clear the next step")
                    }
                  })
                }
              >
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        {!parked && !action ? (
          <p className="mt-4 flex items-start gap-2 text-app-footnote text-app-label-3">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Logging a touch suggests the next one for you — this is for when you
            already know.
          </p>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
