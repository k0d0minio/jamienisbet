import { getTranslations } from "next-intl/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { AppWindow, Compass, Sparkles, Workflow } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"

// Order + icon are structure (locale-invariant); titles/descriptions are copy.
const items = [
  { id: "ai", Icon: Sparkles },
  { id: "software", Icon: AppWindow },
  { id: "automations", Icon: Workflow },
  { id: "advisory", Icon: Compass },
] as const

export async function Services() {
  const t = await getTranslations("services")

  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="01"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ id, Icon }) => (
            <Card key={id} className="gap-4">
              <CardHeader className="gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-xl">{t(`items.${id}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t(`items.${id}.description`)}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
