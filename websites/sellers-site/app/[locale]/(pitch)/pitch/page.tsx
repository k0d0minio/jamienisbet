import type { Metadata } from "next"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
} from "@jamie-nisbet/ui"
import { ArrowRight, Check, Mail } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { PrintButton } from "@/components/print-button"
import { site } from "@/lib/site"
import { getI18n } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.pitch.metaTitle,
    description: dict.pitch.metaDescription,
    // Seller-shared selling aid, not a page to index on its own.
    robots: { index: false, follow: true },
  }
}

export default async function PitchPage() {
  const { dict } = await getI18n()
  const pitch = dict.pitch

  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(
    pitch.mailSubject
  )}`

  return (
    <>
      {/* Hero */}
      <Section className="border-b border-border">
        <Container className="flex max-w-[var(--container-md)] flex-col gap-6">
          <Eyebrow rule primary>
            {pitch.eyebrow}
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {pitch.title}
          </h1>
          <p className="text-lg text-pretty text-muted-foreground sm:text-xl">
            {pitch.intro}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href={mailto}>
                {pitch.startCta}
                <ArrowRight />
              </a>
            </Button>
            <PrintButton label={dict.print} />
          </div>
        </Container>
      </Section>

      {/* What you get — packages */}
      <Section className="border-b border-border">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow={pitch.getEyebrow}
            title={pitch.getTitle}
            intro={pitch.getIntro}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {dict.packages.map((pkg) => (
              <Card key={pkg.key} className="gap-4">
                <CardHeader className="gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <span className="shrink-0 font-mono text-2xs tracking-[0.12em] text-primary uppercase">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.blurb}</p>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2">
                    {pkg.includes.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <span className="text-foreground/90">{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Why work with me */}
      <Section className="border-b border-border">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeading eyebrow={pitch.whyEyebrow} title={pitch.whyTitle} />
          <ul className="flex flex-col gap-6 lg:pt-2">
            {pitch.why.map((point) => (
              <li key={point.title} className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 font-semibold tracking-tight">
                  <Check className="size-4 text-primary" />
                  {point.title}
                </span>
                <span className="pl-6 text-pretty text-muted-foreground">
                  {point.description}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* How it works */}
      <Section className="border-b border-border">
        <Container className="flex flex-col gap-12">
          <SectionHeading eyebrow={pitch.stepsEyebrow} title={pitch.stepsTitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pitch.steps.map((step, i) => (
              <Card key={step.title} className="gap-4">
                <CardHeader className="gap-3">
                  <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground">
                    0{i + 1}
                  </span>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {step.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Call to action */}
      <Section>
        <Container className="flex max-w-[var(--container-md)] flex-col items-start gap-5">
          <Eyebrow rule>{pitch.ctaTitle}</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {pitch.ctaHeading}
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            {pitch.ctaBody}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href={mailto}>
                <Mail />
                {site.email}
              </a>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
