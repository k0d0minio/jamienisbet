import { ChevronRight } from "lucide-react"

import { Card, cn } from "@jamie-nisbet/ui"

// A card that folds to its title on every size — for the occasional thing (a
// create form, the danger zone) that would otherwise sit fully open between
// the reader and the list they came for. Unlike FoldCard, the children render
// exactly once, so interactive client components are safe inside.
export function DisclosureCard({
  title,
  titleClassName,
  children,
}: {
  title: string
  titleClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden py-0">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 transition-colors active:bg-muted/50 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          />
          <span className={cn("flex-1 text-sm font-medium", titleClassName)}>
            {title}
          </span>
        </summary>
        <div className="border-t px-4 py-4">{children}</div>
      </details>
    </Card>
  )
}
