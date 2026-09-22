"use client"

import { useActionState, useState } from "react"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"

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
  cn,
} from "@jamie-nisbet/ui"
import type { FormField, FormSnapshot } from "@jamie-nisbet/services"

import { submitCustomerForm } from "@/app/actions/form"
import {
  answerFieldName,
  type FormPageState,
} from "@/lib/form-answer-schema"

const initialState: FormPageState = { status: "idle" }

// Yes/no as a pair of buttons rather than a checkbox: a required question needs
// "no" to be a real answer, and an unticked box can't say that. Radios under the
// hood, so it is keyboard- and screen-reader-native.
function YesNo({
  name,
  value,
  onChange,
  invalid,
}: {
  name: string
  value: string
  onChange: (next: string) => void
  invalid: boolean
}) {
  return (
    <div
      className="flex gap-2"
      role="radiogroup"
      aria-invalid={invalid || undefined}
    >
      {[
        ["yes", "Yes"],
        ["no", "No"],
      ].map(([option, label]) => (
        <label
          key={option}
          className={cn(
            "inline-flex h-10 min-w-24 cursor-pointer items-center justify-center rounded-sm border px-5 text-sm transition-colors",
            "focus-within:ring-[3px] focus-within:ring-ring/50",
            value === option
              ? "border-primary bg-primary-soft font-medium text-foreground"
              : "border-input hover:bg-accent hover:text-accent-foreground",
            invalid && value === "" && "border-destructive/50"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </div>
  )
}

/** One question of a snapshot, rendered by type. Exported for the public
 *  `/start` intake form, which asks the same questions off the same snapshot
 *  shape — so the two forms can never render a `select` two different ways. */
export function Question({
  field,
  index,
  error,
}: {
  field: FormField
  index: number
  error?: string
}) {
  // Every control is React-controlled, including the plain text ones. React 19
  // resets a `<form action>` once the action resolves — on a validation failure
  // that would wipe answers the customer just spent ten minutes on. State
  // survives the reset; `defaultValue` would not.
  const [value, setValue] = useState("")

  const name = answerFieldName(field.key)
  const id = `q-${field.key}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy =
    [field.hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <li className="grid gap-2 border-t border-border/70 pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id} className="text-base leading-snug font-medium">
          <span className="mr-1.5 font-mono text-xs text-muted-foreground">
            {index + 1}.
          </span>
          {field.label}
        </Label>
        {!field.required ? (
          <span className="font-mono text-2xs tracking-wide text-muted-foreground">
            OPTIONAL
          </span>
        ) : null}
      </div>

      {field.hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {field.hint}
        </p>
      ) : null}

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          name={name}
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
      ) : null}

      {field.type === "text" ? (
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
      ) : null}

      {field.type === "select" ? (
        <Select name={name} value={value} onValueChange={setValue}>
          <SelectTrigger
            id={id}
            className="w-full"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          >
            <SelectValue placeholder="Choose one…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {field.type === "boolean" ? (
        <YesNo
          name={name}
          value={value}
          onChange={setValue}
          invalid={Boolean(error)}
        />
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  )
}

export function CustomerForm({
  token,
  snapshot,
}: {
  token: string
  snapshot: FormSnapshot
}) {
  const [state, formAction, pending] = useActionState(
    submitCustomerForm,
    initialState
  )

  if (state.status === "success") {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>Thank you — that&apos;s everything.</AlertTitle>
        <AlertDescription>
          Your answers are with Jamie. He&apos;ll come back to you shortly, and
          your first call will be about the project rather than the basics.
        </AlertDescription>
      </Alert>
    )
  }

  // The link was spent (or deleted) between loading the page and submitting —
  // rare, but re-rendering the form would invite them to type it all again for
  // nothing.
  if (state.status === "gone") {
    return (
      <Alert variant="info">
        <CircleCheck />
        <AlertTitle>This form has already been submitted.</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      ) : null}

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

      <div className="flex flex-wrap items-center gap-4 border-t border-border/70 pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {pending ? "Sending…" : "Send answers"}
        </Button>
        <p className="text-sm text-muted-foreground">
          You can only submit this once, so have a quick read back first.
        </p>
      </div>
    </form>
  )
}
