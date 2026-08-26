// Locale-invariant site facts only. Translatable copy lives in messages/*.json
// (read via next-intl).

export const site = {
  name: "Jamie Nisbet",
  email: "contact@jamienisbet.com",
  domain: "jamienisbet.com",
  url: "https://jamienisbet.com",
  // Location is a proper noun but appears inside translated sentences as an ICU
  // arg; the English label lives here as the canonical value.
  location: "Portugal",
  // Nav items: hrefs are invariant; labels come from the "nav" message namespace
  // keyed by `id`.
  nav: [
    { id: "work", href: "/#work" },
    { id: "about", href: "/#about" },
    { id: "contact", href: "/#contact" },
  ],
} as const

export type NavId = (typeof site.nav)[number]["id"]
