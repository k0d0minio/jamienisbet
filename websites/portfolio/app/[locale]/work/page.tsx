import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Container, Section, SectionHeading } from "@/components/section"
import { CaseStudyCard } from "@/components/case-study-card"
import { getCaseStudies } from "@/lib/work"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "work" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/work`,
      languages: {
        en: "/en/work",
        pt: "/pt/work",
        fr: "/fr/work",
        "x-default": "/en/work",
      },
    },
  }
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("work")
  const studies = getCaseStudies()

  return (
    <Section>
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        {studies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {studies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t("emptyLead")}{" "}
            <Link
              href="/#contact"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("emptyLinkLead")}
            </Link>{" "}
            {t("emptyLinkTrail")}
          </p>
        )}
      </Container>
    </Section>
  )
}
