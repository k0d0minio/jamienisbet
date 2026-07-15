import { getTranslations } from "next-intl/server"
import { Button } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"
import { CaseStudyCard } from "@/components/case-study-card"
import { getFeaturedCaseStudies } from "@/lib/work"

export async function SelectedWork() {
  const t = await getTranslations("selectedWork")
  const studies = getFeaturedCaseStudies()

  return (
    <Section id="work" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={t("eyebrow")}
            index="03"
            title={t("title")}
            intro={t("intro")}
          />
          {studies.length > 0 && (
            <Button asChild variant="ghost" className="w-fit shrink-0">
              <Link href="/work">
                {t("allWork")}
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>

        {studies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {studies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
            {studies.length < 3 && (
              <MoreComing
                title={t("moreComingTitle")}
                promptLead={t("moreComingPromptLead")}
                promptLink={t("moreComingPromptLink")}
              />
            )}
          </div>
        ) : (
          <EmptyWork
            title={t("emptyTitle")}
            body={t("emptyBody")}
            getInTouch={t("getInTouch")}
          />
        )}
      </Container>
    </Section>
  )
}

// Shown while the work section is still filling up — signals it's growing, not empty.
function MoreComing({
  title,
  promptLead,
  promptLink,
}: {
  title: string
  promptLead: string
  promptLink: string
}) {
  return (
    <Link
      href="/#contact"
      className="group flex min-h-44 flex-col justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center transition-colors hover:border-border-strong hover:bg-muted"
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        {promptLead}{" "}
        <span className="text-primary group-hover:underline">{promptLink}</span>
      </p>
    </Link>
  )
}

function EmptyWork({
  title,
  body,
  getInTouch,
}: {
  title: string
  body: string
  getInTouch: string
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-8">
      <p className="font-medium">{title}</p>
      <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
      <Button asChild variant="outline" className="mt-1">
        <Link href="/#contact">
          {getInTouch}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
