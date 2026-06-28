// Locale config — shared by client and server (no server-only imports here, so
// the language switcher and form components can read it too). English is the
// default; Portuguese and French are first-class. Adding a locale = add it here
// and add a matching dictionary under ./dictionaries.

export const locales = ["en", "pt", "fr"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

// The cookie that carries the chosen locale across requests. Read on the server
// to pick a dictionary; written by the language switcher (client) then a refresh
// re-renders the server components in the new language.
export const LOCALE_COOKIE = "locale"

// Full names (shown in the language menu) and short labels (the switcher chips).
export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  fr: "Français",
}

export const localeShort: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  fr: "FR",
}

// The BCP-47 tag for <html lang> and Intl date formatting, per locale.
export const localeHtmlLang: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  fr: "fr-FR",
}

// The Open Graph locale code, per locale.
export const localeOg: Record<Locale, string> = {
  en: "en_GB",
  pt: "pt_PT",
  fr: "fr_FR",
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

// Persist the chosen locale to the cookie the server reads (client-side only).
// Kept here, outside any component, so the cookie write isn't flagged as state
// mutation inside a React render.
export function persistLocale(locale: Locale): void {
  if (typeof document === "undefined") return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}
