import { ChevronRight } from "lucide-react"

import { Badge, Card } from "@jamie-nisbet/ui"

// The strip above the leads list: todos and compliance dates, folded away by
// default so they never compete with the leads for attention. The summary line
// is the whole point — it says whether anything in there needs opening today,
// and a native <details> means that costs no JavaScript.
export function WorkingList({
  openTasks,
  overdueTasks,
  openCompliance,
  overdueCompliance,
  children,
}: {
  openTasks: number
  overdueTasks: number
  openCompliance: number
  overdueCompliance: number
  children: React.ReactNode
}) {
  const overdue = overdueTasks + overdueCompliance
  const parts: string[] = []
  if (openTasks > 0) parts.push(`${openTasks} todo${openTasks === 1 ? "" : "s"}`)
  if (openCompliance > 0) {
    parts.push(`${openCompliance} compliance date${openCompliance === 1 ? "" : "s"}`)
  }

  return (
    <Card className="overflow-hidden py-0">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted/50">
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          />
          <span className="flex-1 text-sm">
            {parts.length > 0 ? (
              parts.join(" · ")
            ) : (
              <span className="text-muted-foreground">
                Nothing on your list
              </span>
            )}
          </span>
          {overdue > 0 ? (
            <Badge variant="destructive">{overdue} overdue</Badge>
          ) : null}
        </summary>
        {children}
      </details>
    </Card>
  )
}
