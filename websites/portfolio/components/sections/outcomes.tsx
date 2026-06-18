import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

import { Container, Section, SectionHeading } from "@/components/section"
import { outcomes } from "@/lib/site"

export function Outcomes() {
  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="What this gets you"
          index="02"
          title="Less admin. Systems that hold up."
          intro="What working together actually changes — for the business and for the tech behind it."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {outcomes.map((outcome) => (
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
