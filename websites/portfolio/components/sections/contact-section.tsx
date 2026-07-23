import { getTranslations } from "next-intl/server"
import { Eyebrow } from "@jamie-nisbet/ui"
import { Mail, MapPin } from "lucide-react"

import { Container, Section } from "@jamie-nisbet/app-shell"
import { ContactForm } from "@/components/contact-form"
import { site } from "@/lib/site"

export async function ContactSection() {
  const t = await getTranslations("contact")

  return (
    <Section id="contact">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <Eyebrow rule index="06">
            {t("eyebrow")}
          </Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">{t("intro")}</p>

          <div className="mt-2 flex flex-col gap-2 text-sm">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="size-4 text-muted-foreground" />
              {site.email}
            </a>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              {site.location}
            </span>
          </div>

          <p className="mt-2 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {t("rateLead")}{" "}
            <span className="font-medium text-foreground">{t("rateAmount")}</span>
            {t("rateTrail")}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <ContactForm />
        </div>
      </Container>
    </Section>
  )
}
