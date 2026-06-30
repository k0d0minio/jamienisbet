import { Link } from "@/i18n/navigation"
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
} from "@jamie-nisbet/ui"
import { ArrowUpRight } from "lucide-react"

import type { CaseStudy } from "@/lib/work"

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Card className="group relative gap-4 transition-shadow hover:shadow-md">
      <CardHeader>
        <Eyebrow index={String(study.year)}>{study.client}</Eyebrow>
        <CardTitle className="text-xl">
          <Link
            href={`/work/${study.slug}`}
            className="after:absolute after:inset-0"
          >
            {study.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 text-sm text-muted-foreground">
        {study.summary}
      </CardContent>

      <CardFooter className="flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {study.services.slice(0, 3).map((service) => (
            <Badge key={service} variant="secondary">
              {service}
            </Badge>
          ))}
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </CardFooter>
    </Card>
  )
}
