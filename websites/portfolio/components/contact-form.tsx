"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Label,
  Textarea,
} from "@jamie-nisbet/ui"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"

import { submitContact } from "@/app/actions/contact"
import { site } from "@/lib/site"
import type { ContactState } from "@/lib/contact-schema"

const initialState: ContactState = { status: "idle" }

export function ContactForm() {
  const t = useTranslations("form")
  const [state, formAction, pending] = useActionState(submitContact, initialState)

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>{t("sentTitle")}</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={state.values?.name}
          aria-invalid={Boolean(state.errors?.name)}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
        />
        {state.errors?.name && (
          <p id="name-error" className="text-xs text-destructive">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
        />
        {state.errors?.email && (
          <p id="email-error" className="text-xs text-destructive">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          placeholder={t("messagePlaceholder")}
          defaultValue={state.values?.message}
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={state.errors?.message ? "message-error" : undefined}
        />
        {state.errors?.message && (
          <p id="message-error" className="text-xs text-destructive">
            {state.errors.message}
          </p>
        )}
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden className="hidden">
        <label>
          {t("honeypotLabel")}
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {pending ? t("sending") : t("send")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("preferEmailLead")}{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {site.email}
          </a>
          .
        </p>
      </div>
    </form>
  )
}
