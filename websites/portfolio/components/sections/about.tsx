import { Eyebrow } from "@jamie-nisbet/ui"
import { Check, MapPin } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { howIWork, site } from "@/lib/site"

export function About() {
  return (
    <Section id="about" className="border-b border-border">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="About"
            index="04"
            title="A senior engineer you can actually reach."
          />
          <div className="flex flex-col gap-4 text-lg text-muted-foreground">
            <p>
              I&apos;m Jamie Nisbet, a software engineer and AI consultant based in{" "}
              {site.location}. I&apos;ve spent years building software for the web, and I now
              design AI systems meant to run for the long term — well-defined, documented, and
              built to scale, not bolted-on demos that break a month later.
            </p>
            <p>
              I work as a small shop on purpose. You deal with the person writing the code, so
              decisions are quick and nothing gets lost in translation. For bigger builds I bring
              in trusted contractors — you keep the responsiveness and gain the capacity.
            </p>
            <p>
              Most of what I build has one job: take the admin and busywork off your plate, so
              your time goes back to the business and its customers. I care about doing the useful
              thing, explaining the why, and being straight about trade-offs and cost. If
              something&apos;s a bad idea, I&apos;ll tell you.
            </p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {site.location}
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:pt-2">
          <Eyebrow>How I work</Eyebrow>
          <ul className="flex flex-col gap-4">
            {howIWork.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
