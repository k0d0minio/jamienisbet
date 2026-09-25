"use client"

import { useState, useTransition } from "react"

import {
  DeskField,
  DeskSegmentedControl,
  DeskTextarea,
  RecordBlock,
  RecordSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Spinner,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  logTouchAction,
  saveNextAction,
  type NextStepSuggestion,
} from "@/app/(app)/actions"
import { ChannelPicker } from "@/components/channel-picker"
import { useLeadProfile } from "@/components/lead-profile"
import { NextStepPane } from "@/components/next-step-pane"
import { hapticTick } from "@/lib/haptics"
import { channelLabel, outcomesFor, type ChannelValue } from "@/lib/touches"

// The touch log — the memory of contact, and the gesture that keeps it.
//
// Two rules shaped this and everything else follows from them.
//
// The first is the ten-second rule: if logging a call takes longer than the
// call was short, it will not happen, and a history with holes in it is worse
// than no history because you trust it. So a touch is **two taps** — the
// channel, then what came of it — and the second tap is the submit. The note
// is a box that is simply there while you are deciding, never a step. Nothing
// is required, nothing is confirmed, and there is no Save button to find.
//
// The second is that the log is only half the point. What the system actually
// needs is the *next* touch, so the sheet does not close on a log: it turns
// into the cadence's suggestion, prefilled — step 3 of 5, on this channel, due
// on this date — one tap from being real. Accepting it is the common case,
// editing it is a field, and "Not now" closes the sheet with nothing planned,
// which is allowed. The crack-finder will mention it later; this will not.
//
// The rows above are rendered on the server (components/touch-row.tsx) and
// handed through as children — a draft is markdown, and rendering it here
// would cost every profile a markdown parser in the browser. The second pane
// is `components/next-step-pane.tsx`, shared with the draft panel, which
// arrives at the same question by a different route.

