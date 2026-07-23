import { getTranslations } from "next-intl/server"

import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"

export async function HowItWorks() {
  const t = await getTranslations("howItWorks")
  const steps = t.raw("steps") as { title: string; description: string }[]

  return (
    <Section id="how" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="03"
          title={t("title")}
          intro={t("intro")}
        />
        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-muted font-mono text-sm font-medium text-primary">
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
