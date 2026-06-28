import { Eyebrow } from "@jamie-nisbet/ui"
import { KeyRound, Mail } from "lucide-react"

import { Container, Section } from "@/components/section"
import { ReferralForms } from "@/components/referral-forms"
import { site } from "@/lib/site"
import { getI18n } from "@/lib/i18n"

export async function ReferSection({
  defaultReferralCode,
}: {
  defaultReferralCode?: string
}) {
  const { locale, dict } = await getI18n()

  return (
    <Section id="refer">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <Eyebrow rule index="05">
            {dict.refer.eyebrow}
          </Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {dict.refer.title}
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            {dict.refer.intro}
          </p>

          <div className="mt-2 flex flex-col gap-3 text-sm">
            <span className="inline-flex items-start gap-2 text-muted-foreground">
              <KeyRound className="mt-0.5 size-4 shrink-0" />
              {dict.refer.firstWins}
            </span>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="size-4 text-muted-foreground" />
              {dict.refer.questions} {site.email}
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <ReferralForms
            defaultReferralCode={defaultReferralCode}
            locale={locale}
            dict={dict.form}
          />
        </div>
      </Container>
    </Section>
  )
}
