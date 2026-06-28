import { Container, Section, SectionHeading } from "@/components/section"
import { getI18n } from "@/lib/i18n"

export async function Faq() {
  const { dict } = await getI18n()

  return (
    <Section id="faq" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={dict.nav.faq}
          index="04"
          title={dict.faqTitle}
        />
        <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {dict.faqs.map((faq) => (
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
