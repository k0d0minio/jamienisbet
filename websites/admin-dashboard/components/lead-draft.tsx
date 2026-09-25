"use client"

import { useState, useTransition } from "react"
import { Copy, PenLine } from "lucide-react"

import {
  AppField,
  AppTextarea,
  Button,
  DeskButton,
  GroupedRow,
  GroupedSection,
  PendingButton,
  RecordBlock,
  RecordSection,
  SegmentedControl,
  SegmentedItem,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  toast,
} from "@jamie-nisbet/ui"

import {
  generateTouchDraft,
  logTouchAction,
  saveNextAction,
  type NextStepSuggestion,
} from "@/app/(app)/actions"
import { DraftHandoff } from "@/components/draft-handoff"
import { NextStepPane } from "@/components/next-step-pane"
import {
  DRAFT_CHANNELS,
  DRAFT_KINDS,
  DRAFT_KIND_HINTS,
  draftChannelLabel,
  splitDraft,
  type DraftChannelValue,
  type DraftKindValue,
} from "@/lib/draft"
import { copyToClipboard } from "@/lib/clipboard"
import { hapticTick } from "@/lib/haptics"
import { NO_SUPPRESSIONS, type SuppressedChannels } from "@/lib/suppression"

// The draft panel — write it, read it, hand it over. Never send it.
//
// This is AI returning to the dashboard after the 2026-08 reversal removed it,
// and the whole reason it is allowed back is the shape of this component: it
// produces a string, puts it under Jamie's eyes in an editable box, and then
// its most it can do is open somebody else's app with the message already
// typed in. `mailto:` opens a compose window. `wa.me?text=` opens a
// conversation. Instagram has no prefill at all, so the draft goes to the
// clipboard and the profile opens beside it. A thumb presses send in every
// case — the estate's standing rule, unrelaxed.
//
// Three things follow from that and shape everything below:
//
//   **A draft is disposable.** Nothing is stored until a touch is logged, and
//   then it rides along on that row (`touches.draft_md`) as a record of what
//   went out. There is no draft table, no version history and no provenance
//   ceremony — the thing that died in the reversal was exactly that.
//
//   **A closed door has no gesture.** Somebody who opted out is not a channel
//   with a disabled button; the app must not be able to *write* the message.
//   The segment is disabled and says why, and the action refuses on the server
//   too, since a disabled control is a UI fact and this is a legal one.
//
//   **The handoff and the log are one movement.** Handing the message over is
//   the moment you know a touch happened, so the offer to log it appears right
//   there — channel and "sent" prefilled, the draft attached — and logging
//   leads into the cadence's next step through the same pane the touch log
//   uses. Read the draft, open the door, log it, plan the next one: four taps,
//   one sheet.

