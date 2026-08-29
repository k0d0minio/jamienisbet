import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container } from "@jamie-nisbet/app-shell"
import { TechPrinciples } from "@/components/sections/tech-principles"
import { Services } from "@/components/sections/services"
import { Outcomes } from "@/components/sections/outcomes"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "tech" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/tech`,
      languages: {
        en: "/en/tech",
        pt: "/pt/tech",
        fr: "/fr/tech",
        "x-default": "/en/tech",
      },
    },
  }
}

export default async function TechPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("tech")

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="dst-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="flex max-w-[var(--layout-md)] flex-col gap-6">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {t("backHome")}
            </Link>
            <Eyebrow rule primary>
              {t("hero.eyebrow")}
            </Eyebrow>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              {t("hero.intro")}
            </p>
            <div className="mt-2">
              <Button asChild size="lg">
                <Link href="/#contact">
                  {t("startProject")}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <TechPrinciples />
      <Services />
      <Outcomes />
    </>
  )
}
