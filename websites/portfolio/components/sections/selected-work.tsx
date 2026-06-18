import Link from "next/link"
import { Button } from "@jamie-nisbet/ui"
import { ArrowRight } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { CaseStudyCard } from "@/components/case-study-card"
import { getFeaturedCaseStudies } from "@/lib/work"

export function SelectedWork() {
  const studies = getFeaturedCaseStudies()

  return (
    <Section id="work" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Selected work"
            index="02"
            title="A few things I've shipped."
            intro="Case studies of real projects — the problem, what I did, and the result."
          />
          {studies.length > 0 && (
            <Button asChild variant="ghost" className="w-fit shrink-0">
              <Link href="/work">
                All work
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>

        {studies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {studies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
            {studies.length < 3 && <MoreComing />}
          </div>
        ) : (
          <EmptyWork />
        )}
      </Container>
    </Section>
  )
}

// Shown while the work section is still filling up — signals it's growing, not empty.
function MoreComing() {
  return (
    <Link
      href="/#contact"
      className="group flex min-h-44 flex-col justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center transition-colors hover:border-border-strong hover:bg-muted"
    >
      <p className="font-medium">More case studies on the way</p>
      <p className="text-sm text-muted-foreground">
        Got a project in mind?{" "}
        <span className="text-primary group-hover:underline">Let&apos;s talk →</span>
      </p>
    </Link>
  )
}

function EmptyWork() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-8">
      <p className="font-medium">Case studies are on the way.</p>
      <p className="max-w-prose text-sm text-muted-foreground">
        I&apos;m writing up recent projects now. In the meantime, tell me what you&apos;re
        working on — I&apos;m happy to share relevant examples directly.
      </p>
      <Button asChild variant="outline" className="mt-1">
        <Link href="/#contact">
          Get in touch
          <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
