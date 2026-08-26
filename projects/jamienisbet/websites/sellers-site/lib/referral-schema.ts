import { z } from "zod"

// Shared by the client forms (types + light hints) and the server actions
// (authoritative validation). No "use server" here so the types can be
// imported into client components safely.
//
// Validation messages are injected per request so they can be localised — the
// server action builds the schema with the active locale's strings (see
// makeSellerLeadSchema). The values submitted (e.g. budget) stay canonical
// English so the inbox is consistent regardless of the seller's language.

// Rough budget options for the seller lead form (optional — sellers often
// won't know yet). Canonical values, kept as a closed list so it's clean in the
// inbox; the form shows a translated label for each (see dict.form.budgetOptions).
export const budgetOptions = [
  "Not sure yet",
  "~€200 — landing page",
  "€500–€1,000",
  "€1,000–€5,000",
  "€5,000+",
] as const

// The localisable validation messages — shape matches dict.form.errors.
export type SellerLeadMessages = {
  referralCodeMin: string
  customerNameMin: string
  phoneMin: string
  phoneInvalid: string
  emailInvalid: string
  needMin: string
  needMax: string
  slotInvalid: string
}

// ---- Preferred call time (business days, 9am–5pm) --------------------------
// The selector only ever offers valid slots, but the server re-checks: never
// trust the client. A slot is "YYYY-MM-DDTHH:mm" — a weekday, on the hour or
// half-hour, with a start time inside business hours (last slot starts 16:30).
export const businessHours = { start: 9, end: 17 } as const

const slotPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function isBusinessSlot(value: string): boolean {
  if (!slotPattern.test(value)) return false
  const [datePart, timePart] = value.split("T")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)

  // Build the date in local time and confirm the parts round-trip (rejects
  // impossible dates like 2026-02-31, which Date would silently roll over).
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }

  const weekday = date.getDay()
  if (weekday === 0 || weekday === 6) return false // no Sat/Sun

  if (minute !== 0 && minute !== 30) return false
  // Start times run 09:00 through 16:30, so the meeting wraps up by 5pm.
  if (hour < businessHours.start || hour >= businessHours.end) return false

  return true
}

// ---- Seller lead -----------------------------------------------------------
// Built per request so validation messages can be localised.
export function makeSellerLeadSchema(m: SellerLeadMessages) {
  // The lead's phone is the primary way to reach them, so it's required; a basic
  // shape check keeps obvious junk out without rejecting valid intl formats.
  const customerPhone = z
    .string()
    .trim()
    .min(6, m.phoneMin)
    .max(40)
    .refine((v) => /^[+\d][\d\s().-]{4,}$/.test(v), { message: m.phoneInvalid })

  // Email is optional — handy to have, but the phone is enough to follow up.
  const customerEmail = z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: m.emailInvalid,
    })
    .optional()

  const need = z.string().trim().min(10, m.needMin).max(2000, m.needMax)

  const preferredCallTime = z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || isBusinessSlot(v), { message: m.slotInvalid })
    .optional()

  return z.object({
    // The payout key — without it the 10% can't be attributed.
    referralCode: z.string().trim().min(2, m.referralCodeMin).max(40),
    customerName: z.string().trim().min(2, m.customerNameMin).max(120),
    // The lead's contact: phone required, email optional.
    customerPhone,
    customerEmail,
    need,
    budget: z.enum(budgetOptions).optional().or(z.literal("")),
    // Optional — when the customer's free to talk (business days, 9am–5pm).
    preferredCallTime,
    // Honeypot: real people leave this empty.
    company: z.string().max(0).optional(),
  })
}

export type SellerLeadSchema = ReturnType<typeof makeSellerLeadSchema>
export type SellerLeadInput = z.infer<SellerLeadSchema>
export type SellerLeadField =
  | "referralCode"
  | "customerName"
  | "customerPhone"
  | "customerEmail"
  | "need"
  | "budget"
  | "preferredCallTime"

export type SellerLeadState = {
  status: "idle" | "success" | "error"
  message?: string
  errors?: Partial<Record<SellerLeadField, string>>
  values?: Partial<Record<SellerLeadField, string>>
}
