import { Eyebrow } from "@jamie-nisbet/ui"
import { KeyRound, Mail } from "lucide-react"

import { Container, Section } from "@/components/section"
import { ReferralForms } from "@/components/referral-forms"
import { site } from "@/lib/site"

export function ReferSection({
  defaultReferralCode,
}: {
  defaultReferralCode?: string
}) {
  return (
    <Section id="refer">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <Eyebrow rule index="06">
            Refer
          </Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Log a lead. Keep it yours.
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            Two forms: a seller lead if you have a referral code, or a partner
            referral if you run a business that sends work my way. I&apos;ll reply
            within a day or two.
          </p>

          <div className="mt-2 flex flex-col gap-3 text-sm">
            <span className="inline-flex items-start gap-2 text-muted-foreground">
              <KeyRound className="mt-0.5 size-4 shrink-0" />
              The first valid referral code on a new customer wins — so log it here
              before anyone else does.
            </span>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="size-4 text-muted-foreground" />
              Questions first? {site.email}
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
