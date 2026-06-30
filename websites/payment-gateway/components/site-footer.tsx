import { Eyebrow, LogoMarkSolid } from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { ExternalLink, Lock, Mail, MapPin } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { LanguageSwitcher } from "./language-switcher"
import { site } from "@/lib/site"

export async function SiteFooter() {
  const t = await getTranslations()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — ${t("role")}`}
          >
            <LogoMarkSolid className="size-8" />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {t("footer.tagline", { location: site.location })}
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            {t("footer.secured")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>{t("footer.questions")}</Eyebrow>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <Mail className="size-4 text-muted-foreground" />
            {site.email}
          </a>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {site.location}
          </span>
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
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--container-xl)] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("footer.copyright", { year, name: site.name })}
          </p>
          <p className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("footer.poweredBy")}
          </p>
        </div>
      </div>
    </footer>
  )
}
