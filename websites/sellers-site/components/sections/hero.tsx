import { Button, Eyebrow } from "@jamie-nisbet/ui"
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
        <div className="flex max-w-[var(--layout-md)] flex-col gap-6">
          <Eyebrow rule primary>
            {t("role")}
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t("hero.intro")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/#refer">
                {t("hero.refer")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#how">{t("hero.how")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
