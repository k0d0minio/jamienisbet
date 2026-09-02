import { getTranslations } from "next-intl/server"
import { Button, Eyebrow, LogoFull, RevealGroup, RevealItem } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container } from "@jamie-nisbet/app-shell"

export async function Hero() {
  const t = await getTranslations("hero")
  const tRole = await getTranslations()

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* The brand's single permitted texture: a blueprint grid, faded out. */}
      <div
        aria-hidden
        className="dst-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
      />
      <Container className="relative py-20 sm:py-28 lg:py-32">
        {/* The hero is in view when the page lands, so it plays on mount: the
            lines arrive in reading order, 80ms apart, on the brand clock. */}
        <RevealGroup
          mount
          className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
        >
          <div className="flex max-w-[var(--layout-md)] flex-col gap-6">
            <RevealItem>
              <Eyebrow rule primary>
                {tRole("role")}
              </Eyebrow>
            </RevealItem>
            <RevealItem as="h1" className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("title")}
            </RevealItem>
            <RevealItem as="p" className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              {t("intro")}
            </RevealItem>
            <RevealItem className="mt-2 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/#contact">
                  {t("startProject")}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#work">{t("seeWork")}</Link>
              </Button>
            </RevealItem>
          </div>

          {/* The full lockup, large, beside the headline — the identity at a
              size the header cannot give it. Decorative here: the header's
              logo already names the page, so this one is hidden from
              assistive tech, and from phones, where the header's is a thumb's
              width above it. */}
          <RevealItem className="hidden shrink-0 md:block">
            <LogoFull className="size-52 lg:size-60" aria-hidden />
          </RevealItem>
        </RevealGroup>
      </Container>
    </section>
  )
}
