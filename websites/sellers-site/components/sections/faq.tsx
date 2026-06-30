import { getTranslations } from "next-intl/server"

import { Container, Section, SectionHeading } from "@/components/section"

export async function Faq() {
  const t = await getTranslations()
  const faqs = t.raw("faqs") as { q: string; a: string }[]

  return (
    <Section id="faq" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("nav.faq")}
          index="04"
          title={t("faqTitle")}
        />
        <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.q} className="flex flex-col gap-2">
              <dt className="text-lg font-semibold tracking-tight text-balance">
                {faq.q}
              </dt>
              <dd className="text-pretty text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
