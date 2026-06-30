import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { FileText, Sparkles } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"

const icons: Record<string, typeof FileText> = {
  landing: FileText,
  bigger: Sparkles,
}

export async function WhatYouSell() {
  const t = await getTranslations("whatYouSell")
  const points = t.raw("points") as {
    key: string
    title: string
    description: string
  }[]

  return (
    <Section id="sell" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="02"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {points.map((point) => {
            const Icon = icons[point.key] ?? FileText
            return (
              <Card key={point.key} className="gap-4">
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{point.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {point.description}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
