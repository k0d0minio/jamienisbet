"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ChevronRight,
  Copy,
  ExternalLink,
  GitBranch,
  Scissors,
  UserRound,
} from "lucide-react"

import {
  Button,
  Meter,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from "@jamie-nisbet/ui"

import { copyPrompt, openSession } from "@/components/board-ticket-row"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import type { BatchKind } from "@/lib/tickets"

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
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      ) : null}
    </span>
  )
}

// One intake batch as a line item: name, how far along it is (from the stubs'
// `N of M` lines), what's next — and the board's gestures. Tap opens the
// batch's sheet with every stub in sequence; swipe right starts the next stub
// in Claude Code in one stroke; swipe left reveals copy-next / GitHub / the
// client. The sheet's rows are server-rendered and passed through as children.
export function BatchCard({
  batch,
  repoSlug,
  clientHref,
  next,
  recutUrl,
  children,
}: {
  batch: BatchSummary
  repoSlug: string
  /** The lead's profile, when a client row points at this repo. */
  clientHref: string | null
  next: { title: string; prompt: string | null; sessionUrl: string | null } | null
  /** The batch-level maintenance launcher — epics only. */
  recutUrl: string | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Bound to consts so the narrowing survives into the gesture closures.
  const nextPrompt = next?.prompt ?? null
  const nextSessionUrl = next?.sessionUrl ?? null

  const icon = "size-5"

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
        <SwipeAction
          label="Client"
          icon={<UserRound className={icon} aria-hidden />}
          className="bg-secondary text-secondary-foreground"
          onClick={() => router.push(clientHref)}
        />
      ) : null}
    </>
  )

  return (
    <>
      <SwipeRow
        className="rounded-lg border bg-card text-card-foreground"
        actions={actions}
        commit={
          nextSessionUrl
            ? {
                label: "Start next",
                icon: <ExternalLink className="size-5" aria-hidden />,
                className: "bg-primary text-primary-foreground",
                onCommit: () => openSession(nextSessionUrl),
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 w-full flex-col justify-center gap-1.5 bg-card px-4 py-3 text-left transition-colors active:bg-muted/50"
        >
          <span className="flex w-full items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {batch.title}
            </span>
            <CountDot count={batch.todayCount} className="bg-primary" label="picked for today" />
            <CountDot count={batch.blockedCount} className="bg-warning" label="blocked" />
            {batch.p0Count > 0 ? (
              <span className="shrink-0 text-xs font-medium text-destructive">P0</span>
            ) : null}
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {batch.open} open
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </span>
          {/* The thin bar is the epic's arc: what the breakdown planned vs
              what's still open. Piles (triage, backlog) have no arc to draw. */}
          {batch.planned !== null ? (
            <Meter
              value={batch.done}
              max={batch.planned}
              size="sm"
              aria-label={`${batch.done} of ${batch.planned} done`}
            />
          ) : null}
          {next ? (
            <span className="flex w-full min-w-0 items-baseline gap-1.5 text-xs text-muted-foreground">
              <span className="shrink-0">Next ·</span>
              <span className="truncate">{next.title}</span>
            </span>
          ) : null}
        </button>
      </SwipeRow>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{batch.title}</SheetTitle>
            <SheetDescription>
              {repoSlug} · {batch.open} open
              {batch.planned !== null
                ? ` · ${batch.done} of ${batch.planned} done`
                : ""}
            </SheetDescription>
          </SheetHeader>
          {/* The batch's own maintenance button: a session that re-grounds
              the breakdown in the current state of the code. The sheet body
              is a grid — justify, not align, keeps it hugging its label. */}
          {recutUrl ? (
            <Button asChild variant="secondary" size="sm" className="justify-self-start">
              <a href={recutUrl} target="_blank" rel="noreferrer">
                <Scissors aria-hidden />
                Recut this batch
              </a>
            </Button>
          ) : null}
          <ul className="flex flex-col gap-2">{children}</ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
