"use client"

import { useOptimistic, useRef, useState, useTransition } from "react"
import { CalendarClock, Trash2 } from "lucide-react"

import {
  AppField,
  AppInput,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppTextarea,
  Button,
  GroupedBlock,
  GroupedList,
  GroupedRow,
  GroupedSection,
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
  addComplianceDateAction,
  deleteComplianceDateAction,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// The compliance calendar, and the one place a date gets into it.
//
// The form used to live on the working-list strip and went with it, leaving
// `biz.compliance_dates` readable and completable but write-only from the
// outside. This is where it came back, and the spot is the whole decision:
//
//   - Not a second `+` on the Needs you title bar. That one belongs to todos,
//     which are written down constantly; a compliance date is entered perhaps
//     a dozen times ever, in one sitting, the day the contabilista returns the
//     pack. Two identical glyphs on one bar to serve two very unequal
//     frequencies is a worse bar.
//   - Not inside the Overdue section. That section only renders when something
//     is actually overdue — and the day the pack comes back, plausibly nothing
//     is. Putting the only way in behind a section that may not be there is
//     how the hole reopens.
//   - Not the app menu, which is `md:hidden`: a year of obligations is typed
//     sitting down, and on a laptop that menu does not exist.
//
// So: its own quiet section at the foot of the feed, beside "Worth a look" —
// the part of the screen for things that inform rather than nag. It is a
// drawer, not a task, and it is always there, which is the only property that
// actually matters.
//
// The sheet behind it is the calendar itself: the form first, then every open
// obligation — all of them, not the feed's fourteen-day slice, because a year
// of dates entered in one sitting would otherwise vanish the moment it saved,
// with no way to check what had already gone in.

/** An open obligation, as the calendar needs it. */
export type ComplianceEntry = {
  id: string
  title: string
  notes: string | null
  dueDate: string // ISO
  recurrence: string
  /** Past its date. */
  late: boolean
}

// Mirrors `complianceRecurrences` in @jamie-nisbet/services — kept local so
// this client component doesn't pull the services barrel into the browser
// bundle. Said in words rather than in the stored value: "quarterly" is a
// column, "every quarter" is what you are choosing.
const RECURRENCES = [
  { value: "none", label: "One-off" },
  { value: "monthly", label: "Every month" },
  { value: "quarterly", label: "Every quarter" },
  { value: "yearly", label: "Every year" },
] as const

function recurrenceLabel(value: string): string {
  return RECURRENCES.find((r) => r.value === value)?.label ?? value
}

/** The second line of a calendar row: when it is due, what it repeats as, and
 *  the source the standing rule asks every row to carry.
 *
 *  The year is spelled out here where the feed's rows leave it off. The feed
 *  only ever shows the next fortnight, so "14 Sep" can only mean one thing;
 *  this list runs a year or more ahead, where it can mean two. */
function Detail({ item }: { item: ComplianceEntry }) {
  return (
    <>
      <span
        className={cn(
          "font-mono tabular-nums",
          item.late ? "font-medium text-destructive" : "text-app-label-3"
        )}
      >
        {new Date(item.dueDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
      {item.recurrence !== "none"
        ? ` · ${recurrenceLabel(item.recurrence).toLowerCase()}`
        : null}
      {item.notes ? ` · ${item.notes}` : null}
    </>
  )
}

export function ComplianceCalendar({ dates }: { dates: ComplianceEntry[] }) {
  // Two transitions: the add button spins on its own submit, and a deleted row
  // leaves the list on the tap. One shared flag would set the button spinning
  // every time a row was binned.
  const [adding, startAdding] = useTransition()
  const [, startDeleting] = useTransition()
  const [deleted, markDeleted] = useOptimistic<string[], string>(
    [],
    (state, id) => [...state, id]
  )

  const formRef = useRef<HTMLFormElement>(null)
  const titleBox = useRef<HTMLInputElement>(null)
  // Radix keeps the select's value in React state, so `form.reset()` — which
  // only ever reaches the native controls — would leave the trigger reading
  // "Every quarter" while the field it posts had gone back to "none". Held
  // here instead, and put back by hand with the rest of the form.
  const [recurrence, setRecurrence] = useState<string>("none")

  const items = dates.filter((item) => !deleted.includes(item.id))

  return (
    <GroupedSection
      header="Compliance"
      footer={
        dates.length === 0
          ? "Nothing on the calendar yet. This is where your contabilista's pack goes in, one obligation at a time."
          : "The whole calendar, not only what is due — the ones coming round show under Overdue."
      }
    >
      {/* Uncontrolled on purpose: nothing here closes the sheet. Adding an
          obligation puts the cursor back in the first field instead, because
          a pack is entered a dozen rows at a time and the list underneath is
          what each one is checked against. */}
      <Sheet>
        <SheetTrigger asChild>
          <GroupedRow
            icon={<CalendarClock />}
            label="Portuguese obligations"
            description="IRS, IVA, Segurança Social — the dates your contabilista confirms"
            // Mono, like every figure on this tier, and deliberately not a
            // badge: nothing in this section is late or owed.
            value={
              <span className="font-mono tabular-nums">{dates.length}</span>
            }
          />
        </SheetTrigger>

        {/* One detent, and the tall one. This is not a quick capture like the
          todo sheet — it is four fields and the calendar under them, and it
          always wants the room. Drag it down to dismiss as usual. */}
        <SheetContent detents={["large"]}>
          <SheetHeader>
            <SheetTitle>Compliance calendar</SheetTitle>
            <SheetDescription>
              Decision-support only — every date here still needs your
              contabilista&apos;s confirmation.
            </SheetDescription>
          </SheetHeader>

          <form
            ref={formRef}
            action={(formData) =>
              startAdding(async () => {
                hapticTick()
                const title = String(formData.get("title") ?? "").trim()
                try {
                  await addComplianceDateAction(formData)
                  formRef.current?.reset()
                  setRecurrence("none")
                  // Straight back to the first field rather than closing: a
                  // pack is a dozen obligations in one sitting, and the list
                  // below is what you check each one against.
                  titleBox.current?.focus()
                  toast(`Added "${title}"`)
                } catch {
                  // The words stay in the form — nothing was reset — so the
                  // toast only has to say that nothing landed.
                  toast.error("Couldn't add that obligation")
                }
              })
            }
            className="mt-4 grid gap-3"
          >
            <AppField label="Obligation">
              <AppInput
                ref={titleBox}
                name="title"
                required
                autoFocus
                placeholder="IRS 1st payment on account"
                // A name, not a sentence: the keyboard capitalises and the
                // return key moves on to the date rather than submitting a
                // half-filled form.
                enterKeyHint="next"
                autoCapitalize="sentences"
                autoComplete="off"
              />
            </AppField>

            {/* Stacked on a phone: a date field carries the browser's own
                picker chrome, and beside a select there is no width left for
                either. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <AppField label="Due">
                <AppInput name="dueDate" type="date" required />
              </AppField>

              <AppField
                label="Repeats"
                hint="Ticking a recurring one off arms the next occurrence."
              >
                <AppSelect
                  name="recurrence"
                  value={recurrence}
                  onValueChange={setRecurrence}
                >
                  <AppSelectTrigger className="w-full">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {RECURRENCES.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </AppField>
            </div>

            {/* Required, which the server action does not insist on: the
                legal/tax standing rule says a row must carry where the date came
                from and when it was true, and the only moment anyone knows that
                is while typing it. */}
            <AppField
              label="Source"
              hint="Where this date came from and when it was true — that is what makes it decision-support rather than a guess."
            >
              <AppTextarea
                name="notes"
                required
                rows={2}
                placeholder="contabilista email, 2026-07-01"
                autoCapitalize="sentences"
              />
            </AppField>

            <PendingButton
              pending={adding}
              pendingText="Adding…"
              className="w-full sm:w-fit"
            >
              Add obligation
            </PendingButton>
          </form>

          {/* The sheet owns its own padding, so the list drops the page gutter
              it would add on a screen. */}
          <GroupedList className="mt-6 px-0">
            <GroupedSection
              header="On the calendar"
              footer="Delete a row that was entered wrong — ticking it off would only arm the next occurrence of the mistake."
            >
              {items.length === 0 ? (
                <GroupedBlock>
                  Nothing on it yet. A year of obligations lives here once your
                  contabilista has confirmed them.
                </GroupedBlock>
              ) : (
                items.map((item) => (
                  <GroupedRow
                    key={item.id}
                    icon={<CalendarClock />}
                    label={item.title}
                    description={<Detail item={item} />}
                    accessory={
                      // There is no hover on a phone, so the delete is simply
                      // always there — one 44px target at the end of the row.
                      // Behind a confirm, unlike a todo's: this one was typed
                      // off a pack, carries its source with it, and there is no
                      // second copy of it anywhere.
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete "${item.title}"`}
                        className="text-app-label-3 hover:text-destructive active:text-destructive"
                        onClick={() => {
                          if (
                            !confirm(
                              `Delete "${item.title}"? This can't be undone.`
                            )
                          ) {
                            return
                          }
                          startDeleting(async () => {
                            markDeleted(item.id)
                            hapticTick()
                            try {
                              await deleteComplianceDateAction(item.id)
                              // The row is gone by the time this lands, so the
                              // toast is the only place the outcome can be read.
                              toast(`Deleted "${item.title}"`)
                            } catch {
                              toast.error(`Couldn't delete "${item.title}"`)
                            }
                          })
                        }}
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                ))
              )}
            </GroupedSection>
          </GroupedList>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
