// Resend Template IDs — NOT secrets (they only work paired with RESEND_API_KEY),
// so they're checked in here instead of duplicated as an env var per site/template.
// Publish a template (see README.md), then paste its ID below.
export const EMAIL_TEMPLATE_IDS = {
  contactFormNotification: "c86c107f-7e73-42e3-ac93-16c6ef18632e",
  referralLeadNotification: "256d049d-bc87-4267-9e91-cbe80b3ca324",
} as const
