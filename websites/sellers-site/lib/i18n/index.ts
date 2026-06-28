import "server-only"
import { cookies } from "next/headers"

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config"
import type { Dictionary } from "./dictionaries/en"

// Dictionaries are loaded on demand so each request only ships the chosen
// locale's copy, not all three.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.en),
  pt: () => import("./dictionaries/pt").then((m) => m.pt),
  fr: () => import("./dictionaries/fr").then((m) => m.fr),
}

// The active locale for this request, read from the cookie the language switcher
// sets. Falls back to English. Reading cookies opts the route into dynamic
// rendering — fine for a small, low-traffic referral site.
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]()
}

// Convenience for server components/layouts: one call for both the locale (for
// <html lang>, date formatting, the switcher) and its dictionary.
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return { locale, dict }
}

export type { Dictionary } from "./dictionaries/en"
export type { Locale } from "./config"
