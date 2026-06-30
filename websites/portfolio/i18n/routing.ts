import { defineRouting } from "next-intl/routing"

// localePrefix defaults to "always": "/" redirects to "/en", and every locale
// (including the default) is shown in the URL.
export const routing = defineRouting({
  locales: ["en", "pt", "fr"],
  defaultLocale: "en",
})

export type Locale = (typeof routing.locales)[number]

// Per-locale BCP-47 tag for <html lang> and Intl date formatting.
export const localeHtmlLang: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  fr: "fr-FR",
}

// Open Graph locale codes.
export const localeOg: Record<Locale, string> = {
  en: "en_GB",
  pt: "pt_PT",
  fr: "fr_FR",
}

// Display metadata for the language switcher.
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