export function LeadTouches({
  clientId,
  clientName,
  /** How many touches the history holds, so an empty one can say so and a
   *  capped one can admit it is capped. */
  count,
  /** True when the list above is the cap rather than the whole history. */
  capped,
  /**
   * The other door into this section: the reply triage, which logs an inbound
   * touch from pasted text and proposes what follows from it.
   *
   * A slot rather than an import, because it is a client component with a
   * sheet of its own and it belongs *in* this section — logging a reply is the
   * memory of contact, same as logging a touch, and a section of its own would
   * split one question across two headers. The profile builds it and hands it
   * through.
   */
  reply,
  /** The timeline's last line — the day the record began (`CameInRow`). */
  cameIn,
  children,
}: {
  clientId: string
  clientName: string
  count: number
  capped: boolean
  reply?: React.ReactNode
  cameIn?: React.ReactNode
  children: React.ReactNode
}) {
  // On the profile the sheet is opened from the head's action bar ("Log a
  // touch", or L), so its open state is the profile's; anywhere else it is
  // this section's own.
  const profile = useLeadProfile()
  const [ownOpen, setOwnOpen] = useState(false)
  const open = profile ? profile.logOpen : ownOpen
  const setOpen = profile ? profile.setLogOpen : setOwnOpen
  const [logging, startLogging] = useTransition()
  const [saving, startSaving] = useTransition()

  // The log pane's three answers. `channel` is also the pane's state machine:
  // nothing is asked until one is chosen, which is what keeps the sheet short
  // enough to read at a glance.
  const [channel, setChannel] = useState<ChannelValue | null>(null)
  const [direction, setDirection] = useState<"out" | "in">("out")
  const [note, setNote] = useState("")
  const [busyOutcome, setBusyOutcome] = useState<string | null>(null)

  // Set the moment a touch lands, which is what turns the sheet into its
  // second pane. Null means we are still logging.
  const [suggestion, setSuggestion] = useState<NextStepSuggestion | null>(null)

  function reset() {
    setChannel(null)
    setDirection("out")
    setNote("")
    setBusyOutcome(null)
    setSuggestion(null)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    // Reset on the way out rather than the way in, so the sheet's closing
    // animation doesn't play over the fields emptying themselves.
    if (!next) reset()
  }

  function log(outcome: string) {
    if (!channel) return
    setBusyOutcome(outcome)
    startLogging(async () => {
      hapticTick()
      const formData = new FormData()
      formData.set("channel", channel)
      formData.set("direction", direction)
      formData.set("outcome", outcome)
      if (note.trim() !== "") formData.set("note", note.trim())

      const result = await logTouchAction(clientId, formData)
      setBusyOutcome(null)
      if (!result.ok) {
        // The pane is untouched, so the words and the taps are all still
        // there to try again with.
        toast.error(result.message)
        return
      }
      if (!result.suggestion) {
        // They said no. There is nothing to suggest after that, and inventing
        // one is how a cadence becomes a nuisance.
        setOpen(false)
        reset()
        toast("Logged")
        return
      }
      setSuggestion(result.suggestion)
    })
  }

  return (
    <RecordSection
      header="Touches"
      aria-label={`Touch history for ${clientName}`}
      footer={
        count === 0
          ? undefined
          : capped
            ? `The last ${count} — every call, message and visit, newest first.`
            : "Every call, message and visit, newest first."
      }
    >
      {/* The other door in: paste what came back. At the head of the
          timeline, because a reply is usually why the page was opened. */}
      {reply ? <div className="pb-2">{reply}</div> : null}

      {count === 0 ? (
        <RecordBlock>
          Nothing logged yet — a call, a message or a walk-in goes here, and
          what came of it is what decides the next one.
        </RecordBlock>
      ) : null}
      <ol className="flex flex-col">
        {count === 0 ? null : children}
        {cameIn}
      </ol>

      <Sheet open={open} onOpenChange={onOpenChange}>

        {/* Two detents: the channel grid fits at half height, and the note
            wants the whole sheet once you are writing one. */}
        <SheetContent detents={["medium", "large"]}>
          {suggestion ? (
            <NextStepPane
              suggestion={suggestion}
              saving={saving}
              onSave={(formData) =>
                startSaving(async () => {
                  hapticTick()
                  try {
                    await saveNextAction(clientId, formData)
                    onOpenChange(false)
                  } catch {
                    toast.error("Couldn't set the next step")
                  }
                })
              }
              onDismiss={() => onOpenChange(false)}
            />
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Log a touch</SheetTitle>
                <SheetDescription>
                  Two taps: how, then what came of it. The note is optional.
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-4">
                {/* Outbound is almost every row, so it is the default and the
                    only reason to touch this control is the call that came
                    the other way. A radio group, not links: it chooses a value
                    in a form. */}
                <DeskField label="Direction">
                  <DeskSegmentedControl
                    aria-label="Direction"
                    className="w-full *:flex-1"
                    value={direction}
                    onValueChange={setDirection}
                    options={[
                      { value: "out", label: "I reached out" },
                      { value: "in", label: "They got in touch" },
                    ]}
                  />
                </DeskField>

                <DeskField
                  label="Channel"
                  hint="Five doors and a catch-all — the ones this pool actually uses."
                >
                  <ChannelPicker
                    value={channel}
                    onChange={(next) => {
                      hapticTick()
                      setChannel(next)
                    }}
                  />
                </DeskField>

                {/* Nothing else is asked until a channel is chosen: the
                    outcomes depend on it, and a sheet that shows everything at
                    once is a sheet you read instead of tapping. */}
                {channel ? (
                  <>
                    <DeskField
                      label="Note"
                      hint="Optional. The outcome below is what logs it."
                    >
                      <DeskTextarea
                        autoResize
                        rows={2}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What was said…"
                        autoCapitalize="sentences"
                      />
                    </DeskField>

                    <DeskField label={`What came of it — ${channelLabel(channel)}`}>
                      {/* Not radios: each of these *is* the submit, so they
                          are ordinary buttons in a named group. */}
                      <div
                        role="group"
                        aria-label={`What came of it — ${channelLabel(channel)}`}
                        className="grid grid-cols-2 gap-2"
                      >
                        {outcomesFor(channel).map((outcome) => (
                          <button
                            key={outcome.value}
                            type="button"
                            disabled={logging}
                            aria-busy={busyOutcome === outcome.value || undefined}
                            onClick={() => log(outcome.value)}
                            className={cn(
                              "flex min-h-desk-control items-center justify-center gap-2 px-3",
                              "rounded-desk-control border border-desk-line-strong bg-desk-surface text-desk-ui font-medium text-desk-fg",
                              "transition-colors duration-100 hover:bg-desk-hover active:bg-desk-sunken",
                              "disabled:opacity-60"
                            )}
                          >
                            {busyOutcome === outcome.value ? (
                              <Spinner className="size-4" />
                            ) : null}
                            {outcome.label}
                          </button>
                        ))}
                      </div>
                    </DeskField>
                  </>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </RecordSection>
  )
}
