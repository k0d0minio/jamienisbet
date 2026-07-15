import { Eyebrow } from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { KeyRound, Mail } from "lucide-react"

import { Container, Section } from "@jamie-nisbet/app-shell"
import { ReferralForms } from "@/components/referral-forms"
import { site } from "@/lib/site"

export async function ReferSection({
  defaultReferralCode,
}: {
  defaultReferralCode?: string
}) {
  const t = await getTranslations("refer")

  return (
    <Section id="refer">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <Eyebrow rule index="05">
            {t("eyebrow")}
          </Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            {t("intro")}
          </p>

          <div className="mt-2 flex flex-col gap-3 text-sm">
            <span className="inline-flex items-start gap-2 text-muted-foreground">
              <KeyRound className="mt-0.5 size-4 shrink-0" />
              {t("firstWins")}
            </span>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="size-4 text-muted-foreground" />
              {t("questions")} {site.email}
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <ReferralForms defaultReferralCode={defaultReferralCode} />
        </div>
      </Container>
    </Section>
  )
}
