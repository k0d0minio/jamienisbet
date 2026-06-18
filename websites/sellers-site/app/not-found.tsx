import Link from "next/link"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Container, Section } from "@/components/section"

export default function NotFound() {
  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-5">
        <Eyebrow rule index="404">
          Not found
        </Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          That page wandered off.
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          The link might be old or mistyped. Let&apos;s get you back on track.
        </p>
        <Button asChild className="mt-1">
          <Link href="/">
            Back home
            <ArrowRight />
          </Link>
        </Button>
      </Container>
    </Section>
  )
}
