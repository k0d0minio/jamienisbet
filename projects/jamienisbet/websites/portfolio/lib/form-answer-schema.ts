import { z } from "zod"

import type { FormField, FormSnapshot } from "@jamie-nisbet/services"

// Validation for a customer questionnaire, built from the link's own snapshot.
//
// There is no fixed schema here the way there is for the contact form: the
// questions were frozen when the link was sent, so the rules are derived from
// them at submit time. Whatever the markdown said *then* is what this enforces
// now — which is the same guarantee from the other side as "editing the file
// never changes a form already in someone's inbox".
//
// Copy is in English only, deliberately: questionnaires are authored in one
// language, so the page skips the locale machinery the rest of the site uses.

/** Generous but bounded — a wall of text is a bug or an attack, not an answer.
 * Matches the contact form's 4000 for prose. */
export const MAX_TEXT = 500
export const MAX_TEXTAREA = 4000

const REQUIRED = "This one's needed."
const PICK_ONE = "Pick one of the options."
const YES_OR_NO = "Pick yes or no."
const tooLong = (max: number) => `Please keep this under ${max} characters.`

/** The form field name an answer is posted under. Prefixed so a question whose
 * key happens to be "token" can't shadow the link token. */
export function answerFieldName(key: string): string {
  return `answer:${key}`
}

function fieldSchema(field: FormField) {
  if (field.type === "boolean") {
    // Posted by a yes/no pair rather than a checkbox: an unticked checkbox can't
    // tell "no" apart from "didn't answer", which is exactly the distinction a
    // required yes/no question exists to capture.
    return z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "yes" || value === "no" || (!field.required && value === ""),
        YES_OR_NO
      )
      .transform((value): string | boolean | null =>
        value === "yes" ? true : value === "no" ? false : null
      )
  }

  if (field.type === "select") {
    // The snapshot's options are the only accepted values — a hand-crafted POST
    // can't smuggle an answer the customer was never offered.
    const allowed = new Set(field.options ?? [])
    return z
      .string()
      .trim()
      .refine(
        (value) => (value === "" ? !field.required : allowed.has(value)),
        PICK_ONE
      )
      .transform((value): string | boolean | null => (value === "" ? null : value))
  }

  const max = field.type === "textarea" ? MAX_TEXTAREA : MAX_TEXT
  return z
    .string()
    .trim()
    .max(max, tooLong(max))
    .refine((value) => !field.required || value.length > 0, REQUIRED)
    .transform((value): string | boolean | null => (value === "" ? null : value))
}

/**
 * A Zod object keyed by answer key, parsing raw form strings into the stored
 * `FormAnswers` shape. Unanswered optional questions come out as null rather
 * than absent, so a completed form always carries one entry per question it
 * asked.
 */
export function makeAnswerSchema(snapshot: FormSnapshot) {
  const shape: Record<string, ReturnType<typeof fieldSchema>> = {}
  for (const field of snapshot.fields) {
    shape[field.key] = fieldSchema(field)
  }
  return z.object(shape)
}

export type FormPageState = {
  /** `gone` is the link being spent or unknown — the page swaps to a dead-end
   * rather than re-rendering a form that can no longer be submitted. */
  status: "idle" | "success" | "error" | "gone"
  message?: string
  /** Keyed by answer key, first issue per question. What they typed is *not*
   * echoed back — the form's controls are React-controlled and hold their own
   * values across a failed submit, so round-tripping them would be dead weight
   * on every response. */
  errors?: Record<string, string>
}
