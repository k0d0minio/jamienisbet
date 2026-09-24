"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, Copy, GitBranch, UserRound } from "lucide-react"

import { Meter, cn } from "@jamie-nisbet/ui"

import { copyPrompt } from "@/components/board-ticket-row"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import type { ListBatch } from "@/components/board-model"

/** The hairline between rows, inset the way a native list insets it. It rides
 *  inside the moving content, so it travels with a swiped row rather than
 *  cutting across the tray. */
const ROW_HAIRLINE =
  "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"

/** A tiny status mark on the scan line: coloured dot, count only past one. */
function CountDot({
  count,
  className,
  label,
}: {
  count: number
  className: string
  label: string
}) {
  if (count === 0) return null
  return (
    <span
      className="flex shrink-0 items-center gap-1"
      aria-label={`${count} ${label}`}
    >
      <span className={cn("size-1.5 rounded-full", className)} aria-hidden />
      {count > 1 ? (
        <span className="font-mono text-app-caption-2 tabular-nums text-app-label-3">
          {count}
        </span>
      ) : null}
    </span>
  )
}

/** An epic knows its arc — what the breakdown planned against what is still
 *  open. A pile (triage, backlog) has none to draw, so its figure is simply
 *  how much of it there is; In flight counts its runs. */
function batchFigure(batch: ListBatch): string {
  if (batch.planned !== null) return `${batch.done} of ${batch.planned}`
  const open = batch.tickets.length
  if (batch.kind === "runs") return `${open} ${open === 1 ? "run" : "runs"}`
  return `${open} open`
}

/** The name, the figure and the arc — the scan line a batch reads as on the
 *  list. */
function BatchLine({ batch }: { batch: ListBatch }) {
  return (
    <>
      <span className="flex w-full items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-app-body font-semibold text-app-label">
          {batch.title}
        </span>
        <CountDot
          count={batch.todayCount}
          className="bg-primary"
          label="picked for today"
        />
        <CountDot count={batch.blockedCount} className="bg-warning" label="blocked" />
        {batch.p0Count > 0 ? (
          <span className="shrink-0 text-app-footnote font-medium text-destructive">
            P0
          </span>
        ) : null}
        {/* A figure, so it sets in mono — the brand's signature, on every
            tier. */}
        <span className="shrink-0 font-mono text-app-subhead font-semibold tabular-nums text-app-label">
          {batchFigure(batch)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-app-label-3" aria-hidden />
      </span>

      {/* The thin bar is the epic's arc, drawn only where there is one. */}
      {batch.planned !== null ? (
        <Meter
          value={batch.done}
          max={batch.planned}
          size="sm"
          aria-label={`${batch.done} of ${batch.planned} done`}
        />
      ) : null}
    </>
  )
}

// One batch as a row in its repo's group on list level 0: name, how far along
// it is (from the stubs' `N of M` lines), what's next — and the board's
// gestures. A tap drills the list into the batch's stubs (and, on a desktop,
// opens the batch in the pane); swipe right copies the next stub's pick-up in
// one stroke; swipe left reveals copy-next / GitHub / the client.
//
// In flight is the one row without gestures: it has no "next" to copy, and
// each run carries its own swipes one level down.
//
// A row in an inset group, carrying no radius or border of its own: the
// group's slab owns the corners and clips the swipe tray to them.
export function BatchRow({
  batch,
  clientHref,
  first,
  onSelect,
}: {
  batch: ListBatch
  /** The lead's profile, when a client row points at this repo. */
  clientHref: string | null
  /** First row in its group: the group's own edge has already closed it, so it
   *  draws no hairline above itself. */
  first?: boolean
  onSelect: () => void
}) {
  const router = useRouter()

  // The verb where the repo carries the router, the prompt body where it does
  // not — what "Copy next" puts on the clipboard (D26). Bound to a const so the
  // narrowing survives into the gesture closures.
  const nextPrompt = batch.next?.pickup ?? null

  const row = (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        // The fill is what hides the swipe tray behind the row.
        "relative flex min-h-app-touch w-full flex-col justify-center gap-1.5",
        "bg-app-group px-4 py-3 text-left transition-colors spring-press active:bg-app-press",
        // Wider row from `md`: the same row, more air, the way an iPad grows a
        // phone list.
        "md:px-5 md:py-3.5",
        !first && ROW_HAIRLINE
      )}
    >
      <BatchLine batch={batch} />
      {batch.next ? (
        <span className="flex w-full min-w-0 items-baseline gap-1.5 text-app-footnote text-app-label-3">
          <span className="shrink-0">Next ·</span>
          <span className="truncate">{batch.next.title}</span>
        </span>
      ) : null}
    </button>
  )

  if (batch.kind === "runs") return <li>{row}</li>

  // Tray icons read at a glance under a moving thumb, so they set a step
  // larger than a row's own glyphs.
  const icon = "size-6"

  return (
    <li>
      <SwipeRow
        actions={
          <>
            {nextPrompt ? (
              <SwipeAction
                label="Copy next"
                icon={<Copy className={icon} aria-hidden />}
                className="bg-muted-foreground text-background"
                onClick={() => copyPrompt(nextPrompt)}
              />
            ) : null}
            <SwipeAction
              label="GitHub"
              icon={<GitBranch className={icon} aria-hidden />}
              className="bg-primary text-primary-foreground"
              href={batch.htmlUrl}
              external
            />
            {clientHref ? (
              // Grey rather than `bg-secondary`, which resolves to the page
              // background in the light theme — a tray column you can't see.
              <SwipeAction
                label="Client"
                icon={<UserRound className={icon} aria-hidden />}
                className="bg-muted-foreground text-background"
                onClick={() => router.push(clientHref)}
              />
            ) : null}
          </>
        }
        commit={
          nextPrompt
            ? {
                label: "Copy next",
                icon: <Copy className="size-6" aria-hidden />,
                // The leading full swipe takes the tint, the way the native one
                // does — the app's own affirmative action, not a semantic state.
                className: "bg-app-tint text-primary-foreground",
                onCommit: () => copyPrompt(nextPrompt),
              }
            : undefined
        }
      >
        <span className="sr-only">{`Swipe for actions on ${batch.title}`}</span>
        {row}
      </SwipeRow>
    </li>
  )
}
