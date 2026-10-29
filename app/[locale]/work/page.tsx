import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Container, Section, SectionHeading } from "@/components/shell/section"
import { CaseStudyCard } from "@/components/case-study-card"
import { PostCard } from "@/components/post-card"
import { getCaseStudies } from "@/lib/work"
import { formatPostDate, getPosts } from "@/lib/posts"
import { localeHtmlLang, type Locale } from "@/i18n/routing"

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
  const tPosts = await getTranslations("posts")
  const studies = getCaseStudies()
  const posts = getPosts()
  const lang = localeHtmlLang[locale as Locale]

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

        {posts.length > 0 ? (
          <div className="flex flex-col gap-8 border-t border-border pt-12">
            <SectionHeading
              eyebrow={tPosts("eyebrow")}
              title={tPosts("title")}
              intro={tPosts("intro")}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  date={formatPostDate(post.date, lang)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  )
}
