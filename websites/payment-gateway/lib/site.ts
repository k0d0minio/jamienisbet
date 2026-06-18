// Single source of site-level copy and config for the payment surface.
// Facts come from _config/business/contact.md; voice follows _config/brand/voice/.
// This site never quotes or invents a price — every amount traces to a reviewed
// Stripe invoice (see _config/business/rates.md and workspaces/finance/).

export const site = {
  name: "Jamie Nisbet",
  // Shown as the surface label, not a job title.
  role: "Payments",
  email: "contact@jamienisbet.com",
  location: "Mafra, Portugal",
  domain: "pay.jamienisbet.com",
  url: "https://pay.jamienisbet.com",
  // Where the main site lives, linked from header/footer.
  mainSiteUrl: "https://jamienisbet.com",
  // One-line description used for metadata and sharing.
  description:
    "Pay an invoice, deposit, or retainer securely. Open your payment link, check the figures, and pay by card — handled by Stripe.",
} as const

// Three plain reassurances shown on the landing page. Voice: honest, specific,
// no hype (see _config/brand/voice/).
export type Assurance = {
  icon: "FileText" | "ShieldCheck" | "Receipt"
  title: string
  description: string
}

export const assurances: Assurance[] = [
  {
    icon: "FileText",
    title: "You pay against a real invoice",
    description:
      "Every payment link is tied to an invoice I've already sent you — same number, same amount. Nothing is quoted or added here.",
  },
  {
    icon: "ShieldCheck",
    title: "Card details go straight to Stripe",
    description:
      "The card form is Stripe's, embedded on the page. Your details never touch my server, and the payment is SCA-ready.",
  },
  {
    icon: "Receipt",
    title: "You get a receipt, I get notified",
    description:
      "Stripe emails you a receipt the moment it clears, and the invoice is marked paid — no chasing, no back-and-forth.",
  },
]
