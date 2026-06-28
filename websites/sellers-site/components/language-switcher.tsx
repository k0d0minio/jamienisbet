"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@jamie-nisbet/ui"

import {
  locales,
  localeShort,
  persistLocale,
  type Locale,
} from "@/lib/i18n/config"

// Compact EN · PT · FR switcher. Writes the locale to a long-lived cookie, then
// refreshes so the server re-renders every section in the new language. No URL
// change — the choice rides the cookie, which is enough for a seller kit.
export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function choose(next: Locale) {
    if (next === locale) return
    persistLocale(next)
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-md border border-border p-0.5"
    >
      {locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={code === locale ? "secondary" : "ghost"}
          aria-pressed={code === locale}
          disabled={pending}
          className="h-7 px-2 text-xs font-medium"
          onClick={() => choose(code)}
        >
          {localeShort[code]}
        </Button>
      ))}
    </div>
  )
}
