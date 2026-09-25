import { cn } from "@jamie-nisbet/ui"

// The figures a one-column screen adds up to, under its title bar — Money's
// balances. A plain row of mono figures on the desk tier: the figure at the
// figure step, tabular, and one or two words under it. It wraps rather than
// scrolls: there are never enough of these to need a rail.

export function MoneyFigures({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return (
    <dl
      className={cn("flex flex-wrap items-start gap-x-8 gap-y-3", className)}
      {...props}
    />
  )
}

export function MoneyFigure({
  value,
  label,
}: {
  /** The figure, pre-formatted by the caller (currency, units, compaction). */
  value: React.ReactNode
  /** One or two words under it, sentence case — "Available", "Pending". */
  label: React.ReactNode
}) {
  return (
    // The label is the term and the figure its value; the figure is drawn
    // first because it is what the eye goes to.
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="truncate text-desk-meta text-desk-fg-3">{label}</dt>
      <dd className="font-mono text-desk-figure tabular-nums text-desk-fg">
        {value}
      </dd>
    </div>
  )
}
