import { z } from "zod"

// Shared by the client forms (types + light hints) and the server actions
// (authoritative validation). No "use server" here so the types can be
// imported into client components safely.

// Rough budget options for the seller lead form (optional — sellers often
// won't know yet). Kept as a closed list so it's clean in the inbox.
export const budgetOptions = [
  "Not sure yet",
  "~€200 — landing page",
  "€500–€1,000",
  "€1,000–€5,000",
  "€5,000+",
] as const

const customerContact = z
  .string()
  .trim()
  .min(5, "An email or phone number so I can reach them.")
  .max(200)

const need = z
  .string()
  .trim()
  .min(10, "One line on what they need, please.")
  .max(2000, "That's a lot — trim it to the essentials.")

// ---- Seller lead -----------------------------------------------------------
export const sellerLeadSchema = z.object({
  // The payout key — without it the 10% can't be attributed.
  referralCode: z
    .string()
    .trim()
    .min(2, "Your referral code — it's what ties the payout to you.")
    .max(40),
  customerName: z.string().trim().min(2, "The customer's name, please.").max(120),
  customerContact,
  need,
  budget: z.enum(budgetOptions).optional().or(z.literal("")),
  // Optional — so I can confirm the lead landed with the right seller.
  sellerName: z.string().trim().max(120).optional(),
  sellerEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "That email doesn't look right.",
    })
    .optional(),
  // Honeypot: real people leave this empty.
  company: z.string().max(0).optional(),
})

export type SellerLeadInput = z.infer<typeof sellerLeadSchema>
export type SellerLeadField =
  | "referralCode"
  | "customerName"
  | "customerContact"
  | "need"
  | "budget"
  | "sellerName"
  | "sellerEmail"

export type SellerLeadState = {
  status: "idle" | "success" | "error"
  message?: string
  errors?: Partial<Record<SellerLeadField, string>>
  values?: Partial<Record<SellerLeadField, string>>
}

// ---- Partner referral ------------------------------------------------------
export const partnerReferralSchema = z.object({
  partnerName: z.string().trim().min(2, "Your name or business, please.").max(120),
  partnerContact: z
    .string()
    .trim()
    .min(5, "An email or phone so I can reach you about the referral.")
    .max(200),
  customerName: z.string().trim().min(2, "The customer's name, please.").max(120),
  customerContact,
  need,
  // Honeypot.
  company: z.string().max(0).optional(),
})

export type PartnerReferralInput = z.infer<typeof partnerReferralSchema>
export type PartnerReferralField =
  | "partnerName"
  | "partnerContact"
  | "customerName"
  | "customerContact"
  | "need"

export type PartnerReferralState = {
  status: "idle" | "success" | "error"
  message?: string
  errors?: Partial<Record<PartnerReferralField, string>>
  values?: Partial<Record<PartnerReferralField, string>>
}
