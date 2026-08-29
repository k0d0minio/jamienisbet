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
  // Told when a link has actually been published, so a sheet holding this can
  // close on the way out. Errors keep it open — the message is in here.
  onSent,
}: {
  clientId: string
  forms: FormChoiceView[]
  formErrors: string[]
  onSent?: () => void
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
      if (result.ok) onSent?.()
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
export function SendFormRow({
  clientId,
  forms,
  formErrors,
}: {
  clientId: string
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>Send a questionnaire</SheetTitle>
          <SheetDescription>
            Publishing one gives you a link to paste into an email — the
            dashboard never sends it for you. The answers land back on this
            page.
          </SheetDescription>
        </SheetHeader>
        <SendFormControl
          clientId={clientId}
          forms={forms}
          formErrors={formErrors}
          onSent={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
