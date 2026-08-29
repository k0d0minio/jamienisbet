import { getTranslations } from "next-intl/server"
import { Plus } from "lucide-react"

import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"

// Native <details>/<summary> so the FAQ needs no client JS and works before
// hydration — the whole home page stays static HTML.
export async function Faq() {
  const t = await getTranslations("faq")
  const items = t.raw("items") as { q: string; a: string }[]

  return (
    <Section id="faq" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} index="04" title={t("title")} />
        <div className="flex max-w-[var(--layout-md)] flex-col divide-y divide-border border-y border-border">
          {items.map((item) => (
            <details key={item.q} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-medium tracking-tight transition-colors marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-prose pb-4 text-sm text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  )
}
