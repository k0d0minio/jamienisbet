import { z } from "zod"

// Validation messages are locale-dependent, so the schema is built per request
// from the "form.errors" message namespace (passed in by the server action via
// t.raw). The client form only needs the types below.
export type ContactMessages = {
  nameMin: string
  emailRequired: string
  emailInvalid: string
  messageMin: string
  messageMax: string
}

export function makeContactSchema(m: ContactMessages) {
  return z.object({
    name: z.string().trim().min(2, m.nameMin).max(100),
    email: z
      .string()
      .trim()
      .min(1, m.emailRequired)
      .email(m.emailInvalid),
    message: z
      .string()
      .trim()
      .min(10, m.messageMin)
      .max(4000, m.messageMax),
    // Honeypot: real people leave this empty.
    company: z.string().max(0).optional(),
  })
}

export type ContactInput = z.infer<ReturnType<typeof makeContactSchema>>

export type ContactState = {
  status: "idle" | "success" | "error"
  message?: string
  errors?: Partial<Record<"name" | "email" | "message", string>>
  values?: { name: string; email: string; message: string }
}
