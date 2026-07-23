import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"

import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"

export async function TechPrinciples() {
  const t = await getTranslations("tech.principles")
  const items = t.raw("items") as { title: string; description: string }[]

  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.title} className="gap-3">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
