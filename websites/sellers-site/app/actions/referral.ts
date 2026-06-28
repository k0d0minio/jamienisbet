"use server"

import {
  partnerReferralSchema,
  sellerLeadSchema,
  type PartnerReferralField,
  type PartnerReferralState,
  type SellerLeadField,
  type SellerLeadState,
} from "@/lib/referral-schema"

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
  const values = {
    referralCode: field(formData, "referralCode"),
    customerName: field(formData, "customerName"),
    customerContact: field(formData, "customerContact"),
    need: field(formData, "need"),
    budget: field(formData, "budget"),
    preferredCallTime: field(formData, "preferredCallTime"),
    sellerName: field(formData, "sellerName"),
    sellerEmail: field(formData, "sellerEmail"),
    company: field(formData, "company"),
  }

  const parsed = sellerLeadSchema.safeParse(values)

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
      message: "Please fix the highlighted fields.",
      errors,
      values: rest,
    }
  }

  // Honeypot tripped (bot): silently accept, send nothing.
  if (parsed.data.company) {
    return { status: "success", message: "Thanks — that's logged." }
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
    message:
      "Thanks — the lead's logged against your code. I'll take it from here and be in touch.",
  }
}

export async function submitPartnerReferral(
  _prev: PartnerReferralState,
  formData: FormData
): Promise<PartnerReferralState> {
  const values = {
    partnerName: field(formData, "partnerName"),
    partnerContact: field(formData, "partnerContact"),
    customerName: field(formData, "customerName"),
    customerContact: field(formData, "customerContact"),
    need: field(formData, "need"),
    company: field(formData, "company"),
  }

  const parsed = partnerReferralSchema.safeParse(values)

  if (!parsed.success) {
    const errors: PartnerReferralState["errors"] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && key !== "company") {
        const f = key as PartnerReferralField
        if (!errors[f]) errors[f] = issue.message
      }
    }
    const { company, ...rest } = values
    void company // honeypot — never echoed back to the form
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors,
      values: rest,
    }
  }

  if (parsed.data.company) {
    return { status: "success", message: "Thanks — that's logged." }
  }

  if (!process.env.RESEND_API_KEY) {
    console.info("[referral] partner referral (not sent — RESEND_API_KEY unset):", {
      ...parsed.data,
      company: undefined,
    })
  }

  return {
    status: "success",
    message:
      "Thanks — your referral's in. I'll reach out to the customer and keep you posted.",
  }
}
