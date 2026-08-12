"use server"

import {
  getFormLink,
  saveFormLinkAnswers,
  touchClient,
} from "@jamie-nisbet/services"

import {
  answerFieldName,
  makeAnswerSchema,
  type FormPageState,
} from "@/lib/form-answer-schema"

// Submitting a customer questionnaire.
//
// The link row is re-read here rather than trusted from the page: the snapshot
// it carries is the authority on what was asked, so validation can't be talked
// out of a required field by a doctored POST, and only the questions actually
// on that form are read out of the FormData at all.

const GONE =
  "This form has already been submitted, or the link is no longer valid."

export async function submitCustomerForm(
  _prev: FormPageState,
  formData: FormData
): Promise<FormPageState> {
  const token = String(formData.get("token") ?? "")
  const link = await getFormLink(token)
  if (!link || link.completedAt !== null) {
    return { status: "gone", message: GONE }
  }

  const snapshot = link.formSnapshot
  const values: Record<string, string> = {}
  for (const field of snapshot.fields) {
    values[field.key] = String(formData.get(answerFieldName(field.key)) ?? "")
  }

  const parsed = makeAnswerSchema(snapshot).safeParse(values)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "")
      // First issue per question — a field with two complaints only has room
      // for one line under it, and the first is the one they hit.
      if (key && !errors[key]) errors[key] = issue.message
    }
    return {
      status: "error",
      message: "Almost there — a couple of answers need a look.",
      errors,
    }
  }

  // The `completed_at is null` guard lives in the update itself, so a
  // double-submit can only land once: the loser matches no row and is told the
  // form is spent rather than quietly overwriting the answers that won.
  const saved = await saveFormLinkAnswers(link.id, parsed.data)
  if (!saved) return { status: "gone", message: GONE }

  // Answers arriving is activity on the relationship — it moves the lead back
  // down the dashboard's longest-waiting-first sort, same as a call or an edit.
  await touchClient(link.clientId)

  return { status: "success" }
}
