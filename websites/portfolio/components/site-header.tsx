"use client"

import { useTranslations } from "next-intl"
import { SiteHeader as AppShellSiteHeader } from "@jamie-nisbet/app-shell"

import { site } from "@/lib/site"

// Thin wrapper over the shared header: resolves this site's catalogs and nav.
export function SiteHeader() {
  const tNav = useTranslations("nav")
  const tHeader = useTranslations("header")

  return (
    <AppShellSiteHeader
      siteName={site.name}
      homeAriaLabel={tHeader("home", { name: site.name })}
      nav={site.nav.map((item) => ({ href: item.href, label: tNav(item.id) }))}
      cta={{ href: "/#contact", label: tHeader("startProject") }}
      menuLabels={{ open: tHeader("openMenu"), close: tHeader("closeMenu") }}
    />
  )
}
