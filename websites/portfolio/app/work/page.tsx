import type { Metadata } from "next"
import Link from "next/link"

import { Container, Section, SectionHeading } from "@/components/section"
import { CaseStudyCard } from "@/components/case-study-card"
import { getCaseStudies } from "@/lib/work"

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Jamie Nisbet — the problem, what I did, and the result.",
}

export default function WorkPage() {
  const studies = getCaseStudies()

  return (
    <Section>
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Work"
          title="Selected work"
          intro="Case studies of real projects — the problem, what I did, and the result."
        />

        {studies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {studies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Case studies are on the way.{" "}
            <Link
              href="/#contact"
              className="text-primary underline-offset-4 hover:underline"
            >
              Get in touch
            </Link>{" "}
            in the meantime.
          </p>
        )}
      </Container>
    </Section>
  )
}
