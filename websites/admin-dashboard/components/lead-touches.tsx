"use client"

import { useState, useTransition } from "react"
import {
  AtSign,
  Ellipsis,
  Footprints,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  Plus,
} from "lucide-react"

import {
  AppField,
  AppInput,
  AppTextarea,
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Spinner,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  logTouchAction,
  saveNextAction,
  type NextStepSuggestion,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"
import {
  CHANNELS,
  channelLabel,
  outcomesFor,
  type ChannelValue,
} from "@/lib/touches"

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
// would cost every profile a markdown parser in the browser.

/** Lucide has no brand glyphs; the substitutions match the contact card's. */
function ChannelGlyph({ channel }: { channel: string }) {
  const className = "size-5"
  switch (channel) {
    case "whatsapp":
      return <MessageCircle className={className} aria-hidden />
    case "phone":
      return <Phone className={className} aria-hidden />
    case "email":
      return <Mail className={className} aria-hidden />
    case "walkin":
      return <Footprints className={className} aria-hidden />
    case "instagram":
      return <AtSign className={className} aria-hidden />
    default:
      return <Ellipsis className={className} aria-hidden />
  }
}

/** The `YYYY-MM-DD` slice a date field wants, out of an ISO timestamp. */
function dateValue(iso: string): string {
  return iso.slice(0, 10)
}

export function LeadTouches({
  clientId,
  clientName,
  /** How many touches the history holds, so an empty one can say so and a
   *  capped one can admit it is capped. */
  count,
  /** True when the list above is the cap rather than the whole history. */
  capped,
  children,
}: {
  clientId: string
  clientName: string
  count: number
  capped: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
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
    <GroupedSection
      header="Touches"
      footer={
        count === 0
          ? undefined
          : capped
            ? `The last ${count} — every call, message and visit, newest first.`
            : "Every call, message and visit, newest first."
      }
    >
      {count === 0 ? (
        <GroupedBlock>
          Nothing logged yet — a call, a message or a walk-in goes here, and
          what came of it is what decides the next one.
        </GroupedBlock>
      ) : (
        children
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <GroupedRow icon={<Plus />} label="Log a touch" variant="tint" />
        </SheetTrigger>

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
                <AppField label="Direction">
                  <div
                    role="radiogroup"
                    aria-label="Direction"
                    className="flex items-stretch gap-1 rounded-app-control bg-app-track p-1"
                  >
                    {(
                      [
                        { value: "out", label: "I reached out" },
                        { value: "in", label: "They got in touch" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={direction === option.value}
                        onClick={() => setDirection(option.value)}
                        className={cn(
                          "min-h-app-touch flex-1 rounded-app-control px-3 text-app-footnote",
                          "transition-colors spring-press",
                          direction === option.value
                            ? "bg-app-group font-semibold text-app-label shadow-app-raised"
                            : "font-medium text-app-label-2 active:bg-app-press"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AppField>

                <AppField
                  label="Channel"
                  hint="Five doors and a catch-all — the ones this pool actually uses."
                >
                  {/* The group carries its own name: a `<label>` above a set of
                      buttons has no single control to point at, so what a
                      screen reader reads it from is the role, not the label. */}
                  <div
                    role="radiogroup"
                    aria-label="Channel"
                    className="grid grid-cols-3 gap-2"
                  >
                    {CHANNELS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={channel === option.value}
                        onClick={() => {
                          hapticTick()
                          setChannel(option.value)
                        }}
                        className={cn(
                          "flex min-h-app-touch flex-col items-center justify-center gap-1 px-2 py-2",
                          "rounded-app-control text-app-caption transition-colors spring-press",
                          channel === option.value
                            ? "bg-app-group font-semibold text-app-label shadow-app-raised"
                            : "bg-app-track font-medium text-app-label-2 active:bg-app-press"
                        )}
                      >
                        <ChannelGlyph channel={option.value} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AppField>

                {/* Nothing else is asked until a channel is chosen: the
                    outcomes depend on it, and a sheet that shows everything at
                    once is a sheet you read instead of tapping. */}
                {channel ? (
                  <>
                    <AppField
                      label="Note"
                      hint="Optional. The outcome below is what logs it."
                    >
                      <AppTextarea
                        autoResize
                        rows={2}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What was said…"
                        autoCapitalize="sentences"
                      />
                    </AppField>

                    <AppField label={`What came of it — ${channelLabel(channel)}`}>
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
                              "flex min-h-app-touch items-center justify-center gap-2 px-3",
                              "rounded-app-control bg-app-track text-app-body font-medium text-app-label",
                              "transition-colors spring-press active:bg-app-press",
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
                    </AppField>
                  </>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <span className="sr-only">{`Touch history for ${clientName}`}</span>
    </GroupedSection>
  )
}

// The sheet's second pane: what the cadence thinks happens next, already
// filled in. Three shapes, because there are three answers a history can have
// — the next rung, a reply owed to someone who actually spoke, and the end of
// the road, which parks them rather than losing them.
function NextStepPane({
  suggestion,
  saving,
  onSave,
  onDismiss,
}: {
  suggestion: NextStepSuggestion
  saving: boolean
  onSave: (formData: FormData) => void
  onDismiss: () => void
}) {
  const park = suggestion.kind === "park"
  const title = park
    ? "That's the cadence"
    : suggestion.kind === "reply"
      ? "They're talking"
      : "Logged. Next?"

  const description = park
    ? "Five touches, no answer. Park them on nurture and come back — nothing is lost, it just sleeps."
    : suggestion.kind === "reply"
      ? "The cadence stops here. Get back to them while it is warm."
      : [
          suggestion.step ? `Step ${suggestion.step} of ${suggestion.steps}` : null,
          suggestion.channel ? channelLabel(suggestion.channel) : null,
        ]
          .filter(Boolean)
          .join(" · ")

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {park ? <Moon className="size-4 shrink-0" aria-hidden /> : null}
          {title}
        </SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>

      <form action={onSave} className="grid gap-3">
        {park ? (
          <input type="hidden" name="park" value="1" />
        ) : (
          <AppField label="Next step" hint="Edit it if it isn't quite right.">
            <AppInput
              name="action"
              defaultValue={suggestion.action}
              maxLength={200}
              autoCapitalize="sentences"
              enterKeyHint="done"
            />
          </AppField>
        )}

        <AppField
          label={park ? "Wake date" : "Due"}
          hint={park ? "Ninety days out, by default." : undefined}
        >
          <AppInput
            name="dueDate"
            type="date"
            defaultValue={dateValue(park ? (suggestion.wakeAt ?? suggestion.dueAt) : suggestion.dueAt)}
            className="w-full sm:max-w-52"
          />
        </AppField>

        <div className="flex items-center gap-2">
          <PendingButton
            pending={saving}
            pendingText="Saving…"
            className="w-full sm:w-fit"
          >
            {park ? "Park them" : "Set it"}
          </PendingButton>
          {/* Dismissing is a real answer and costs nothing to give. The touch
              is already logged; this only decides whether anything is
              planned. */}
          <Button
            type="button"
            variant="ghost"
            className="px-3"
            disabled={saving}
            onClick={onDismiss}
          >
            Not now
          </Button>
        </div>
      </form>

      <p className="mt-4 text-app-footnote text-app-label-3">
        Nothing here is binding — a lead with no next step is allowed, it just
        turns up on the Needs you feed as one nobody has planned.
      </p>
    </>
  )
}
