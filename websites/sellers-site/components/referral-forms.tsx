"use client"

import { useActionState, useMemo, useState } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@jamie-nisbet/ui"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"

import {
  submitPartnerReferral,
  submitSellerLead,
} from "@/app/actions/referral"
import {
  budgetOptions,
  businessHours,
  type PartnerReferralState,
  type SellerLeadState,
} from "@/lib/referral-schema"

const sellerInitial: SellerLeadState = { status: "idle" }
const partnerInitial: PartnerReferralState = { status: "idle" }

const pad = (n: number) => String(n).padStart(2, "0")

// The next `count` weekdays (Mon–Fri) starting tomorrow, as { value, label }.
// Value is "YYYY-MM-DD" in local time; label is short and human ("Mon, 30 Jun").
function nextBusinessDays(count: number) {
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
        label: cursor.toLocaleDateString(undefined, {
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
function BusinessCallTimePicker({ defaultValue }: { defaultValue?: string }) {
  const [defaultDate, defaultTime] = (defaultValue ?? "").split("T")
  const [date, setDate] = useState(defaultDate ?? "")
  const [time, setTime] = useState(defaultTime ?? "")

  const days = useMemo(() => nextBusinessDays(10), [])
  const times = useMemo(() => businessTimeSlots(), [])

  // Only submit a value once both halves are chosen — half a slot is no slot.
  const value = date && time ? `${date}T${time}` : ""

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="preferredCallTime" value={value} />
      <Select value={date} onValueChange={setDate}>
        <SelectTrigger id="preferredCallTime" className="w-full">
          <SelectValue placeholder="Pick a day" />
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
          <SelectValue placeholder="Pick a time" />
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

function SubmitRow({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending} className="w-fit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
      {pending ? "Sending…" : label}
    </Button>
  )
}

function SellerLeadForm({ defaultReferralCode }: { defaultReferralCode?: string }) {
  const [state, formAction, pending] = useActionState(
    submitSellerLead,
    sellerInitial
  )

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>Lead logged</AlertTitle>
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
        label="Your referral code"
        error={state.errors?.referralCode}
        hint="The code I gave you — it's how the 10% finds you."
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="customerName"
          label="Customer name"
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

        <Field
          id="customerContact"
          label="Customer email or phone"
          error={state.errors?.customerContact}
        >
          <Input
            id="customerContact"
            name="customerContact"
            defaultValue={state.values?.customerContact}
            aria-invalid={Boolean(state.errors?.customerContact)}
            aria-describedby={
              state.errors?.customerContact ? "customerContact-error" : undefined
            }
          />
        </Field>
      </div>

      <Field id="need" label="What do they need?" error={state.errors?.need}>
        <Textarea
          id="need"
          name="need"
          rows={3}
          placeholder="One line — e.g. a one-page site with a contact form for a new café."
          defaultValue={state.values?.need}
          aria-invalid={Boolean(state.errors?.need)}
          aria-describedby={state.errors?.need ? "need-error" : undefined}
        />
      </Field>

      <Field id="budget" label="Rough budget (optional)">
        <Select name="budget" defaultValue={state.values?.budget || undefined}>
          <SelectTrigger id="budget" className="w-full">
            <SelectValue placeholder="Pick a range, or leave it to me" />
          </SelectTrigger>
          <SelectContent>
            {budgetOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        id="preferredCallTime"
        label="Best time to call (optional)"
        error={state.errors?.preferredCallTime}
        hint="Business days, 9am–5pm — pick a slot that suits the customer."
      >
        <BusinessCallTimePicker
          defaultValue={state.values?.preferredCallTime}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="sellerName"
          label="Your name (optional)"
          error={state.errors?.sellerName}
        >
          <Input
            id="sellerName"
            name="sellerName"
            autoComplete="name"
            defaultValue={state.values?.sellerName}
          />
        </Field>

        <Field
          id="sellerEmail"
          label="Your email (optional)"
          error={state.errors?.sellerEmail}
          hint="So I can confirm the lead landed."
        >
          <Input
            id="sellerEmail"
            name="sellerEmail"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.sellerEmail}
            aria-invalid={Boolean(state.errors?.sellerEmail)}
            aria-describedby={
              state.errors?.sellerEmail ? "sellerEmail-error" : undefined
            }
          />
        </Field>
      </div>

      <Honeypot />
      <SubmitRow pending={pending} label="Send lead" />
    </form>
  )
}

function PartnerReferralForm() {
  const [state, formAction, pending] = useActionState(
    submitPartnerReferral,
    partnerInitial
  )

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>Referral received</AlertTitle>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="partnerName"
          label="Your name or business"
          error={state.errors?.partnerName}
        >
          <Input
            id="partnerName"
            name="partnerName"
            autoComplete="organization"
            defaultValue={state.values?.partnerName}
            aria-invalid={Boolean(state.errors?.partnerName)}
            aria-describedby={
              state.errors?.partnerName ? "partnerName-error" : undefined
            }
          />
        </Field>

        <Field
          id="partnerContact"
          label="Your email or phone"
          error={state.errors?.partnerContact}
        >
          <Input
            id="partnerContact"
            name="partnerContact"
            defaultValue={state.values?.partnerContact}
            aria-invalid={Boolean(state.errors?.partnerContact)}
            aria-describedby={
              state.errors?.partnerContact ? "partnerContact-error" : undefined
            }
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="partnerCustomerName"
          label="Customer name"
          error={state.errors?.customerName}
        >
          <Input
            id="partnerCustomerName"
            name="customerName"
            defaultValue={state.values?.customerName}
            aria-invalid={Boolean(state.errors?.customerName)}
            aria-describedby={
              state.errors?.customerName ? "partnerCustomerName-error" : undefined
            }
          />
        </Field>

        <Field
          id="partnerCustomerContact"
          label="Customer email or phone"
          error={state.errors?.customerContact}
        >
          <Input
            id="partnerCustomerContact"
            name="customerContact"
            defaultValue={state.values?.customerContact}
            aria-invalid={Boolean(state.errors?.customerContact)}
            aria-describedby={
              state.errors?.customerContact
                ? "partnerCustomerContact-error"
                : undefined
            }
          />
        </Field>
      </div>

      <Field
        id="partnerNeed"
        label="What do they need?"
        error={state.errors?.need}
      >
        <Textarea
          id="partnerNeed"
          name="need"
          rows={3}
          placeholder="A line on what the customer's after — I'll take it from there."
          defaultValue={state.values?.need}
          aria-invalid={Boolean(state.errors?.need)}
          aria-describedby={state.errors?.need ? "partnerNeed-error" : undefined}
        />
      </Field>

      <Honeypot />
      <SubmitRow pending={pending} label="Send referral" />
    </form>
  )
}

export function ReferralForms({
  defaultReferralCode,
}: {
  defaultReferralCode?: string
}) {
  // Sellers are the primary audience, so open on their tab.
  return (
    <Tabs defaultValue="seller" className="w-full gap-6">
      <TabsList className="w-full">
        <TabsTrigger value="seller">Seller lead</TabsTrigger>
        <TabsTrigger value="partner">Partner referral</TabsTrigger>
      </TabsList>
      <TabsContent value="seller">
        <SellerLeadForm defaultReferralCode={defaultReferralCode} />
      </TabsContent>
      <TabsContent value="partner">
        <PartnerReferralForm />
      </TabsContent>
    </Tabs>
  )
}
