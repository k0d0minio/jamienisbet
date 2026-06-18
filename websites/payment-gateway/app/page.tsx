import { Eyebrow } from "@jamie-nisbet/ui"
import { FileText, Receipt, ShieldCheck } from "lucide-react"

import { Container, Section } from "@/components/section"
import { assurances, type Assurance } from "@/lib/site"

const icons: Record<Assurance["icon"], typeof FileText> = {
  FileText,
  ShieldCheck,
  Receipt,
}

// Payments is reached from an invoice link, not browsed — so the index is a
// short, reassuring explainer rather than a marketing page.
export default function HomePage() {
  return (
    <Section>
      <Container size="lg" className="flex flex-col gap-16">
        <div className="flex max-w-[var(--container-md)] flex-col gap-5">
          <Eyebrow rule>Payments</Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Pay your invoice, securely.
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">
            Open the payment link from your invoice email to see the figures and
            pay by card. There&apos;s nothing to set up — the link takes you
            straight to the right invoice. If you don&apos;t have a link, just
            reply to my email and I&apos;ll send one over.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3">
          {assurances.map((item, i) => {
            const Icon = icons[item.icon]
            return (
              <div
                key={item.title}
                className="flex flex-col gap-3 bg-background p-6"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-primary" />
                  <Eyebrow index={String(i + 1).padStart(2, "0")}>Step</Eyebrow>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-balance">
                  {item.title}
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
