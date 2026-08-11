import { ChevronRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

// Reference material that you look at once and then stop looking at — a lead's
// intake provenance, say. On a wide screen it costs nothing to leave open, so
// it renders as an ordinary card. On a phone every open card is scroll between
// you and the next thing, so it folds into a tap-to-open <details> — native, so
// it costs no JavaScript and works before hydration.
//
// The content is rendered in both branches and hidden with a media query rather
// than switched at runtime: that keeps this a server component with no
// hydration flash. Only pass static content — anything holding state would end
// up with two independent copies.
export function FoldCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Card className="overflow-hidden py-0 lg:hidden">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 transition-colors active:bg-muted/50">
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
              aria-hidden
            />
            <span className="flex-1 text-sm font-medium">{title}</span>
          </summary>
          <div className="border-t px-4 py-4">{children}</div>
        </details>
      </Card>

      {/* `lg:flex` rather than `lg:block` — Card is a flex column and relies on
          it for the gap between its header and content. */}
      <Card className="hidden lg:flex">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </>
  )
}
