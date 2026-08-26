"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@jamie-nisbet/ui"

import { usePathname, useRouter } from "../i18n/navigation"
import { routing, localeShort, type Locale } from "../i18n/routing"

// Compact EN · PT · FR switcher. Swaps only the locale segment of the current
// URL, preserving the path and query — no cookie writes, the choice rides the URL.
export function LanguageSwitcher() {
  const t = useTranslations("language")
  const pathname = usePathname() // locale-less pathname
  const params = useParams()
  const active = params.locale as Locale
  const router = useRouter()

  function choose(next: Locale) {
    if (next === active) return
    // Swaps ONLY the locale segment, preserving the current path + query.
    router.replace(pathname, { locale: next })
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center rounded-md border border-border p-0.5"
    >
      {routing.locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={code === active ? "secondary" : "ghost"}
          aria-pressed={code === active}
          className="h-7 px-2 text-xs font-medium"
          onClick={() => choose(code)}
        >
          {localeShort[code]}
        </Button>
      ))}
    </div>
  )
}
