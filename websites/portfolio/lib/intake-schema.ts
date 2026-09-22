import { z } from "zod"

// The identity half of the `/start` intake — the three fields that are not
// questions on the questionnaire (name, email, phone) plus the honeypot. The
// questions themselves are validated by `makeAnswerSchema` off the snapshot,
// exactly as a sent form's answers are on `/f/[token]`.

export type IntakeMessages = {
  name: string
  email: string
  emailInvalid: string
}

export function makeIdentitySchema(m: IntakeMessages) {
  return z.object({
    name: z.string().trim().min(1, m.name).max(120, m.name),
    email: z.string().trim().min(1, m.email).email(m.emailInvalid).max(254, m.emailInvalid),
    phone: z.string().trim().max(40).optional().default(""),
    // The honeypot. Humans never see the field; a value means a bot.
    company: z.string().optional().default(""),
  })
}

export type IntakeState = {
  status: "idle" | "success" | "error"
  message?: string
  /** Keyed by field — `name`, `email`, or a question's answer key. First
   *  issue per field; the controls are React-controlled and keep their own
   *  values across a failed submit. */
  errors?: Record<string, string>
}
