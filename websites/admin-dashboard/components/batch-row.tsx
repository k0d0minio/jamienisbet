"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ChevronRight,
  Copy,
  GitBranch,
  Scissors,
  UserRound,
} from "lucide-react"

import {
  GroupedRow,
  GroupedSection,
  Meter,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from "@jamie-nisbet/ui"

import { copyPrompt } from "@/components/board-ticket-row"
import { CopyLaunchRow } from "@/components/launch-menu"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import type { BatchKind, LaunchSet } from "@/lib/tickets"

// A batch's serializable summary — lib/tickets' Batch minus the Ticket objects
// (those render server-side and arrive as children).
export type BatchSummary = {
  slug: string
  kind: BatchKind
  title: string
  htmlUrl: string
  planned: number | null
  done: number
  open: number
  todayCount: number
  blockedCount: number
  p0Count: number
}

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

// One intake batch as a row in its repo's group: name, how far along it is
// (from the stubs' `N of M` lines), what's next — and the board's gestures.
// Tap opens the batch's sheet with every stub in sequence; swipe right starts
// copies the next stub's pick-up in one stroke; swipe left reveals copy-next /
// GitHub / the client. The sheet's rows are server-rendered and passed through
// as children.
//
// It used to be a bordered card in a two-up grid, which gave the board a
// different structure from every other screen in the app. It is a row in an
// inset group now, so a batch reads the way an invoice, a lead and a todo do —
// and it carries no radius or border of its own, because the group's slab owns
// the corners and clips the swipe tray to them.
export function BatchRow({
  batch,
  repoSlug,
  clientHref,
  next,
  recut,
  first,
  children,
}: {
  batch: BatchSummary
  repoSlug: string
  /** The lead's profile, when a client row points at this repo. */
  clientHref: string | null
  next: { title: string; prompt: string | null } | null
  /** The batch-level maintenance launcher — epics only. */
  recut: LaunchSet | null
  /** First row in its group: the group's own edge has already closed it, so it
   *  draws no hairline above itself. */
  first?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Bound to consts so the narrowing survives into the gesture closures.
  const nextPrompt = next?.prompt ?? null

  // Tray icons read at a glance under a moving thumb, so they set a step
  // larger than a row's own glyphs.
  const icon = "size-6"

  const actions = (
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
        // Grey rather than the old `bg-secondary`, which resolves to the page
        // background in the light theme — a tray column you can't see.
        <SwipeAction
          label="Client"
          icon={<UserRound className={icon} aria-hidden />}
          className="bg-muted-foreground text-background"
          onClick={() => router.push(clientHref)}
        />
      ) : null}
    </>
  )

  // An epic knows its arc — what the breakdown planned against what is still
  // open. A pile (triage, backlog) has none to draw, so its figure is simply
  // how much of it there is.
  const sequenced = batch.planned !== null
  const figure = sequenced ? `${batch.done} of ${batch.planned}` : `${batch.open} open`

  return (
    <li>
      <SwipeRow
        actions={actions}
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            // The fill is what hides the swipe tray behind the row; the
            // hairline is inset the way a native list insets it and rides
            // *inside* the moving content, so it travels with the row rather
            // than cutting across the tray.
            "relative flex min-h-app-touch w-full flex-col justify-center gap-1.5",
            "bg-app-group px-4 py-3 text-left transition-colors spring-press active:bg-app-press",
            // Wider row from `md`: the same row, more air, the way an iPad
            // grows a phone list.
            "md:px-5 md:py-3.5",
            !first &&
              "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-app-separator md:before:left-5"
          )}
        >
          <span className="flex w-full items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-app-body font-semibold text-app-label">
              {batch.title}
            </span>
            <CountDot
              count={batch.todayCount}
              className="bg-primary"
              label="picked for today"
            />
            <CountDot
              count={batch.blockedCount}
              className="bg-warning"
              label="blocked"
            />
            {batch.p0Count > 0 ? (
              <span className="shrink-0 text-app-footnote font-medium text-destructive">
                P0
              </span>
            ) : null}
            {/* A figure, so it sets in mono — the brand's signature, on every
                tier. */}
            <span className="shrink-0 font-mono text-app-subhead font-semibold tabular-nums text-app-label">
              {figure}
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-app-label-3"
              aria-hidden
            />
          </span>

          {/* The thin bar is the epic's arc, drawn only where there is one. */}
          {sequenced ? (
            <Meter
              value={batch.done}
              max={batch.planned ?? 0}
              size="sm"
              aria-label={`${batch.done} of ${batch.planned} done`}
            />
          ) : null}

          {next ? (
            <span className="flex w-full min-w-0 items-baseline gap-1.5 text-app-footnote text-app-label-3">
              <span className="shrink-0">Next ·</span>
              <span className="truncate">{next.title}</span>
            </span>
          ) : null}
        </button>
      </SwipeRow>

      {/* Two detents on a phone: the stub list rests at the half sheet with the
          board still visible behind it, and a drag up opens it fully to read a
          ticket. From `sm` it is the centred dialog, as every sheet here is. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent detents={["medium", "large"]}>
          <SheetHeader>
            <SheetTitle>{batch.title}</SheetTitle>
            <SheetDescription>
              <span className="font-mono">{repoSlug}</span> ·{" "}
              <span className="font-mono tabular-nums">{batch.open}</span> open
              {sequenced ? (
                <>
                  {" · "}
                  <span className="font-mono tabular-nums">
                    {batch.done} of {batch.planned}
                  </span>{" "}
                  done
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            {sequenced ? (
              <Meter
                value={batch.done}
                max={batch.planned ?? 0}
                size="sm"
                aria-label={`${batch.done} of ${batch.planned} done`}
              />
            ) : null}

            <GroupedSection
              header={
                batch.kind === "epic"
                  ? "Stubs, in sequence"
                  : "Tickets, by priority"
              }
            >
              <ul>{children}</ul>
            </GroupedSection>

            {/* What you can do to the batch itself, rather than to a ticket in
                it. The recut is tinted because it is this sheet's affirmative
                action; both are the same swipe actions the row carries, for
                the thumb that would rather tap than aim. */}
            <GroupedSection
              footer={
                recut
                  ? "A recut copies a prompt for a session that re-grounds the breakdown in the current state of the code. You send it."
                  : undefined
              }
            >
              {recut ? (
                <CopyLaunchRow
                  icon={<Scissors />}
                  variant="tint"
                  label="Recut this batch"
                  description="Refresh, resequence, split, retire"
                  prompt={recut.prompt}
                  launches={recut.launches}
                />
              ) : null}
              <GroupedRow
                icon={<GitBranch />}
                label="Open the batch on GitHub"
                href={batch.htmlUrl}
                target="_blank"
                rel="noreferrer"
                chevron={false}
              />
            </GroupedSection>
          </div>
        </SheetContent>
      </Sheet>
    </li>
  )
}
