import type { ComponentType } from "react"
import { getTranslations } from "next-intl/server"
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { ArrowRight, Clock, Sparkles, TrendingUp, Wrench } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"
import { PROBLEM_IDS, PROBLEMS, type ProblemId } from "@/lib/problems"

// Icon per problem is structure (locale-invariant); titles/descriptions are copy
// in the "problems.items.<id>" namespace.
const icons: Record<ProblemId, ComponentType<{ className?: string }>> = {
  busywork: Clock,
  getFound: TrendingUp,
  custom: Wrench,
}

export async function Problems() {
  const t = await getTranslations("problems")
  const tServices = await getTranslations("services")

  return (
    <Section id="help" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="01"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {PROBLEM_IDS.map((id) => {
            const Icon = icons[id]
            const { primary, covers } = PROBLEMS[id]
            return (
              <Card key={id} className="gap-5">
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">
                    {t(`items.${id}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                  <p>{t(`items.${id}.description`)}</p>
                  <div className="mt-auto flex flex-col gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
                      {t("coversLabel")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {covers.map((service) => (
                        <Link
                          key={service}
                          href={{ pathname: "/", query: { service }, hash: "contact" }}
                          className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                        >
                          {tServices(`items.${service}.title`)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href={{ pathname: "/", query: { service: primary }, hash: "contact" }}>
                      {t("cta")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* AI advice folded in rather than given its own bucket — still reaches the
            contact form as the aiConsultancy enquiry id. */}
        <p className="inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          {t("aiAsideLead")}{" "}
          <Link
            href={{ pathname: "/", query: { service: "aiConsultancy" }, hash: "contact" }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("aiAsideLink")}
          </Link>
        </p>
      </Container>
    </Section>
  )
}
