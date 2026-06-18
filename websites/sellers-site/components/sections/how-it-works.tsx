import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"
import { BadgeEuro, CreditCard, Hammer, UserPlus } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { steps } from "@/lib/site"

const icons = { UserPlus, Hammer, CreditCard, BadgeEuro }

export function HowItWorks() {
  return (
    <Section id="how" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="How it works"
          index="01"
          title="Four steps from a warm intro to your payout."
          intro="You bring the relationship. I do the rest — and the referral code keeps the 10% unambiguously yours."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = icons[step.icon]
            return (
              <Card key={step.title} className="gap-4">
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {step.description}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
