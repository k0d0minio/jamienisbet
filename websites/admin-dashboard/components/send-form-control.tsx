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
  slug: string
  title: string
  questionCount: number
}

// Pick a questionnaire, publish it as a link for this lead. Two taps, and the
// second one is the only place in the dashboard that turns a markdown file in
// git into something a customer can open.
export function SendFormControl({
  clientId,
  forms,
  // Files in `.icm/onboarding/` that wouldn't parse. Shown here rather than
  // swallowed: a questionnaire missing from the picker with no explanation is
  // the kind of thing you rediscover months later.
  formErrors,
}: {
  clientId: string
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const [pending, startTransition] = useTransition()
  const [slug, setSlug] = useState(forms[0]?.slug ?? "")
  const [error, setError] = useState<string | null>(null)

  function onSend() {
    if (!slug) return
    setError(null)
    startTransition(async () => {
      const result = await sendFormToClient(clientId, slug)
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
          — add a markdown file there and it shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={slug} onValueChange={setSlug} disabled={pending}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Choose a questionnaire" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((form) => (
                <SelectItem key={form.slug} value={form.slug}>
                  {form.title}
                  <span className="text-muted-foreground">
                    {" "}
                    · {form.questionCount}{" "}
                    {form.questionCount === 1 ? "question" : "questions"}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={pending || !slug}
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
