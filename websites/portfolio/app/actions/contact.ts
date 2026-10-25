"use server"

import { Resend } from "resend"
import { getLocale, getTranslations } from "next-intl/server"
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

// A slow desk must not hold the form: past this, the call counts as failed.
const POOL_TIMEOUT_MS = 5000

/** Post the lead to the desk's pool (house `desk/app/app/api/pool/route.ts`).
 *  The desk stores it as a prospect Jamie sourced, at `new`. 201 is a new row;
 *  422 is an open prospect with the same email, so the lead is already there.
 *  Both mean the lead is safe. Never throws — every failure is logged and
 *  reported as `false`, so the mail below still goes. */
async function postToPool(lead: {
  name: string
  email: string
  message: string
  language: string
}): Promise<boolean> {
  const url = process.env.DESK_POOL_URL
  const token = process.env.DESK_POOL_TOKEN
  if (!url || !token) {
    console.info("[contact] pool not called — DESK_POOL_URL or DESK_POOL_TOKEN unset")
    return false
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(POOL_TIMEOUT_MS),
      cache: "no-store",
    })
    if (res.status === 201 || res.status === 422) return true
    console.error("[contact] pool POST failed — falling back to email only:", res.status, await res.text())
  } catch (err) {
    console.error("[contact] pool POST failed — falling back to email only:", err)
  }
  return false
}

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

  // The desk's pool is the lead's one home — post it first. If this fails we
  // don't lose the enquiry: we fall through to the email notification below,
  // and only then treat a failed email as fatal. The service stays in the mail.
  const persisted = await postToPool({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    language: await getLocale(),
  })

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
    // The lead is safe in the pool — the email is only a notification, so a
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
