"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Label,
} from "@jamie-nisbet/ui"
import type { FormSnapshot } from "@jamie-nisbet/services"

import { submitIntake } from "@/app/actions/intake"
import { Question } from "@/components/customer-form"
import type { IntakeState } from "@/lib/intake-schema"

const initialState: IntakeState = { status: "idle" }

// The free-look intake: who you are, then the eight questions of
// `intake-diagnostic.md`, rendered by the same `Question` component a sent
// questionnaire uses — so the public form and a form sent by link are one
// form. The chrome (labels, the button, the thanks) is in the visitor's
// language; the questions are whatever the markdown says, in the language it
// was written in, exactly as on `/f/[token]`.

function IdentityField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  hint,
  error,
  required,
}: {
  id: string
  name: string
  label: string
  type?: string
  autoComplete?: string
  hint?: string
  error?: string
  required?: boolean
}) {
  // Controlled for the same reason the questions are: React 19 resets a
  // `<form action>` when the action resolves, and a validation failure must
  // not wipe the page.
  const [value, setValue] = useState("")
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-base leading-snug font-medium">
        {label}
        {!required ? (
          <span className="ml-2 font-mono text-2xs tracking-wide text-muted-foreground">
            OPTIONAL
          </span>
        ) : null}
      </Label>
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined
        }
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function IntakeForm({ snapshot }: { snapshot: FormSnapshot }) {
  const t = useTranslations("start")
  const tForm = useTranslations("form")
  const [state, formAction, pending] = useActionState(submitIntake, initialState)

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>{t("successTitle")}</AlertTitle>
        <AlertDescription>{t("successBody")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-10" noValidate>
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold tracking-tight">{t("identityTitle")}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <IdentityField
            id="intake-name"
            name="name"
            label={t("name")}
            autoComplete="name"
            error={state.errors?.name}
            required
          />
          <IdentityField
            id="intake-email"
            name="email"
            type="email"
            label={t("email")}
            autoComplete="email"
            error={state.errors?.email}
            required
          />
          <IdentityField
            id="intake-phone"
            name="phone"
            type="tel"
            label={t("phone")}
            hint={t("phoneHint")}
            autoComplete="tel"
            error={state.errors?.phone}
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold tracking-tight">{t("questionsTitle")}</h2>
        <ol className="flex flex-col gap-6">
          {snapshot.fields.map((field, index) => (
            <Question
              key={field.key}
              field={field}
              index={index}
              error={state.errors?.[field.key]}
            />
          ))}
        </ol>
      </section>

      {/* The honeypot, as on the contact form: hidden from people, filled by
          bots, and a filled one is thanked and thrown away. */}
      <div aria-hidden className="hidden">
        <label>
          {tForm("honeypotLabel")}
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border/70 pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  )
}
