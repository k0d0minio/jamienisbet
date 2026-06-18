import { Eyebrow } from "@jamie-nisbet/ui"
import { Mail, MapPin } from "lucide-react"

import { Container, Section } from "@/components/section"
import { ContactForm } from "@/components/contact-form"
import { site } from "@/lib/site"

export function ContactSection() {
  return (
    <Section id="contact">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <Eyebrow rule index="05">
            Contact
          </Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Let&apos;s talk about your project.
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            Tell me what you&apos;re trying to do. I&apos;ll reply within a day or two with a few
            questions or, if it&apos;s a fit, a way forward. No hard sell.
          </p>

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
            My standard rate is{" "}
            <span className="font-medium text-foreground">€120/hour</span>, usually quoted as a
            fixed price for the scope — with options, so you can pick what fits.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <ContactForm />
        </div>
      </Container>
    </Section>
  )
}
