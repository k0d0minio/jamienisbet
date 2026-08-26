import { getTranslations } from "next-intl/server"
import {
  LanguageSwitcher,
  SiteFooter as AppShellSiteFooter,
} from "@jamie-nisbet/app-shell"
import { ExternalLink, Lock } from "lucide-react"

import { site } from "@/lib/site"

// Thin wrapper over the shared footer frame: resolves this site's catalogs
// and fills the payment-surface slots (secured line, main-site link,
// language switcher, powered-by line).
export async function SiteFooter() {
  const t = await getTranslations()
  const year = new Date().getFullYear()

  return (
    <AppShellSiteFooter
      siteName={site.name}
      homeAriaLabel={`${site.name} — ${t("role")}`}
      tagline={t("footer.tagline", { location: site.location })}
      brandExtra={
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {t("footer.secured")}
        </p>
      }
      contactHeading={t("footer.questions")}
      email={site.email}
      location={site.location}
      contactExtra={
        <>
          <a
            href={site.mainSiteUrl}
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <ExternalLink className="size-4 text-muted-foreground" />
            {t("footer.mainSite")}
          </a>
          <div className="mt-1">
            <LanguageSwitcher />
          </div>
        </>
      }
      bottomLeft={
        <>
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("footer.copyright", { year, name: site.name })}
          </p>
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("footer.poweredBy")}
          </p>
        </>
      }
    />
  )
}
