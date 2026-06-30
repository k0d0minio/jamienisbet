"use server"

import { Resend } from "resend"
import { getTranslations } from "next-intl/server"

import {
  makeContactSchema,
  type ContactMessages,
  type ContactState,
} from "@/lib/contact-schema"

// Hardcoded for now — only the API key comes from the environment. We can move
// these into env vars later (see .env.example).
const TO_EMAIL = "jamie.nisbet@outlook.be"
const FROM_EMAIL = "Jamie Nisbet Consultancy <noreply@mail.jamienisbet.com>"

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Runs in request context, so next-intl resolves the active locale.
  const t = await getTranslations("form")
  const schema = makeContactSchema(t.raw("errors") as ContactMessages)

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""),
  }

  const parsed = schema.safeParse(values)

  if (!parsed.success) {
    const errors: ContactState["errors"] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if ((key === "name" || key === "email" || key === "message") && !errors[key]) {
        errors[key] = issue.message
      }
    }
    return {
      status: "error",
      message: t("errors.fixFields"),
      errors,
      values: { name: values.name, email: values.email, message: values.message },
    }
  }

  // Honeypot tripped (bot): silently accept, send nothing.
  if (parsed.data.company) {
    return { status: "success", message: t("status.successShort") }
  }

  if (!process.env.RESEND_API_KEY) {
    // No key configured — log so nothing is lost while testing locally.
    console.info("[contact] received (not sent — RESEND_API_KEY unset):", parsed.data)
    return { status: "success", message: t("status.success") }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: parsed.data.email,
    subject: `New enquiry from ${parsed.data.name}`,
    text: [
      `Name: ${parsed.data.name}`,
      `Email: ${parsed.data.email}`,
      "",
      parsed.data.message,
    ].join("\n"),
  })

  if (error) {
    console.error("[contact] Resend send failed:", error)
    return {
      status: "error",
      message: t("status.sendFailed"),
      values: { name: values.name, email: values.email, message: values.message },
    }
  }

  return { status: "success", message: t("status.success") }
}
