import { getTranslations } from "next-intl/server"
import { SiteFooter as AppShellSiteFooter } from "@jamie-nisbet/app-shell"
import { Link } from "@jamie-nisbet/app-shell/i18n"
import { ExternalLink } from "lucide-react"

import { site, navItems } from "@/lib/site"

// Thin wrapper over the shared footer frame: resolves this site's catalogs
// and fills the slots (main-site link + bottom nav from navItems).
export async function SiteFooter() {
  const t = await getTranslations()
  const year = new Date().getFullYear()

  return (
    <AppShellSiteFooter
      siteName={site.name}
      homeAriaLabel={`${site.name} — ${t("role")}`}
      tagline={t("footer.tagline", { location: site.location })}
      contactHeading={t("footer.getInTouch")}
      email={site.email}
      location={site.location}
      contactExtra={
        <a
          href={site.mainSiteUrl}
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
        >
          <ExternalLink className="size-4 text-muted-foreground" />
          jamienisbet.com
        </a>
      }
      bottomLeft={
        <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
          © {year} {site.name}
        </p>
      }
      bottomRight={
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
      }
    />
  )
}
