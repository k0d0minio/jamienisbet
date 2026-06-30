import { Card, CardContent, CardHeader, CardTitle } from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { BadgeEuro, CreditCard, Hammer, UserPlus } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"

// Step key → icon. Keys are stable across locales (defined in the catalogs).
const icons: Record<string, typeof UserPlus> = {
  refer: UserPlus,
  build: Hammer,
  pay: CreditCard,
  payout: BadgeEuro,
}

export async function HowItWorks() {
  const t = await getTranslations("howItWorks")
  const steps = t.raw("steps") as {
    key: string
    title: string
    description: string
  }[]

  return (
    <Section id="how" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="01"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = icons[step.key] ?? UserPlus
            return (
              <Card key={step.key} className="gap-4">
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
