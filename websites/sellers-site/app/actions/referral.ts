"use server"

import { Resend } from "resend"

import { getLocale, getTranslations } from "next-intl/server"
import { createClientFromReferral } from "@jamie-nisbet/services"
import { EMAIL_TEMPLATE_IDS } from "@jamie-nisbet/ui/emails/template-ids"

import {
  makeSellerLeadSchema,
  type SellerLeadField,
  type SellerLeadMessages,
  type SellerLeadState,
} from "@/lib/referral-schema"

// Hardcoded for now — only the API key comes from the environment. We can move
// these into env vars later (see .env.example).
const TO_EMAIL = "jamie.nisbet@outlook.be"
const FROM_EMAIL = "Jamie Nisbet Consultancy <noreply@mail.jamienisbet.com>"

const REFERRAL_NOTIFICATION_TEMPLATE_ID = EMAIL_TEMPLATE_IDS.referralLeadNotification

const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "")

export async function submitSellerLead(
  _prev: SellerLeadState,
  formData: FormData
): Promise<SellerLeadState> {
  // Validate and respond in the seller's chosen language.
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "form" })
  const schema = makeSellerLeadSchema(t.raw("errors") as SellerLeadMessages)

  const values = {
    referralCode: field(formData, "referralCode"),
    customerName: field(formData, "customerName"),
    customerPhone: field(formData, "customerPhone"),
    customerEmail: field(formData, "customerEmail"),
    need: field(formData, "need"),
    budget: field(formData, "budget"),
    preferredCallTime: field(formData, "preferredCallTime"),
    company: field(formData, "company"),
  }

  const parsed = schema.safeParse(values)

  if (!parsed.success) {
    const errors: SellerLeadState["errors"] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && key !== "company") {
        const f = key as SellerLeadField
        if (!errors[f]) errors[f] = issue.message
      }
    }
    const { company, ...rest } = values
    void company // honeypot — never echoed back to the form
    return {
      status: "error",
      message: t("errorBanner"),
      errors,
      values: rest,
    }
  }

  // Honeypot tripped (bot): silently accept, send nothing.
  if (parsed.data.company) {
    return { status: "success", message: t("botSuccess") }
  }

  const { company: _company, ...lead } = parsed.data
  void _company // honeypot — never forwarded

  // The database is the source of truth — create the client first. If this fails
  // we don't lose it: we fall through to the email notification below and only
  // then treat a failed email as fatal.
  let persisted = false
  try {
    await createClientFromReferral({
      referralCode: lead.referralCode,
      customerName: lead.customerName,
      customerPhone: lead.customerPhone,
      customerEmail: lead.customerEmail || null,
      need: lead.need,
      budget: lead.budget || null,
      preferredCallTime: lead.preferredCallTime || null,
    })
    persisted = true
  } catch (err) {
    console.error("[referral] DB write failed — falling back to email only:", err)
  }

  if (!process.env.RESEND_API_KEY || !REFERRAL_NOTIFICATION_TEMPLATE_ID) {
    // No key/template configured — log so nothing is lost while testing locally.
    console.info(
      "[referral] seller lead (email not sent — RESEND_API_KEY unset, or referralLeadNotification is missing an ID in packages/ui/emails/template-ids.ts):",
      lead
    )
    return {
      status: "success",
      message: t("success.message"),
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: lead.customerEmail || undefined,
    template: {
      id: REFERRAL_NOTIFICATION_TEMPLATE_ID,
      variables: {
        SUBJECT: `New referral — ${lead.customerName} (code: ${lead.referralCode})`,
        REFERRAL_CODE: lead.referralCode,
        CUSTOMER_NAME: lead.customerName,
        CUSTOMER_PHONE: lead.customerPhone,
        CUSTOMER_EMAIL: lead.customerEmail || "—",
        BUDGET: lead.budget || "—",
        PREFERRED_CALL_TIME: lead.preferredCallTime || "—",
        NEED: lead.need,
      },
    },
  })

  if (error) {
    console.error("[referral] Resend send failed:", error)
    // The lead is safe in the database — the email is only a notification, so a
    // send failure is non-fatal. Only surface an error if nothing was persisted.
    if (!persisted) {
      const { company, ...rest } = values
      void company
      return {
        status: "error",
        message: t("errorBanner"),
        values: rest,
      }
    }
  }

  return {
    status: "success",
    message: t("success.message"),
  }
}
