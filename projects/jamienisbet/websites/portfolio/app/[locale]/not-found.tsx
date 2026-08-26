import { useTranslations } from "next-intl"
import { Button, Eyebrow } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Link } from "@jamie-nisbet/app-shell/i18n"
import { Container, Section } from "@jamie-nisbet/app-shell"

export default function NotFound() {
  const t = useTranslations("notFound")

  return (
    <Section>
      <Container size="md" className="flex flex-col items-start gap-5">
        <Eyebrow rule index="404">
          {t("eyebrow")}
        </Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">{t("body")}</p>
        <Button asChild className="mt-1">
          <Link href="/">
            {t("backHome")}
            <ArrowRight />
          </Link>
        </Button>
      </Container>
    </Section>
  )
}
