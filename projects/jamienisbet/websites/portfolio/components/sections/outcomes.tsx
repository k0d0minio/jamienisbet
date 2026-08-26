import { getTranslations } from "next-intl/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"

export async function Outcomes() {
  const t = await getTranslations("outcomes")
  const items = t.raw("items") as { title: string; description: string }[]

  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="02"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((outcome) => (
            <Card key={outcome.title} className="gap-4">
              <CardHeader>
                <CardTitle className="text-xl">{outcome.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {outcome.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
