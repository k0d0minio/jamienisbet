"use client"

import { useState, useTransition } from "react"
import { Send, TriangleAlert } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  Button,
  GroupedRow,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@jamie-nisbet/ui"

import { sendFormToClient } from "@/app/(app)/actions"
import { ShareFormLink } from "@/components/share-form-link"
import { hapticTick } from "@/lib/haptics"

export type FormChoiceView = {
  /** What gets sent back: a house slug, or `<repo-name>/<slug>`. */
  id: string
  slug: string
  title: string
  questionCount: number
  /** "owner/name" the markdown lives in, or null for the house library. */
  sourceRepo: string | null
}

/** What the server hands back the moment a link exists — enough to share it
 *  without going back to look for the row it just created. */
export type SentLink = { id: string; title: string; url: string }

// Pick a questionnaire, publish it as a link for this lead. Two taps, and the
// second one is the only place in the dashboard that turns a markdown file in
// git into something a customer can open.
export function SendFormControl({
  clientId,
  forms,
  // Files in `.icm/onboarding/` that wouldn't parse, or a repo that couldn't be
  // read. Shown here rather than swallowed: a questionnaire missing from the
  // picker with no explanation is the kind of thing you rediscover months later.
  formErrors,
  // Handed the published link the moment there is one, so a sheet holding
  // this can turn straight into the way to send it. Errors don't fire it —
  // the message is in here.
  onSent,
}: {
  clientId: string
  forms: FormChoiceView[]
  formErrors: string[]
  onSent?: (link: SentLink) => void
}) {
  const [pending, startTransition] = useTransition()
  // The lead's own repo sorts first, so a questionnaire written for this client
  // is what's already selected when the card renders.
  const [formId, setFormId] = useState(forms[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)

  function onSend() {
    if (!formId) return
    setError(null)
    hapticTick()
    startTransition(async () => {
      const result = await sendFormToClient(clientId, formId)
      if (result.ok) onSent?.(result.link)
      else setError(result.message)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {forms.length === 0 ? (
        <p className="text-app-subhead text-app-label-3">
          No questionnaires to send. They live in{" "}
          <code className="rounded-xs bg-app-press px-1 py-0.5 text-app-caption">
            .icm/onboarding/
          </code>{" "}
          — in this repo for general ones, or in this lead&apos;s connected
          delivery repo for ones written for them. Add a markdown file to either
          and it shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AppSelect value={formId} onValueChange={setFormId} disabled={pending}>
            <AppSelectTrigger
              className="w-full sm:flex-1"
              aria-label="Questionnaire to send"
            >
              <AppSelectValue placeholder="Choose a questionnaire" />
            </AppSelectTrigger>
            <AppSelectContent>
              {forms.map((form) => (
                <AppSelectItem key={form.id} value={form.id}>
                  {form.title}
                  <span className="text-material-label-3">
                    {" "}
                    · {form.questionCount}{" "}
                    {form.questionCount === 1 ? "question" : "questions"}
                    {/* Which repo it came out of. Two questionnaires can share
                        a title across repos, and "is this the one written for
                        them, or the generic one?" is the question you have at
                        the moment of sending. */}
                    {form.sourceRepo === null
                      ? null
                      : ` · ${form.sourceRepo.split("/").pop()}`}
                  </span>
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
          <Button
            type="button"
            disabled={pending || !formId}
            onClick={onSend}
            className="shrink-0"
          >
            <Send />
            {pending ? "Sending…" : "Send form"}
          </Button>
        </div>
      )}

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>That questionnaire couldn&apos;t be sent</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {formErrors.length > 0 ? (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>
            {formErrors.length === 1
              ? "One questionnaire couldn't be read"
              : `${formErrors.length} questionnaires couldn't be read`}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

// The Forms group's own row: sending a questionnaire is a two-tap act on a
// phone (pick one, send), and a grouped list has no room for a picker and a
// button on a line — so the row opens a sheet and the control above lives in
// it. The row is the only part of this file the profile screen renders
// directly; anything else can still use the control on its own.
//
// The sheet does not close on a successful send. Publishing a link and
// handing it over used to be two errands — send, close, find the new row,
// open its fold, copy the URL — and they are really one: the moment the link
// exists is the moment you want to give it to someone. So the picker turns
// into the ways of sending it, in place, in the same gesture. Closing the
// sheet is what says you're done.
export function SendFormRow({
  clientId,
  clientName,
  clientEmail,
  forms,
  formErrors,
}: {
  clientId: string
  clientName: string
  /** The lead's address, or null — decides whether a mail draft is offered. */
  clientEmail: string | null
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState<SentLink | null>(null)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Back to the picker for the next one — but only once it has gone,
        // so the sheet doesn't flick through its old contents on the way out.
        if (!next) setSent(null)
      }}
    >
      <SheetTrigger asChild>
        <GroupedRow
          icon={<Send />}
          label="Send a questionnaire"
          description={
            forms.length === 0
              ? "Nothing in the library yet"
              : `${forms.length} in the library`
          }
        />
      </SheetTrigger>
      {/* Half-height for the picker; the drag up is for the QR on the far
          side of the send. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>{sent ? "Ways to send" : "Send a questionnaire"}</SheetTitle>
          <SheetDescription>
            {sent
              ? `${sent.title} is live. Pick how it reaches them — the answers land back on this page.`
              : "Publishing one gives you a link to hand over — the dashboard never sends it for you. The answers land back on this page."}
          </SheetDescription>
        </SheetHeader>
        {sent ? (
          <ShareFormLink
            url={sent.url}
            formTitle={sent.title}
            clientName={clientName}
            clientEmail={clientEmail}
          />
        ) : (
          <SendFormControl
            clientId={clientId}
            forms={forms}
            formErrors={formErrors}
            onSent={setSent}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
