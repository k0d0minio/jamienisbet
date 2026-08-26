import { getTranslations } from "next-intl/server"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
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
        <div className="flex max-w-[var(--container-md)] flex-col gap-6">
          <Eyebrow rule primary>
            {tRole("role")}
          </Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t("intro")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/#contact">
                {t("startProject")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#work">{t("seeWork")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
