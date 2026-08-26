"use client"

import { useActionState, useState, useSyncExternalStore } from "react"
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
import { CircleCheck, LoaderCircle, Send, TriangleAlert, X } from "lucide-react"

import { submitContact } from "@/app/actions/contact"
import { site } from "@/lib/site"
import type { ContactState } from "@/lib/contact-schema"
import { isServiceId, type ServiceId } from "@/lib/services"

const initialState: ContactState = { status: "idle" }

// The Services section links here with ?service=<id>. Read it from the URL via
// useSyncExternalStore so it works without a useSearchParams Suspense boundary
// (the form stays in the static HTML) and hydrates cleanly: null on the server,
// the real value on the client. It never changes after load, so subscribe is a
// no-op.
const subscribe = () => () => {}
const getServiceParam = () =>
  new URLSearchParams(window.location.search).get("service")
const getServiceServerParam = () => null

export function ContactForm() {
  const t = useTranslations("form")
  const tServices = useTranslations("services")
  const [state, formAction, pending] = useActionState(submitContact, initialState)

  // The picked service is reflected back to the visitor and carried into the
  // email via the hidden field below. Untrusted, so only a known id is kept; the
  // "Clear" button lets the visitor drop it.
  const [cleared, setCleared] = useState(false)
  const param = useSyncExternalStore(
    subscribe,
    getServiceParam,
    getServiceServerParam
  )
  const service: ServiceId | null =
    !cleared && isServiceId(param) ? param : null

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

      {service && (
        <>
          <input type="hidden" name="service" value={service} />
          <div className="flex items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary-soft px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("serviceLabel")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {tServices(`items.${service}.title`)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCleared(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <X className="size-3.5" />
              {t("serviceClear")}
            </button>
          </div>
        </>
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
