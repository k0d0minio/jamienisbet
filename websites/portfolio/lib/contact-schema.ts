import { z } from "zod"

// Shared by the client form (types + light hints) and the server action
// (authoritative validation). No "use server" here so the type can be
// imported into client components safely.
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell me your name.").max(100),
  email: z
    .string()
    .trim()
    .min(1, "An email so I can reply.")
    .email("That email doesn't look right."),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two about your project, please.")
    .max(4000, "That's a lot — trim it down a touch."),
  // Honeypot: real people leave this empty.
  company: z.string().max(0).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>

export type ContactState = {
  status: "idle" | "success" | "error"
  message?: string
  errors?: Partial<Record<"name" | "email" | "message", string>>
  values?: { name: string; email: string; message: string }
}
