import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"
import { FileText, Sparkles } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { getI18n } from "@/lib/i18n"

const icons: Record<string, typeof FileText> = {
  landing: FileText,
  bigger: Sparkles,
}

export async function WhatYouSell() {
  const { dict } = await getI18n()

  return (
    <Section id="sell" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={dict.whatYouSell.eyebrow}
          index="02"
          title={dict.whatYouSell.title}
          intro={dict.whatYouSell.intro}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {dict.whatYouSell.points.map((point) => {
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
