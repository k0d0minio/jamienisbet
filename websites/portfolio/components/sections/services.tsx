import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { AppWindow, Compass, Sparkles, Workflow } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { services } from "@/lib/site"

const icons = { Sparkles, AppWindow, Workflow, Compass }

export function Services() {
  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="What I do"
          index="01"
          title="Software and AI, delivered by the person who builds it."
          intro="Four ways I help — described by the outcome, not a product name."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = icons[service.icon]
            return (
              <Card key={service.title} className="gap-4">
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {service.description}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
