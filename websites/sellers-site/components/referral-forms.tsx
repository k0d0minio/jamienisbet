"use client"

import { useActionState, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@jamie-nisbet/ui"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"

import { submitSellerLead } from "@/app/actions/referral"
import {
  budgetOptions,
  businessHours,
  type SellerLeadState,
} from "@/lib/referral-schema"
import { localeHtmlLang, type Locale } from "@jamie-nisbet/app-shell/i18n"

const sellerInitial: SellerLeadState = { status: "idle" }

const pad = (n: number) => String(n).padStart(2, "0")

// The next `count` weekdays (Mon–Fri) starting tomorrow, as { value, label }.
// Value is "YYYY-MM-DD" in local time; label is short and human, formatted in
// the active locale ("Mon, 30 Jun" / "seg, 30 jun" / "lun. 30 juin").
function nextBusinessDays(count: number, locale: Locale) {
  const days: { value: string; label: string }[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1) // start from tomorrow
  while (days.length < count) {
    const weekday = cursor.getDay()
    if (weekday !== 0 && weekday !== 6) {
      days.push({
        value: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(
          cursor.getDate()
        )}`,
        label: cursor.toLocaleDateString(localeHtmlLang[locale], {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

// Half-hour start times from 09:00 through 16:30 — the last meeting wraps by 5pm.
function businessTimeSlots() {
  const slots: string[] = []
  for (let hour = businessHours.start; hour < businessHours.end; hour++) {
    slots.push(`${pad(hour)}:00`, `${pad(hour)}:30`)
  }
  return slots
}

// Date + time selector confined to business days, 9am–5pm. The two selects are
// combined into one hidden "preferredCallTime" field ("YYYY-MM-DDTHH:mm") that
// the server re-validates. Radix only mounts a Select's items when it opens, so
// the date list (which depends on today) never renders during SSR — no risk of
// a server/client hydration mismatch from generating it inline.
function BusinessCallTimePicker({
  defaultValue,
  locale,
}: {
  defaultValue?: string
  locale: Locale
}) {
  const t = useTranslations("form.callTime")
  const [defaultDate, defaultTime] = (defaultValue ?? "").split("T")
  const [date, setDate] = useState(defaultDate ?? "")
  const [time, setTime] = useState(defaultTime ?? "")

  const days = useMemo(() => nextBusinessDays(10, locale), [locale])
  const times = useMemo(() => businessTimeSlots(), [])

  // Only submit a value once both halves are chosen — half a slot is no slot.
  const value = date && time ? `${date}T${time}` : ""

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="preferredCallTime" value={value} />
      <Select value={date} onValueChange={setDate}>
        <SelectTrigger id="preferredCallTime" className="w-full">
          <SelectValue placeholder={t("pickDay")} />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day.value} value={day.value}>
              {day.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={time} onValueChange={setTime}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("pickTime")} />
        </SelectTrigger>
        <SelectContent>
          {times.map((slot) => (
            <SelectItem key={slot} value={slot}>
              {slot}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Honeypot — hidden from people, tempting to bots. Shared by both forms.
function Honeypot() {
  return (
    <div aria-hidden className="hidden">
      <label>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function SubmitRow({
  pending,
  label,
  submittingLabel,
}: {
  pending: boolean
  label: string
  submittingLabel: string
}) {
  return (
    <Button type="submit" disabled={pending} className="w-fit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
      {pending ? submittingLabel : label}
    </Button>
  )
}

function SellerLeadForm({
  defaultReferralCode,
  locale,
}: {
  defaultReferralCode?: string
  locale: Locale
}) {
  const t = useTranslations("form")
  const [state, formAction, pending] = useActionState(
    submitSellerLead,
    sellerInitial
  )

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>{t("success.title")}</AlertTitle>
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

      <Field
        id="referralCode"
        label={t("referralCode.label")}
        error={state.errors?.referralCode}
        hint={t("referralCode.hint")}
      >
        <Input
          id="referralCode"
          name="referralCode"
          autoComplete="off"
          defaultValue={state.values?.referralCode ?? defaultReferralCode}
          aria-invalid={Boolean(state.errors?.referralCode)}
          aria-describedby={
            state.errors?.referralCode ? "referralCode-error" : undefined
          }
        />
      </Field>

      <Field
        id="customerName"
        label={t("customerName")}
        error={state.errors?.customerName}
      >
        <Input
          id="customerName"
          name="customerName"
          defaultValue={state.values?.customerName}
          aria-invalid={Boolean(state.errors?.customerName)}
          aria-describedby={
            state.errors?.customerName ? "customerName-error" : undefined
          }
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="customerPhone"
          label={t("customerPhone.label")}
          error={state.errors?.customerPhone}
          hint={t("customerPhone.hint")}
        >
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            defaultValue={state.values?.customerPhone}
            aria-invalid={Boolean(state.errors?.customerPhone)}
            aria-describedby={
              state.errors?.customerPhone ? "customerPhone-error" : undefined
            }
          />
        </Field>

        <Field
          id="customerEmail"
          label={t("customerEmail")}
          error={state.errors?.customerEmail}
        >
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.customerEmail}
            aria-invalid={Boolean(state.errors?.customerEmail)}
            aria-describedby={
              state.errors?.customerEmail ? "customerEmail-error" : undefined
            }
          />
        </Field>
      </div>

      <Field
        id="need"
        label={t("need.label")}
        error={state.errors?.need}
      >
        <Textarea
          id="need"
          name="need"
          rows={3}
          placeholder={t("need.placeholder")}
          defaultValue={state.values?.need}
          aria-invalid={Boolean(state.errors?.need)}
          aria-describedby={state.errors?.need ? "need-error" : undefined}
        />
      </Field>

      <Field id="budget" label={t("budget.label")}>
        <Select name="budget" defaultValue={state.values?.budget || undefined}>
          <SelectTrigger id="budget" className="w-full">
            <SelectValue placeholder={t("budget.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {budgetOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`budgetOptions.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        id="preferredCallTime"
        label={t("callTime.label")}
        error={state.errors?.preferredCallTime}
        hint={t("callTime.hint")}
      >
        <BusinessCallTimePicker
          defaultValue={state.values?.preferredCallTime}
          locale={locale}
        />
      </Field>

      <Honeypot />
      <SubmitRow
        pending={pending}
        label={t("submit")}
        submittingLabel={t("submitting")}
      />
    </form>
  )
}

export function ReferralForms({
  defaultReferralCode,
}: {
  defaultReferralCode?: string
}) {
  const locale = useLocale() as Locale
  // This site is for sellers only — a single lead form, no tabs.
  return (
    <SellerLeadForm
      defaultReferralCode={defaultReferralCode}
      locale={locale}
    />
  )
}
