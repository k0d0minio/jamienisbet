import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/brand/eyebrow"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Container } from "@/components/shell/section"
import { Markdown } from "@/components/markdown"
import { formatPostDate, getPost, getPostSlugs } from "@/lib/posts"
import { localeHtmlLang, routing, type Locale } from "@/i18n/routing"

type Params = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getPostSlugs().map((slug) => ({ locale, slug }))
  )
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const path = `/work/posts/${post.slug}`
  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        en: `/en${path}`,
        pt: `/pt${path}`,
        fr: `/fr${path}`,
        "x-default": `/en${path}`,
      },
    },
  }
}

export default async function PostPage({ params }: Params) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations("posts")
  const post = getPost(slug)
  if (!post) notFound()

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
          <Eyebrow rule>
            <time dateTime={post.date}>
              {formatPostDate(post.date, localeHtmlLang[locale as Locale])}
            </time>
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {post.title}
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">{post.summary}</p>
        </div>

        <div className="border-t border-border pt-10">
          <Markdown>{post.body}</Markdown>
        </div>

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
