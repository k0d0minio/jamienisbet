// Resend Template IDs — NOT secrets (they only work paired with RESEND_API_KEY),
// so they're checked in here instead of duplicated as an env var per site/template.
// Publish a template (see README.md), then paste its ID below.
export const EMAIL_TEMPLATE_IDS = {
  contactFormNotification: "",
  referralLeadNotification: "",
} as const
