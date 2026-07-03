import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { DealStageNav } from "@/components/deal-stage-nav"

// Shared chrome for every deal sub-page (the stages, documents, details): a
// back link to the deal hub, the page's own title, and the stage tab bar.
// Kept compact so the actual work sits high on a phone screen.
export function DealPageHeader({
  dealId,
  dealTitle,
  title,
  description,
}: {
  dealId: string
  dealTitle: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/deals/${dealId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="truncate">{dealTitle}</span>
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <DealStageNav dealId={dealId} />
    </div>
  )
}
