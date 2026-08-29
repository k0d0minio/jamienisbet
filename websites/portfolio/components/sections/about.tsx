import { getTranslations } from "next-intl/server"
import { MapPin } from "lucide-react"

import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"
import { site } from "@/lib/site"

export async function About() {
  const t = await getTranslations("about")

  return (
    <Section id="about" className="border-b border-border">
      <Container className="flex max-w-[var(--layout-md)] flex-col gap-6">
        <SectionHeading eyebrow={t("eyebrow")} index="05" title={t("title")} />
        <div className="flex flex-col gap-4 text-lg text-muted-foreground">
          <p>{t("p1", { location: site.location })}</p>
          <p>{t("p2")}</p>
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {site.location}
        </p>
      </Container>
    </Section>
  )
}
