"use server"

import { contactSchema, type ContactState } from "@/lib/contact-schema"

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

  // ----------------------------------------------------------------------
  // TODO(send-later): deliver the enquiry via Resend.
  //
  // The form is fully built; sending is intentionally deferred until
  // RESEND_API_KEY is configured (see .env.example). This honours the repo
  // rule "no outbound action without review" — nothing leaves the server yet.
  //
  //   import { Resend } from "resend"
  //   const resend = new Resend(process.env.RESEND_API_KEY)
  //   await resend.emails.send({
  //     from: process.env.CONTACT_FROM_EMAIL!,
  //     to: process.env.CONTACT_TO_EMAIL!,
  //     replyTo: parsed.data.email,
  //     subject: `New enquiry from ${parsed.data.name}`,
  //     text: parsed.data.message,
  //   })
  // ----------------------------------------------------------------------

  if (!process.env.RESEND_API_KEY) {
    // Not wired yet — log so nothing is lost while testing locally.
    console.info("[contact] received (not sent — RESEND_API_KEY unset):", parsed.data)
  }

  return {
    status: "success",
    message: "Thanks — your message is in. I'll get back to you within a day or two.",
  }
}
