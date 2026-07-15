import { getTranslations } from "next-intl/server"
import { SiteFooter as AppShellSiteFooter } from "@jamie-nisbet/app-shell"
import { Link } from "@jamie-nisbet/app-shell/i18n"

import { site } from "@/lib/site"

// Thin wrapper over the shared footer frame: resolves this site's catalogs
// and fills the slots (bottom nav from site.nav).
export async function SiteFooter() {
  const t = await getTranslations("footer")
  const tNav = await getTranslations("nav")
  const tHeader = await getTranslations("header")
  const year = new Date().getFullYear()

  return (
    <AppShellSiteFooter
      siteName={site.name}
      homeAriaLabel={tHeader("home", { name: site.name })}
      tagline={t("tagline", { location: site.location })}
      contactHeading={t("getInTouch")}
      email={site.email}
      location={site.location}
      bottomLeft={
        <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
          {t("copyright", { year, name: site.name })}
        </p>
      }
      bottomRight={
        <nav className="flex gap-4">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {tNav(item.id)}
            </Link>
          ))}
        </nav>
      }
    />
  )
}
