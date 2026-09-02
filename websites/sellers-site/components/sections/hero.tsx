import { Button, Eyebrow, RevealGroup, RevealItem } from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container } from "@jamie-nisbet/app-shell"

export async function Hero() {
  const t = await getTranslations()

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* The brand's single permitted texture: a blueprint grid, faded out. */}
      <div
        aria-hidden
        className="dst-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
      />
      <Container className="relative py-20 sm:py-28 lg:py-32">
        {/* In view when the page lands, so it plays on mount: the lines arrive
            in reading order, 80ms apart, on the brand clock. */}
        <RevealGroup mount className="flex max-w-[var(--layout-md)] flex-col gap-6">
          <RevealItem>
            <Eyebrow rule primary>
              {t("role")}
            </Eyebrow>
          </RevealItem>
          <RevealItem as="h1" className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </RevealItem>
          <RevealItem as="p" className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t("hero.intro")}
          </RevealItem>
          <RevealItem className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/#refer">
                {t("hero.refer")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#how">{t("hero.how")}</Link>
            </Button>
          </RevealItem>
        </RevealGroup>
      </Container>
    </section>
  )
}
