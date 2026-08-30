"use client"

import { Moon } from "lucide-react"

import {
  AppField,
  AppInput,
  Button,
  PendingButton,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jamie-nisbet/ui"

import type { NextStepSuggestion } from "@/app/(app)/actions"
import { channelLabel } from "@/lib/touches"

// What the cadence thinks happens next, already filled in.
//
// The half of logging a touch that is actually the point: the log is a record,
// and the record is worth nothing without the next step it implies. So the
// sheet that took the touch does not close on it — it turns into this, one tap
// from being real.
//
// Three shapes, because a history has three answers: the next rung, a reply
// owed to somebody who actually spoke, and the end of the road, which parks the
// lead rather than losing them. Nothing here is binding — "Not now" is a real
// answer, and what notices the gap afterwards is the crack-finder, not a
// required field.
//
// It is its own component because two sheets reach it: the touch log, and the
// draft panel, which arrives here through the same door — hand the message
// over, log it, and then decide what follows.

/** The `YYYY-MM-DD` slice a date field wants, out of an ISO timestamp. */
function dateValue(iso: string): string {
  return iso.slice(0, 10)
}

export function NextStepPane({
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
            defaultValue={dateValue(
              park ? (suggestion.wakeAt ?? suggestion.dueAt) : suggestion.dueAt
            )}
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
