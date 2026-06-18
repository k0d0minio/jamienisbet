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
            Earn 10% sending me work you already talk about.
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            Someone you know needs a website? Make the intro. I scope it, build
            it, and ship it — you earn 10% of what I invoice, paid when the client
            pays. No tech knowledge needed, no risk on you.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/#refer">
                Refer a customer
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#how">How it works</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
