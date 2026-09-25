"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Inbox, Moon, PenLine } from "lucide-react"

import {
  DeskField,
  DeskInput,
  DeskTextarea,
  Button,
  DeskButton,
  RecordBlock,
  RecordRow,
  RecordSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import {
  acceptReplyOutcome,
  acceptReplyStage,
  logTouchAction,
  saveNextAction,
  suppressClientContacts,
  triageReply,
  type ReplyTriage,
} from "@/app/(app)/actions"
import { ChannelPicker } from "@/components/channel-picker"
import { DraftHandoff } from "@/components/draft-handoff"
import { copyToClipboard } from "@/lib/clipboard"
import {
  draftChannelLabel,
  isDraftChannelValue,
  splitDraft,
  type DraftChannelValue,
} from "@/lib/draft"
import { hapticTick } from "@/lib/haptics"
import {
  INBOUND_OUTCOMES,
  channelLabel,
  isChannelValue,
  type ChannelValue,
} from "@/lib/touches"

// They answered — paste it, and the bookkeeping proposes itself.
//
// The loop the draft panel opens, closed. Replies arrive in Jamie's own
// mailbox, WhatsApp and Instagram because that is where the handoff put them,
// and there is no inbound plumbing here to fetch them back: no IMAP, no
// webhook, no forwarding address. The paste **is** the integration, it costs
// nothing to maintain, and it cannot break.
//
// Three rules shape the whole component.
//
//   **The touch lands first, and lands whatever happens next.** Pasting is the
//   log gesture; reading is what follows it. So the server writes the inbound
//   row before it asks the Gateway anything, under an outcome derived from the
//   channel alone — and a missing key, a Gateway that is down and a model that
//   returns nonsense all cost the same thing, which is a triage rather than a
//   record. The pane below says "logged" before it says anything else.
//
//   **Every element is its own tap.** The outcome, the rung, the next step and
//   the answer are four separate decisions and four separate writes; there is
//   no Save button that applies them together, and closing the sheet on any of
//   them is a real answer. Accepting nothing still leaves the reply in the
//   history, which is the point of the order things happen in.
//
//   **A no ends it.** When the message asks to be left alone there is no answer
//   to write and no next step to plan — the server refuses to return either —
//   and what is offered instead is the opt-out, in red, under the words that
//   triggered it. It is the same call the Opt-out section makes, with the same
//   permanence: every channel closed for good, keyed to the contact rather than
//   to this record.
//
// Nothing here sends anything. The answer goes out through the same three
// gestures the draft panel uses — a compose window, a chat with the message
// typed in, the clipboard — and a thumb presses send.

/** How much pasted text the action reads. Mirrored so the box stops where the
 *  server does; keep in step with `TRIAGE_INPUT_LIMIT` in
 *  packages/services/src/triage.ts. */
const SAID_LIMIT = 8_000

/** The `YYYY-MM-DD` slice a date field wants, out of an ISO timestamp. */
function dateValue(iso: string): string {
  return iso.slice(0, 10)
}

export function LeadReply({
  clientId,
  clientName,
  email,
  phone,
  whatsapp,
  instagram,
  /** False when there is no AI Gateway key. The flow still works — pasting a
   *  reply is worth doing without a model reading it — it just logs and stops. */
  configured,
  /** Which door to start on: whichever the last touch used. Only a default. */
  defaultChannel,
}: {
  clientId: string
  clientName: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  configured: boolean
  defaultChannel: string
}) {
  const startChannel: ChannelValue = isChannelValue(defaultChannel)
    ? defaultChannel
    : "whatsapp"

  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ChannelValue>(startChannel)
  const [said, setSaid] = useState("")

  // Set the moment the reply lands, which is what turns the sheet into its
  // second pane. Null means we are still pasting.
  const [triage, setTriage] = useState<ReplyTriage | null>(null)

  // What the touch currently holds, and the four editable proposals beside it.
  const [outcome, setOutcome] = useState<string | null>(null)
  const [action, setAction] = useState("")
  const [due, setDue] = useState("")
  const [wake, setWake] = useState("")
  const [reason, setReason] = useState("")
  const [draft, setDraft] = useState("")

  // Which elements have been applied, and what came back from the one that
  // reports something. An applied element stops being a control and starts
  // being a line of the record.
  const [applied, setApplied] = useState<ReadonlySet<string>>(new Set())
  const [closed, setClosed] = useState<string[]>([])
  const [handedOff, setHandedOff] = useState(false)

  const [reading, startReading] = useTransition()
  const [working, startWorking] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)

  function reset() {
    setChannel(startChannel)
    setSaid("")
    setTriage(null)
    setOutcome(null)
    setAction("")
    setDue("")
    setWake("")
    setReason("")
    setDraft("")
    setApplied(new Set())
    setClosed([])
    setHandedOff(false)
    setBusy(null)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    // Reset on the way out, so the closing animation doesn't play over the
    // sheet emptying itself.
    if (!next) reset()
  }

  function markApplied(key: string) {
    setApplied((current) => new Set(current).add(key))
  }

  function readIt() {
    if (said.trim() === "") return
    startReading(async () => {
      hapticTick()
      const formData = new FormData()
      formData.set("channel", channel)
      formData.set("said", said.trim())

      const result = await triageReply(clientId, formData)
      if (!result.ok) {
        // The pane is untouched, so the words are still there to try again
        // with — which matters most here, where they were pasted from an app
        // that has since gone to the background.
        toast.error(result.message)
        return
      }

      const landed = result.triage
      setTriage(landed)
      setOutcome(landed.loggedOutcome.value)
      setAction(landed.next?.action ?? "")
      setDue(landed.next ? dateValue(landed.next.dueAt) : "")
      setWake(landed.read?.stage?.wakeAt ? dateValue(landed.read.stage.wakeAt) : "")
      // The summary is the truest short reason there will ever be for an
      // opt-out, and it is editable before it is recorded.
      setReason(landed.read?.summary ?? "")
      setDraft(landed.read?.reply?.draft ?? "")
    })
  }

  /** The outcome grid: every tap is the whole gesture, so there is no separate
   *  accept. Tapping the word already on the row does nothing. */
  function takeOutcome(next: string) {
    if (!triage || next === outcome) return
    setBusy(`outcome:${next}`)
    startWorking(async () => {
      hapticTick()
      const result = await acceptReplyOutcome(clientId, triage.touchId, next)
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setOutcome(next)
      markApplied("outcome")
    })
  }

  function takeStage(status: string) {
    setBusy("stage")
    startWorking(async () => {
      hapticTick()
      const result = await acceptReplyStage(
        clientId,
        status,
        status === "nurture" ? (wake || null) : null
      )
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      markApplied("stage")
      toast(status === "nurture" ? "Parked" : "Moved")
    })
  }

  function takeNext() {
    if (action.trim() === "") return
    setBusy("next")
    startWorking(async () => {
      hapticTick()
      const formData = new FormData()
      formData.set("action", action.trim())
      if (due !== "") formData.set("dueDate", due)
      try {
        await saveNextAction(clientId, formData)
        markApplied("next")
        toast("Next step set")
      } catch {
        toast.error("Couldn't set the next step")
      } finally {
        setBusy(null)
      }
    })
  }

  function takeOptOut() {
    setBusy("optout")
    startWorking(async () => {
      hapticTick()
      const formData = new FormData()
      if (reason.trim() !== "") formData.set("reason", reason.trim())
      const result = await suppressClientContacts(clientId, formData)
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setClosed(result.closed)
      markApplied("optout")
    })
  }

  /** Anything that put the answer somewhere else. The offer to log follows. */
  function handedOver() {
    hapticTick()
    setHandedOff(true)
  }

  function logAnswer(door: DraftChannelValue, wroteIt: string) {
    setBusy("draft")
    startWorking(async () => {
      hapticTick()
      const formData = new FormData()
      formData.set("channel", door)
      formData.set("direction", "out")
      // "Sent" is the only honest outcome for a message that has just left.
      formData.set("outcome", "sent")
      formData.set("draftMd", draft)
      if (wroteIt !== "") formData.set("model", wroteIt)

      const result = await logTouchAction(clientId, formData)
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      // The cadence's suggestion is ignored on purpose: the next step was
      // settled two sections above this one, from what they actually said,
      // and asking the same question twice in one sheet is how a flow starts
      // being tapped through rather than read.
      markApplied("draft")
      toast("Logged")
    })
  }

  // Hoisted rather than reached for through `triage?.read` at each use: these
  // are read inside callbacks, and a const local is the only form the narrowing
  // survives into one.
  const read = triage?.read ?? null
  const stage = read?.stage ?? null
  const answer = read?.reply ?? null
  /** Which model read it — carried down to the touch the answer is logged on,
   *  the same courtesy field a first draft leaves behind. */
  const model = read?.model ?? ""
  const parked = applied.has("stage") && stage?.value === "nurture"
  const optedOut = applied.has("optout")

  // Where the answer would go out of, and what is on file for that door. The
  // chat number follows the number rather than the column — their own WhatsApp
  // line when there is one, the phone otherwise — the rule every wa.me link in
  // the app follows.
  const replyChannel =
    answer && isDraftChannelValue(answer.channel) ? answer.channel : null
  const replyDoor =
    replyChannel === "email"
      ? email
      : replyChannel === "whatsapp"
        ? (whatsapp ?? phone)
        : replyChannel === "instagram"
          ? instagram
          : null

  const { subject, body } = splitDraft(draft)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <DeskButton
          variant="secondary"
          title={
            configured
              ? "Paste what they said and take it from there"
              : "Paste what they said"
          }
        >
          <Inbox aria-hidden />
          Log a reply
        </DeskButton>
      </SheetTrigger>

      {/* The read is prose and the pane under it is four decisions, so this
          sheet opens at full height rather than dragging up to it. */}
      <SheetContent detents={["large"]}>
        {triage ? (
          <div className="grid gap-4">
            <SheetHeader>
              <SheetTitle>{read ? "What they said" : "Logged"}</SheetTitle>
              <SheetDescription>
                Logged as an inbound touch — {channelLabel(channel)}. Everything
                below waits for a tap.
              </SheetDescription>
            </SheetHeader>

            {/* The read, or the reason there isn't one. Either way the reply is
                already in the history, which is what the words say. */}
            <RecordSection
              header="The read"
              footer={
                read
                  ? `Read by ${read.model}. Nothing below is written until you tap it.`
                  : undefined
              }
            >
              <RecordBlock>
                {read ? (
                  <p className="text-desk-fg">{read.summary}</p>
                ) : (
                  <p className="text-desk-body text-desk-fg-2">
                    {triage.message}
                  </p>
                )}
              </RecordBlock>
            </RecordSection>

            {/* What came of it. Every button is the whole gesture rather than a
                selection waiting on a save, and the one already on the row is
                the one that reads as chosen. */}
            <RecordSection
              header="What came of it"
              footer={
                read?.outcome
                  ? `Logged as ${triage.loggedOutcome.label} before anything read it — ${read.outcome.label} is what the message says.`
                  : "Changes the touch you just logged, and nothing else."
              }
            >
              <RecordBlock>
                <div
                  role="group"
                  aria-label="What came of it"
                  className="grid grid-cols-2 gap-2"
                >
                  {INBOUND_OUTCOMES.map((option) => {
                    const active = outcome === option.value
                    const proposed = read?.outcome?.value === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={working || active}
                        aria-busy={busy === `outcome:${option.value}` || undefined}
                        onClick={() => takeOutcome(option.value)}
                        className={cn(
                          "flex min-h-desk-control items-center justify-center gap-1.5 border px-3",
                          "rounded-desk-control text-desk-ui transition-colors duration-100",
                          // Chosen is the sunken fill plus weight, the desk's
                          // one selected state; the proposed one is weight
                          // alone, on the surface.
                          active
                            ? "border-desk-line-strong bg-desk-sunken font-semibold text-desk-fg"
                            : proposed
                              ? "border-desk-line-strong bg-desk-surface font-semibold text-desk-fg hover:bg-desk-hover active:bg-desk-sunken"
                              : "border-desk-line bg-desk-surface text-desk-fg-2 hover:bg-desk-hover active:bg-desk-sunken",
                          "disabled:pointer-events-none"
                        )}
                      >
                        {active ? (
                          <Check className="size-desk-icon shrink-0" aria-hidden />
                        ) : null}
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </RecordBlock>
            </RecordSection>

            {/* The opt-out, when the message asked for one. Irreversible, so it
                sits under the reason it is being offered and behind a button
                that says what it does rather than behind a row you could brush
                past on the way to the next section. */}
            {read?.optOut ? (
              <RecordSection
                header="They asked to be removed"
                footer="Permanent, and it belongs to the contact rather than to this record — a re-import can't bring it back."
              >
                <RecordBlock>
                  {optedOut ? (
                    <p className="text-desk-fg">
                      Opted out
                      {closed.length > 0 ? ` — ${closed.join(", ")} closed` : null}.
                      They&apos;re Not won, and nothing is planned.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      <p className="text-desk-body text-desk-fg-2">
                        Closes every address, number and handle for {clientName}{" "}
                        for good, moves them to Not won, and clears what happens
                        next.
                      </p>
                      <DeskField
                        label="Reason"
                        hint="What they said, in a few words — the only thing that explains this a year from now."
                      >
                        <DeskInput
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          maxLength={200}
                          autoCapitalize="sentences"
                          enterKeyHint="done"
                        />
                      </DeskField>
                      <PendingButton
                        type="button"
                        pending={busy === "optout"}
                        pendingText="Recording…"
                        variant="destructive"
                        className="w-full sm:w-fit"
                        disabled={working}
                        onClick={takeOptOut}
                      >
                        Record the opt-out
                      </PendingButton>
                    </div>
                  )}
                </RecordBlock>
              </RecordSection>
            ) : stage ? (
              <RecordSection header="Where they sit" footer={stage.hint}>
                {applied.has("stage") ? (
                  <RecordRow
                    icon={<Check />}
                    label={`Moved to ${stage.label}`}
                    description={
                      parked && wake ? `Wakes ${wake}` : `From ${stage.from}`
                    }
                    chevron={false}
                  />
                ) : (
                  <RecordRow
                    icon={stage.value === "nurture" ? <Moon /> : undefined}
                    label={`Move to ${stage.label}`}
                    description={
                      busy === "stage"
                        ? "Moving…"
                        : `They're ${stage.from} today`
                    }
                    variant="tint"
                    chevron={false}
                    disabled={working}
                    onClick={() => takeStage(stage.value)}
                  />
                )}

                {/* A park needs a date to come back on: without one the row
                    sleeps forever, which is the thing nurture was invented not
                    to be. */}
                {stage.value === "nurture" && !applied.has("stage") ? (
                  <RecordBlock>
                    <DeskField
                      label="Wake date"
                      hint="When they come back into the queue."
                    >
                      <DeskInput
                        type="date"
                        value={wake}
                        onChange={(event) => setWake(event.target.value)}
                        className="w-full sm:max-w-52"
                      />
                    </DeskField>
                  </RecordBlock>
                ) : null}
              </RecordSection>
            ) : null}

            {/* What to do about it. Editable before it is set, because a
                proposal that is nearly right is worth a word rather than a
                retype. */}
            {triage.next && !optedOut ? (
              <RecordSection
                header="Next step"
                footer={
                  triage.next.source === "model"
                    ? "Proposed from what they said."
                    : "The cadence's own answer — nothing was proposed from the message."
                }
              >
                <RecordBlock>
                  {parked ? (
                    <p className="text-desk-body text-desk-fg-2">
                      Parked — nothing is planned until they wake.
                    </p>
                  ) : applied.has("next") ? (
                    <p className="text-desk-fg">
                      Set — {action}
                      {due ? (
                        <>
                          , due <span className="font-mono">{due}</span>
                        </>
                      ) : null}
                      .
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      <DeskField
                        label="What to do"
                        hint="Edit it if it isn't quite right."
                      >
                        <DeskInput
                          value={action}
                          onChange={(event) => setAction(event.target.value)}
                          maxLength={200}
                          autoCapitalize="sentences"
                          enterKeyHint="done"
                        />
                      </DeskField>
                      <DeskField label="Due">
                        <DeskInput
                          type="date"
                          value={due}
                          onChange={(event) => setDue(event.target.value)}
                          className="w-full sm:max-w-52"
                        />
                      </DeskField>
                      <PendingButton
                        type="button"
                        pending={busy === "next"}
                        pendingText="Setting…"
                        className="w-full sm:w-fit"
                        disabled={working || action.trim() === ""}
                        onClick={takeNext}
                      >
                        Set it
                      </PendingButton>
                    </div>
                  )}
                </RecordBlock>
              </RecordSection>
            ) : null}

            {/* The answer, grounded on the thread — and handed over exactly the
                way a first message is. Nothing here sends. */}
            {answer && replyChannel && replyDoor ? (
              <RecordSection
                header={`The answer — ${draftChannelLabel(replyChannel)}`}
                footer="Written here, sent by you — nothing leaves this app."
              >
                <RecordBlock>
                  <DeskField
                    label="The draft"
                    hint="Edit it freely — what you send is what gets logged."
                  >
                    <DeskTextarea
                      autoResize
                      rows={6}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      autoCapitalize="sentences"
                      spellCheck
                    />
                  </DeskField>
                </RecordBlock>

                <DraftHandoff
                  channel={replyChannel}
                  value={replyDoor}
                  subject={subject}
                  body={body}
                  onHandoff={handedOver}
                />
                <RecordRow
                  icon={<Copy />}
                  label="Copy the answer"
                  chevron={false}
                  onClick={() => {
                    void copyToClipboard(draft, "Answer")
                    handedOver()
                  }}
                />

                {handedOff ? (
                  applied.has("draft") ? (
                    <RecordRow
                      icon={<Check />}
                      label={`Logged — ${draftChannelLabel(replyChannel)}, sent`}
                      description="The answer is kept on the touch"
                      chevron={false}
                    />
                  ) : (
                    <RecordRow
                      icon={<PenLine />}
                      variant="tint"
                      label={`Log it — ${draftChannelLabel(replyChannel)}, sent`}
                      description={
                        busy === "draft"
                          ? "Logging…"
                          : "So the history shows what went back"
                      }
                      chevron={false}
                      disabled={working}
                      onClick={() => logAnswer(replyChannel, model)}
                    />
                  )
                ) : null}
              </RecordSection>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="px-3"
                disabled={working}
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Log a reply</SheetTitle>
              <SheetDescription>
                {configured
                  ? "Paste what they said — their message, or your own note of a call. It becomes an inbound touch, and what follows from it is proposed one tap at a time."
                  : "Paste what they said — their message, or your own note of a call. It becomes an inbound touch."}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4">
              <DeskField
                label="Where it came in"
                hint="The door they used — which is also where an answer would go back."
              >
                <ChannelPicker
                  value={channel}
                  onChange={(next) => {
                    hapticTick()
                    setChannel(next)
                  }}
                  label="Where it came in"
                />
              </DeskField>

              {reading ? (
                // Layout-true: the summary and the two or three decisions that
                // are about to take this box's place.
                <div className="grid gap-3" aria-busy="true">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-2 h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <span className="sr-only">Reading the reply…</span>
                </div>
              ) : (
                <DeskField
                  label="What they said"
                  hint={
                    configured
                      ? "In full, in their words — it is what the read is grounded on."
                      : "Triage isn't set up on this deployment, so this is logged as it stands."
                  }
                >
                  <DeskTextarea
                    autoResize
                    rows={6}
                    value={said}
                    onChange={(event) => setSaid(event.target.value)}
                    maxLength={SAID_LIMIT}
                    placeholder="Paste it here…"
                    autoCapitalize="sentences"
                    spellCheck
                  />
                </DeskField>
              )}

              <PendingButton
                type="button"
                pending={reading}
                pendingText={configured ? "Reading…" : "Logging…"}
                className="w-full sm:w-fit"
                disabled={said.trim() === ""}
                onClick={readIt}
              >
                {configured ? "Read it" : "Log it"}
              </PendingButton>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
