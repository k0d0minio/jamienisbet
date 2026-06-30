// Locale-invariant site config for the affiliate intake site. All translatable
// copy now lives in messages/*.json (next-intl catalogs); this file holds only
// the facts that don't change between languages — name, contact, URLs, and the
// nav structure (hrefs + stable keys the catalogs translate by).

export const site = {
  name: "Jamie Nisbet",
  email: "contact@jamienisbet.com",
  location: "Mafra, Portugal",
  domain: "refer.jamienisbet.com",
  url: "https://refer.jamienisbet.com",
  // Where the main site lives, linked from header/footer and shared in messages.
  mainSiteUrl: "https://jamienisbet.com",
} as const

// Nav: hrefs are invariant; labels are translated via the `nav` namespace.
export const navItems = [
  { key: "how", href: "/#how" },
  { key: "sell", href: "/#sell" },
  { key: "kit", href: "/#kit" },
  { key: "faq", href: "/#faq" },
] as const

export type NavKey = (typeof navItems)[number]["key"]
