import { createLocaleRequestConfig } from "@jamie-nisbet/app-shell/i18n/request"

// Message catalogs are app-local; locale resolution lives in the app shell.
export default createLocaleRequestConfig(
  (locale) => import(`../messages/${locale}.json`),
)
