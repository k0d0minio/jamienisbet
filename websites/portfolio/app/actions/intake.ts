"use server"

import { Resend } from "resend"
import { getLocale, getTranslations } from "next-intl/server"
import {
  createClientFromIntake,
  createFormLink,
  saveFormLinkAnswers,
  type FormAnswers,
} from "@jamie-nisbet/services"
import { EMAIL_TEMPLATE_IDS } from "@jamie-nisbet/ui/emails/template-ids"

import { answerFieldName, makeAnswerSchema } from "@/lib/form-answer-schema"
import { INTAKE_FORM_SLUG, loadIntakeForm } from "@/lib/icm-board"
import {
  makeIdentitySchema,
  type IntakeMessages,
  type IntakeState,
} from "@/lib/intake-schema"
import type { ServiceId } from "@/lib/services"

// Submitting the free-look intake (`/start`).
//
// One submit, two rows: a `biz.clients` row (source portfolio, the lead's own
// words in `intake_message`) and a *completed* `biz.form_links` row carrying the
// questionnaire snapshot and the answers — so the lead lands on the dashboard
// exactly as if Jamie had sent them the form by link and they had answered it,
// and `/client <name>` in icm-board can snapshot the answers into the deal
// folder from the same Forms card. Nothing else happens: no folder is created,
// no message is sent to the lead, and the notification email to Jamie is a
// convenience that fails without failing the submit.
//
// The questionnaire is re-read here rather than trusted from the page, the
// same way `/f/[token]` re-reads its link: the markdown in icm-board is the
// authority on what was asked, so validation can't be talked out of a required
// question by a doctored POST.

const TO_EMAIL = "jamie.nisbet@outlook.be"
const FROM_EMAIL = "Jamie Nisbet Consultancy <noreply@mail.jamienisbet.com>"
const NOTIFICATION_TEMPLATE_ID = EMAIL_TEMPLATE_IDS.contactFormNotification

/** The "done looks like" answer → the locale-invariant service id the row
 *  stores, matched on the option's opening words so a reworded option in the
 *  markdown degrades to "no service" rather than a wrong one. */
function serviceFor(answer: string | boolean | null): ServiceId | null {
  if (typeof answer !== "string") return null
  const a = answer.toLowerCase()
  if (a.startsWith("a page or site")) return "landingPages"
  if (a.startsWith("a tool")) return "software"
  if (a.startsWith("a process")) return "automation"
  return null
}

/** The language question → the row's `language`, falling back to the locale
 *  the visitor filled the form in. */
function languageFor(answer: string | boolean | null, locale: string): string {
  if (typeof answer === "string") {
    const a = answer.toLowerCase()
    if (a.startsWith("english")) return "en"
    if (a.startsWith("fran")) return "fr"
    if (a.startsWith("portugu")) return "pt"
  }
  return locale === "fr" || locale === "pt" ? locale : "en"
}

function asText(answer: string | boolean | null): string | null {
  if (typeof answer === "boolean") return answer ? "Yes" : "No"
  return answer && answer.trim() !== "" ? answer.trim() : null
}

export async function submitIntake(
  _prev: IntakeState,
  formData: FormData
): Promise<IntakeState> {
  const t = await getTranslations("start")
  const locale = await getLocale()
  const messages = t.raw("errors") as IntakeMessages & { fixFields: string; failed: string }

  const snapshot = await loadIntakeForm()
  if (!snapshot) {
    return { status: "error", message: messages.failed }
  }

  const identity = makeIdentitySchema(messages).safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
  })

  const values: Record<string, string> = {}
  for (const field of snapshot.fields) {
    values[field.key] = String(formData.get(answerFieldName(field.key)) ?? "")
  }
  const answers = makeAnswerSchema(snapshot).safeParse(values)

  if (!identity.success || !answers.success) {
    const errors: Record<string, string> = {}
    for (const issue of identity.success ? [] : identity.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !errors[key]) errors[key] = issue.message
    }
    for (const issue of answers.success ? [] : answers.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !errors[key]) errors[key] = issue.message
    }
    return { status: "error", message: messages.fixFields, errors }
  }

  // Honeypot tripped: a bot. Say thanks, store nothing.
  if (identity.data.company) return { status: "success" }

  const data: FormAnswers = answers.data
  const eatsTheWeek = asText(data["eats_the_week"] ?? null)
  const business = asText(data["business"] ?? null)

  try {
    const client = await createClientFromIntake({
      name: identity.data.name,
      email: identity.data.email,
      phone: identity.data.phone || null,
      // The lead's own words, where the contact form's message would be: what
      // eats the week, with what the business is when they said it.
      intakeMessage: [eatsTheWeek, business ? `(${business})` : null]
        .filter(Boolean)
        .join(" "),
      service: serviceFor(data["done_looks_like"] ?? null),
      budget: asText(data["budget"] ?? null),
      language: languageFor(data["language"] ?? null, locale),
    })
    const link = await createFormLink({
      clientId: client.id,
      formSlug: INTAKE_FORM_SLUG,
      formSnapshot: snapshot,
    })
    await saveFormLinkAnswers(link.id, data)
  } catch (err) {
    console.error("[start] DB write failed:", err)
    return { status: "error", message: messages.failed }
  }

  // The notice to Jamie — same template as the contact form, non-fatal: the
  // lead is safe in Neon before this line runs.
  if (process.env.RESEND_API_KEY && NOTIFICATION_TEMPLATE_ID) {
    const digest = snapshot.fields
      .map((f) => `${f.label}\n${asText(data[f.key] ?? null) ?? "—"}`)
      .join("\n\n")
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        replyTo: identity.data.email,
        template: {
          id: NOTIFICATION_TEMPLATE_ID,
          variables: {
            SUBJECT: `Free look requested by ${identity.data.name}`,
            NAME: identity.data.name,
            EMAIL: identity.data.email,
            SERVICE: "Free look (/start)",
            MESSAGE: identity.data.phone ? `Phone: ${identity.data.phone}\n\n${digest}` : digest,
          },
        },
      })
      if (error) console.error("[start] Resend send failed:", error)
    } catch (err) {
      console.error("[start] Resend send failed:", err)
    }
  } else {
    console.info("[start] intake received (email not sent — Resend not configured):", {
      name: identity.data.name,
      email: identity.data.email,
    })
  }

  return { status: "success" }
}
