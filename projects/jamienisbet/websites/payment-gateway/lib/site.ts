// Single source of locale-invariant site facts for the payment surface.
// Facts come from _config/business/contact.md. Translatable copy lives in
// messages/*.json. This site never quotes or invents a price — every amount
// traces to a reviewed Stripe invoice (see _config/business/rates.md and
// workspaces/finance/).

export const site = {
  name: "Jamie Nisbet",
  email: "contact@jamienisbet.com",
  location: "Mafra, Portugal",
  domain: "pay.jamienisbet.com",
  url: "https://pay.jamienisbet.com",
  // Where the main site lives, linked from header/footer.
  mainSiteUrl: "https://jamienisbet.com",
} as const

// Icons for the three landing-page assurances. The copy (title/description)
// lives in messages/*.json under home.assurances; the icon name on each entry
// selects which icon renders.
export type AssuranceIcon = "FileText" | "ShieldCheck" | "Receipt"

export type Assurance = {
  icon: AssuranceIcon
  title: string
  description: string
}
