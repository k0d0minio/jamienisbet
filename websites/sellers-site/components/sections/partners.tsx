import { Eyebrow } from "@jamie-nisbet/ui"
import { Check, Handshake } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { partnerPerks } from "@/lib/site"

export function Partners() {
  return (
    <Section id="partners" className="border-b border-border">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Partners"
            index="03"
            title="Already serve the same customers? Let's trade work."
            intro="Accountants, print shops, co-working spaces, agencies — refer the web and software work you can't do, and I'll send clients your way too."
          />
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Handshake className="size-4" />
            Reciprocal, high-trust, zero ad spend.
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:pt-2">
          <Eyebrow>What you get</Eyebrow>
          <ul className="flex flex-col gap-4">
            {partnerPerks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground/90">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
