import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Badge, Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Container } from "@/components/section"
import { Markdown } from "@/components/markdown"
import { getCaseStudy, getCaseStudySlugs } from "@/lib/work"
import { routing } from "@/i18n/routing"

type Params = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getCaseStudySlugs().map((slug) => ({ locale, slug }))
  )
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}
  return { title: study.title, description: study.summary }
}

export default async function CaseStudyPage({ params }: Params) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations("caseStudy")
  const study = getCaseStudy(slug)
  if (!study) notFound()

  return (
    <article className="py-12 sm:py-16">
      <Container size="md" className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit">
            <Link href="/work">
              <ArrowLeft />
              {t("allWork")}
            </Link>
          </Button>
          <Eyebrow rule index={String(study.year)}>
            {study.client}
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {study.title}
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">{study.summary}</p>
        </div>

        <dl className="grid gap-6 border-y border-border py-6 sm:grid-cols-3">
          <Meta label={t("services")}>
            <BadgeRow items={study.services} emptyLabel={t("empty")} />
          </Meta>
          <Meta label={t("stack")}>
            <BadgeRow items={study.stack} emptyLabel={t("empty")} />
          </Meta>
          <Meta label={t("outcome")}>
            <p className="text-sm text-foreground">{study.outcome}</p>
          </Meta>
        </dl>

        <Markdown>{study.body}</Markdown>

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-pretty">
            {t("ctaLead")}{" "}
            <span className="text-muted-foreground">{t("ctaTrail")}</span>
          </p>
          <Button asChild className="w-fit shrink-0">
            <Link href="/#contact">
              {t("ctaButton")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </article>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt>
        <Eyebrow>{label}</Eyebrow>
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function BadgeRow({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  )
}
