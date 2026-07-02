"use server"

import { Resend } from "resend"
import { getTranslations } from "next-intl/server"
import { createClientFromContact } from "@jamie-nisbet/services"
import { EMAIL_TEMPLATE_IDS } from "@jamie-nisbet/ui/emails/template-ids"

import {
  makeContactSchema,
  type ContactMessages,
  type ContactState,
} from "@/lib/contact-schema"
import { isServiceId } from "@/lib/services"

// Hardcoded for now — only the API key comes from the environment. We can move
// these into env vars later (see .env.example).
const TO_EMAIL = "jamie.nisbet@outlook.be"
const FROM_EMAIL = "Jamie Nisbet Consultancy <noreply@mail.jamienisbet.com>"

const CONTACT_NOTIFICATION_TEMPLATE_ID = EMAIL_TEMPLATE_IDS.contactFormNotification

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

  // The Services section sends along which service the visitor clicked. It's an
  // id from an untrusted field, so map it to its title (only if known) for the
  // email; unknown/absent → just a plain enquiry.
  const serviceId = String(formData.get("service") ?? "")
  let serviceLabel: string | null = null
  if (isServiceId(serviceId)) {
    const tServices = await getTranslations("services")
    serviceLabel = tServices(`items.${serviceId}.title`)
  }

  // The database is the source of truth — create the client first. If this fails
  // we don't lose the enquiry: we fall through to the email notification below,
  // and only then treat a failed email as fatal.
  let persisted = false
  try {
    await createClientFromContact({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      source: "portfolio",
      // Store the locale-invariant id (not the translated label) so it's stable.
      service: isServiceId(serviceId) ? serviceId : null,
    })
    persisted = true
  } catch (err) {
    console.error("[contact] DB write failed — falling back to email only:", err)
  }

  if (!process.env.RESEND_API_KEY || !CONTACT_NOTIFICATION_TEMPLATE_ID) {
    // No key/template configured — log so nothing is lost while testing locally.
    console.info(
      "[contact] received (email not sent — RESEND_API_KEY unset, or contactFormNotification is missing an ID in packages/ui/emails/template-ids.ts):",
      { ...parsed.data, service: serviceLabel }
    )
    return { status: "success", message: t("status.success") }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: parsed.data.email,
    template: {
      id: CONTACT_NOTIFICATION_TEMPLATE_ID,
      variables: {
        SUBJECT: serviceLabel
          ? `New enquiry (${serviceLabel}) from ${parsed.data.name}`
          : `New enquiry from ${parsed.data.name}`,
        NAME: parsed.data.name,
        EMAIL: parsed.data.email,
        SERVICE: serviceLabel ?? "General enquiry",
        MESSAGE: parsed.data.message,
      },
    },
  })

  if (error) {
    console.error("[contact] Resend send failed:", error)
    // The lead is safe in the database — the email is only a notification, so a
    // send failure is non-fatal. Only surface an error if nothing was persisted.
    if (!persisted) {
      return {
        status: "error",
        message: t("status.sendFailed"),
        values: { name: values.name, email: values.email, message: values.message },
      }
    }
  }

  return { status: "success", message: t("status.success") }
}
