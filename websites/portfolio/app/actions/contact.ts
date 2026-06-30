"use server"

import { Resend } from "resend"

import { contactSchema, type ContactState } from "@/lib/contact-schema"

// Hardcoded for now — only the API key comes from the environment. We can move
// these into env vars later (see .env.example).
const TO_EMAIL = "jamie.nisbet@outlook.be"
const FROM_EMAIL = "Jamie Nisbet Consultancy <noreply@mail.jamienisbet.com>"

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""),
  }

  const parsed = contactSchema.safeParse(values)

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
      message: "Please fix the highlighted fields.",
      errors,
      values: { name: values.name, email: values.email, message: values.message },
    }
  }

  // Honeypot tripped (bot): silently accept, send nothing.
  if (parsed.data.company) {
    return { status: "success", message: "Thanks — I'll be in touch soon." }
  }

  if (!process.env.RESEND_API_KEY) {
    // No key configured — log so nothing is lost while testing locally.
    console.info("[contact] received (not sent — RESEND_API_KEY unset):", parsed.data)
    return {
      status: "success",
      message: "Thanks — your message is in. I'll get back to you within a day or two.",
    }
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
      message: "Something went wrong sending your message. Please try again, or email me directly.",
      values: { name: values.name, email: values.email, message: values.message },
    }
  }

  return {
    status: "success",
    message: "Thanks — your message is in. I'll get back to you within a day or two.",
  }
}
