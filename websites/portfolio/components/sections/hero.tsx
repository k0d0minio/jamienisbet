import Link from "next/link"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/section"
import { site } from "@/lib/site"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* The brand's single permitted texture: a blueprint grid, faded out. */}
      <div
        aria-hidden
        className="dst-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
      />
      <Container className="relative py-20 sm:py-28 lg:py-32">
        <div className="flex max-w-[var(--container-md)] flex-col gap-6">
          <Eyebrow rule primary>
            {site.role}
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            I build AI features and software that ship — and earn their keep.
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            I&apos;m Jamie — a senior engineer working directly with you. Practical AI and
            software wired into the tools you already use, with clear scope and a clear price.
            No agency layers, no surprises.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/#contact">
                Start a project
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#work">See work</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
