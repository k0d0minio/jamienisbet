import { getTranslations } from "next-intl/server"
import { Eyebrow } from "@jamie-nisbet/ui"
import { Check, MapPin } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { site } from "@/lib/site"

export async function About() {
  const t = await getTranslations("about")
  const points = t.raw("howIWork") as string[]

  return (
    <Section id="about" className="border-b border-border">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow={t("eyebrow")} index="04" title={t("title")} />
          <div className="flex flex-col gap-4 text-lg text-muted-foreground">
            <p>{t("p1", { location: site.location })}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {site.location}
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:pt-2">
          <Eyebrow>{t("howIWorkTitle")}</Eyebrow>
          <ul className="flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
