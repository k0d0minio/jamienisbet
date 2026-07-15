import { getRequestConfig } from "next-intl/server"
import { hasLocale, type Messages } from "next-intl"
import { routing, type Locale } from "./routing"

// Each app's i18n/request.ts stays a two-liner: the message catalogs live in
// the app (next-intl needs the dynamic import path to be app-relative), the
// locale-resolution logic lives here once.
export function createLocaleRequestConfig(
  loadMessages: (locale: Locale) => Promise<{ default: Messages }>,
) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale

    return {
      locale,
      messages: (await loadMessages(locale)).default,
    }
  })
}
