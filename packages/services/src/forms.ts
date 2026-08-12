// The shape of a published questionnaire — the contract between the two apps.
//
// Questions are content and live in git (`.icm/onboarding/<slug>.md`, convention
// in that folder's README); answers are business state and live in Neon. The
// bridge between them is the *snapshot*: clicking "Send form" on a lead parses
// the markdown at that moment and freezes the result into
// `biz.form_links.form_snapshot`, so a link renders — and its answers stay
// readable against — exactly the questions that were asked, however the markdown
// is edited afterwards.
//
// The admin dashboard writes these types (its parser produces a FormSnapshot);
// the portfolio reads them (its public page renders one and validates answers
// against it). Neither app owns the shape, which is why it lives here.

/** The whole vocabulary. Four field types, deliberately — no conditional logic,
 * no uploads. A form that needs more than this isn't a job for this tool. */
export const formFieldTypes = ["text", "textarea", "select", "boolean"] as const
export type FormFieldType = (typeof formFieldTypes)[number]

export function isFormFieldType(value: string): value is FormFieldType {
  return (formFieldTypes as readonly string[]).includes(value)
}

export type FormField = {
  /** Stable identifier the answer is stored under. From the question's `key:`
   * line, or the slugified heading when it has none. */
  key: string
  /** The question, worded exactly as the customer sees it (the `##` heading). */
  label: string
  type: FormFieldType
  /** Questions are required by default; `optional: yes` relaxes one. */
  required: boolean
  /** Helper text under the field, or null. */
  hint: string | null
  /** `select` only — the permitted choices, in author order. Null elsewhere. */
  options: string[] | null
}

export type FormSnapshot = {
  /** The markdown filename without `.md` — what was sent, for the record. */
  slug: string
  title: string
  intro: string
  fields: FormField[]
}

/**
 * What the customer sent back, keyed by `FormField.key`.
 *
 * `boolean` fields store a real boolean; everything else stores a string. An
 * unanswered optional field is null rather than absent, so a completed form
 * always has an entry per question it asked — a key missing from the map means
 * the question was never asked, not that it was skipped.
 */
export type FormAnswers = Record<string, string | boolean | null>

/** A question with the answer that came back — what the lead's profile lists.
 * Built by zipping a snapshot's fields against its answers, so the display is
 * always ordered by the form rather than by JSON key order. */
export type AnsweredField = FormField & {
  answer: string | boolean | null
}

export function zipAnswers(
  snapshot: FormSnapshot,
  answers: FormAnswers | null
): AnsweredField[] {
  return snapshot.fields.map((field) => ({
    ...field,
    answer: answers?.[field.key] ?? null,
  }))
}
