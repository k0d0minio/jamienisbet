"use server"

import {
  makeSellerLeadSchema,
  type SellerLeadField,
  type SellerLeadState,
} from "@/lib/referral-schema"
import { getDictionary, getLocale } from "@/lib/i18n"

// ----------------------------------------------------------------------------
// TODO(send-later): deliver each submission to lead-generation.
//
// Both forms are fully built and validated; delivery is intentionally deferred
// until a target is configured and reviewed. This honours the repo rule
// "no outbound action without review" — nothing leaves the server yet. When
// ready, send the parsed payload (e.g. via Resend to LEAD_TO_EMAIL, or write a
// lead file into workspaces/lead-generation/) here, keeping the referral code
// intact so attribution carries through to payout.
//
//   import { Resend } from "resend"
//   const resend = new Resend(process.env.RESEND_API_KEY)
//   await resend.emails.send({
//     from: process.env.LEAD_FROM_EMAIL!,
//     to: process.env.LEAD_TO_EMAIL!,
//     subject: `New referral — ${parsed.data.customerName}`,
//     text: JSON.stringify(parsed.data, null, 2),
//   })
// ----------------------------------------------------------------------------

const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "")

export async function submitSellerLead(
  _prev: SellerLeadState,
  formData: FormData
): Promise<SellerLeadState> {
  // Validate and respond in the seller's chosen language.
  const dict = await getDictionary(await getLocale())
  const t = dict.form
  const schema = makeSellerLeadSchema(t.errors)

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
      message: t.errorBanner,
      errors,
      values: rest,
    }
  }

  // Honeypot tripped (bot): silently accept, send nothing.
  if (parsed.data.company) {
    return { status: "success", message: t.botSuccess }
  }

  if (!process.env.RESEND_API_KEY) {
    // Not wired yet — log so nothing is lost while testing locally.
    console.info("[referral] seller lead (not sent — RESEND_API_KEY unset):", {
      ...parsed.data,
      company: undefined,
    })
  }

  return {
    status: "success",
    message: t.success.message,
  }
}
