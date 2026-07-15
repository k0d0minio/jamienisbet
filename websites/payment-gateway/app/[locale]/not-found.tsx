import { getTranslations } from "next-intl/server"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowUpRight } from "lucide-react"

import { Container, Section } from "@jamie-nisbet/app-shell"
import { site } from "@/lib/site"

export default async function NotFound() {
  const t = await getTranslations("notFound")

  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-5">
        <Eyebrow rule index="404">
          {t("eyebrow")}
        </Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          {t("intro")}
        </p>
        <Button asChild className="mt-1">
          <a href={`mailto:${site.email}`}>
            {t("email", { email: site.email })}
            <ArrowUpRight />
          </a>
        </Button>
      </Container>
    </Section>
  )
}
