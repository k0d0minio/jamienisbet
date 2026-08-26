"use client"

import { useTranslations } from "next-intl"
import { SiteHeader as AppShellSiteHeader } from "@jamie-nisbet/app-shell"

import { site, navItems } from "@/lib/site"

// Thin wrapper over the shared header: resolves this site's catalogs and nav.
export function SiteHeader() {
  const t = useTranslations()

  return (
    <AppShellSiteHeader
      siteName={site.name}
      homeAriaLabel={`${site.name} — ${t("role")}`}
      nav={navItems.map((item) => ({
        href: item.href,
        label: t(`nav.${item.key}`),
      }))}
      cta={{ href: "/#refer", label: t("header.refer") }}
      menuLabels={{ open: t("header.openMenu"), close: t("header.closeMenu") }}
    />
  )
}
