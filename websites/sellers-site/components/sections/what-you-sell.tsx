import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"
import { FileText, Sparkles } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { whatYouSell } from "@/lib/site"

const icons = [FileText, Sparkles]

export function WhatYouSell() {
  return (
    <Section id="sell" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="What you sell"
          index="02"
          title="Pitch the simple thing. Hand me the rest."
          intro="Landing pages you can quote yourself, from €200. Anything bigger, just introduce me — you still earn your 10%."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {whatYouSell.map((point, i) => {
            const Icon = icons[i] ?? FileText
            return (
              <Card key={point.title} className="gap-4">
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
