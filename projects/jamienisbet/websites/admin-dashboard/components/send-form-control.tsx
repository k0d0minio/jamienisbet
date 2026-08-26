"use client"

import { useState, useTransition } from "react"
import { Send, TriangleAlert } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jamie-nisbet/ui"

import { sendFormToClient } from "@/app/(app)/actions"

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
}: {
  clientId: string
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const [pending, startTransition] = useTransition()
  // The lead's own repo sorts first, so a questionnaire written for this client
  // is what's already selected when the card renders.
  const [formId, setFormId] = useState(forms[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)

  function onSend() {
    if (!formId) return
    setError(null)
    startTransition(async () => {
      const result = await sendFormToClient(clientId, formId)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questionnaires to send. They live in{" "}
          <code className="rounded-xs bg-muted px-1 py-0.5 text-xs">
            .icm/onboarding/
          </code>{" "}
          — in this repo for general ones, or in this lead&apos;s connected
          delivery repo for ones written for them. Add a markdown file to either
          and it shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={formId} onValueChange={setFormId} disabled={pending}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Choose a questionnaire" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                  <span className="text-muted-foreground">
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
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
