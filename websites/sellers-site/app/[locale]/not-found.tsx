import Link from "next/link"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Container, Section } from "@/components/section"
import { getI18n } from "@/lib/i18n"

export default async function NotFound() {
  const { dict } = await getI18n()

  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-5">
        <Eyebrow rule index="404">
          {dict.notFound.eyebrow}
        </Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {dict.notFound.title}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          {dict.notFound.body}
        </p>
        <Button asChild className="mt-1">
          <Link href="/">
            {dict.notFound.cta}
            <ArrowRight />
          </Link>
        </Button>
      </Container>
    </Section>
  )
}
