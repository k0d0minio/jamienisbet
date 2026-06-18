import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowUpRight } from "lucide-react"

import { Container, Section } from "@/components/section"
import { site } from "@/lib/site"

export default function NotFound() {
  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-5">
        <Eyebrow rule index="404">
          Not found
        </Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          We couldn&apos;t find that invoice.
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          The payment link might be old, mistyped, or already settled. Reply to
          my email and I&apos;ll send you a fresh one.
        </p>
        <Button asChild className="mt-1">
          <a href={`mailto:${site.email}`}>
            Email {site.email}
            <ArrowUpRight />
          </a>
        </Button>
      </Container>
    </Section>
  )
}