export function LeadDraft({
  clientId,
  clientName,
  email,
  phone,
  whatsapp,
  instagram,
  /** Which of their channels have opted out — resolved on the server. */
  suppressed = NO_SUPPRESSIONS,
  /** False when there is no AI Gateway key: the panel says so and offers
   *  nothing, the way an unconfigured Stripe or GitHub does. */
  configured,
  /** Where the cadence thinks this lead is — which message, down which door.
   *  Both are only defaults; the pickers exist because a cadence is a
   *  suggestion. */
  defaultKind,
  defaultChannel,
  /** True when the row carries a hook. Without one a draft has nothing
   *  specific to lead with, which is worth saying before it is written rather
   *  than after it reads generic. */
  hasHook,
  /** True when this lead reads Portuguese — the one fact that changes which
   *  model writes, so it is worth stating on the panel. */
  portuguese,
}: {
  clientId: string
  clientName: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  suppressed?: SuppressedChannels
  configured: boolean
  defaultKind: DraftKindValue
  defaultChannel: DraftChannelValue | null
  hasHook: boolean
  portuguese: boolean
}) {
  // Which doors this record actually has, and which of them are closed. The
  // chat number follows the number rather than the column — their own WhatsApp
  // line when there is one, the phone otherwise — the same rule every wa.me
  // link in the app follows.
  const chat = whatsapp ?? phone
  const doors: Record<
    DraftChannelValue,
    { value: string | null; closed: boolean }
  > = {
    whatsapp: { value: chat, closed: suppressed.whatsapp },
    email: { value: email, closed: suppressed.email },
    instagram: { value: instagram, closed: suppressed.instagram },
  }
  const openDoors = DRAFT_CHANNELS.filter(
    (c) => doors[c.value].value && !doors[c.value].closed
  )
  const anyClosed = DRAFT_CHANNELS.some((c) => doors[c.value].closed)
  // The cadence's channel where it named one that is writable *and* open, and
  // otherwise the best door that is. A suggestion to walk in or to ring is a
  // real suggestion, it just isn't a message; and a suggestion to email
  // somebody who has since opted out is a stale one.
  const suggested =
    defaultChannel && openDoors.some((d) => d.value === defaultChannel)
      ? defaultChannel
      : null
  const startChannel: DraftChannelValue | null =
    suggested ?? openDoors[0]?.value ?? null

  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<DraftKindValue>(defaultKind)
  const [channel, setChannel] = useState<DraftChannelValue | null>(startChannel)
  const [draft, setDraft] = useState("")
  const [model, setModel] = useState<string | null>(null)
  const [handedOff, setHandedOff] = useState(false)
  const [suggestion, setSuggestion] = useState<NextStepSuggestion | null>(null)

  const [writing, startWriting] = useTransition()
  const [logging, startLogging] = useTransition()
  const [saving, startSaving] = useTransition()

  function reset() {
    setKind(defaultKind)
    setChannel(startChannel)
    setDraft("")
    setModel(null)
    setHandedOff(false)
    setSuggestion(null)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    // Reset on the way out, so the closing animation doesn't play over the
    // sheet emptying itself.
    if (!next) reset()
  }

  function write() {
    if (!channel) return
    startWriting(async () => {
      hapticTick()
      const result = await generateTouchDraft(clientId, kind, channel)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setDraft(result.draft)
      setModel(result.model)
      // A regenerate is a fresh message, so whatever was handed over before it
      // is no longer what is on screen.
      setHandedOff(false)
    })
  }

  /** Anything that put the draft somewhere else. The offer to log follows. */
  function handedOver() {
    hapticTick()
    setHandedOff(true)
  }

  function log() {
    if (!channel) return
    startLogging(async () => {
      hapticTick()
      const formData = new FormData()
      formData.set("channel", channel)
      formData.set("direction", "out")
      // "Sent" is the only honest outcome for a message that has just left:
      // it went, and nothing has come back yet.
      formData.set("outcome", "sent")
      formData.set("draftMd", draft)
      if (model) formData.set("model", model)

      const result = await logTouchAction(clientId, formData)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      if (!result.suggestion) {
        onOpenChange(false)
        toast("Logged")
        return
      }
      setSuggestion(result.suggestion)
    })
  }

  const { subject, body } = splitDraft(draft)

  // What the section says when there is nothing to offer. Three ways to have
  // no draft panel, and they are not the same news: no key is Jamie's to fix,
  // no channel is the record's, and every channel closed is somebody's
  // decision that this app honours.
  if (!configured) {
    return (
      <RecordSection header="Draft">
        <RecordBlock>
          Drafting isn&apos;t set up — there is no AI Gateway key on this
          deployment. Everything else on this page works as it did.
        </RecordBlock>
      </RecordSection>
    )
  }

  if (openDoors.length === 0) {
    return (
      <RecordSection header="Draft">
        <RecordBlock>
          {anyClosed
            ? "They asked not to be contacted, so there is nothing to write."
            : `No address, number or handle on file for ${clientName} — a draft needs a door to go out of.`}
        </RecordBlock>
      </RecordSection>
    )
  }

  return (
    <RecordSection
      header="Draft"
      footer="Written here, sent by you — nothing leaves this app."
    >
      <Sheet open={open} onOpenChange={onOpenChange}>
        <div className="flex flex-wrap items-center gap-3 py-2">
          <SheetTrigger asChild>
            <DeskButton variant="primary">
              <PenLine aria-hidden />
              Write a draft
            </DeskButton>
          </SheetTrigger>
          {/* Where the cadence says to start: which message, which door. */}
          <span className="font-mono text-desk-meta text-desk-fg-3">
            {[
              DRAFT_KINDS.find((k) => k.value === defaultKind)?.label,
              startChannel ? draftChannelLabel(startChannel) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        {/* The draft is the point and it is prose, so this sheet opens at full
            height rather than dragging up to it. */}
        <SheetContent detents={["large"]}>
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
                <SheetTitle>Write a draft</SheetTitle>
                <SheetDescription>
                  Grounded on what is on this page. Read it, change what
                  doesn&apos;t sound like you, then open the door it goes out
                  of.
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-4">
                <AppField label="Which message" hint={DRAFT_KIND_HINTS[kind]}>
                  <SegmentedControl role="radiogroup" aria-label="Which message">
                    {DRAFT_KINDS.map((option) => (
                      <SegmentedItem
                        key={option.value}
                        role="radio"
                        label={option.label}
                        active={kind === option.value}
                        onClick={() => setKind(option.value)}
                      />
                    ))}
                  </SegmentedControl>
                </AppField>

                <AppField
                  label="Down which door"
                  hint={
                    anyClosed
                      ? "A door they opted out of can't be written for at all."
                      : "The register follows the channel — an email is not a WhatsApp message."
                  }
                >
                  <SegmentedControl role="radiogroup" aria-label="Down which door">
                    {DRAFT_CHANNELS.map((option) => {
                      const door = doors[option.value]
                      const available = Boolean(door.value) && !door.closed
                      return (
                        <SegmentedItem
                          key={option.value}
                          role="radio"
                          label={option.label}
                          active={channel === option.value}
                          disabled={!available}
                          className="disabled:opacity-40"
                          title={
                            door.closed
                              ? "They opted out — nothing goes out here"
                              : door.value
                                ? undefined
                                : "Nothing on file for this one"
                          }
                          onClick={() => setChannel(option.value)}
                        />
                      )
                    })}
                  </SegmentedControl>
                </AppField>

                {writing ? (
                  // Layout-true: the box that is about to hold the draft,
                  // at about the height four sentences take.
                  <div className="grid gap-2" aria-busy="true">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-28 w-full" />
                    <span className="sr-only">Writing a draft…</span>
                  </div>
                ) : draft === "" ? (
                  // The empty state, and it says something worth knowing
                  // before the call rather than after it reads generic: a lead
                  // with no hook has nothing specific for a message to lead
                  // with, and that is a gap in the record, not in the model.
                  <p className="rounded-app-group border border-app-separator bg-app-group px-4 py-3 text-app-callout text-app-label-2">
                    {hasHook
                      ? "Nothing written yet. The hook on this lead is what the message will lead with."
                      : "Nothing written yet. There is no hook on this lead, so the draft has only the sector and the town to work from — it will be thinner for it."}
                    {portuguese
                      ? " They read Portuguese, so it will be written in pt-PT."
                      : null}
                  </p>
                ) : (
                  <AppField
                    label="The draft"
                    hint={
                      model ? (
                        <>
                          Edit it freely — what you send is what gets logged.
                          Written by <span className="font-mono">{model}</span>.
                        </>
                      ) : (
                        "Edit it freely — what you send is what gets logged."
                      )
                    }
                  >
                    <AppTextarea
                      autoResize
                      rows={8}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      autoCapitalize="sentences"
                      spellCheck
                    />
                  </AppField>
                )}

                <div className="flex items-center gap-2">
                  <PendingButton
                    type="button"
                    pending={writing}
                    pendingText="Writing…"
                    className="w-full sm:w-fit"
                    disabled={!channel}
                    onClick={write}
                  >
                    {draft === "" ? "Write it" : "Write it again"}
                  </PendingButton>
                  {draft === "" ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3"
                      disabled={writing}
                      onClick={() => {
                        setDraft("")
                        setModel(null)
                        setHandedOff(false)
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {draft === "" || !channel ? null : (
                  <GroupedSection
                    header="Hand it over"
                    footer="Each of these opens the message somewhere else with nothing sent. You press send."
                  >
                    <DraftHandoff
                      channel={channel}
                      value={doors[channel].value ?? ""}
                      subject={subject}
                      body={body}
                      onHandoff={handedOver}
                    />
                    <GroupedRow
                      icon={<Copy />}
                      label="Copy the draft"
                      chevron={false}
                      onClick={() => {
                        void copyToClipboard(draft, "Draft")
                        handedOver()
                      }}
                    />
                  </GroupedSection>
                )}

                {handedOff ? (
                  <GroupedSection footer="The draft is kept on the touch, so the history shows what actually went out.">
                    <GroupedRow
                      icon={<PenLine />}
                      variant="tint"
                      label={`Log it — ${draftChannelLabel(channel ?? "")}, sent`}
                      description={
                        logging ? "Logging…" : "And plan what happens next"
                      }
                      chevron={false}
                      disabled={logging}
                      onClick={log}
                    />
                  </GroupedSection>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <span className="sr-only">{`Draft outreach for ${clientName}`}</span>
    </RecordSection>
  )
}
