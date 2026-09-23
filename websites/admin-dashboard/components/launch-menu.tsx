"use client"

import { useState, useTransition } from "react"
import { ChevronDown, Ellipsis } from "lucide-react"

import {
  AppMenu,
  AppMenuContent,
  AppMenuItem,
  AppMenuLabel,
  AppMenuTrigger,
  Button,
  GroupedRow,
  cn,
} from "@jamie-nisbet/ui"

import { copyToClipboard } from "@/lib/clipboard"
import { launchLinkProps, type Launch } from "@/lib/launchers"

// The board's launch controls. Every one of them copies on its default action
// — a tool link is never the default until it is proven, and the clipboard
// works on every surface — and offers the tools in a menu drawn from a
// `Launch[]` and nothing else: one entry per registered target, in the
// registry's order. No component here (or anywhere that uses these) names a
// tool: adding one is a file in `lib/launchers/` and a line in its registry,
// and parking one is a field in its file.

/** Every target as a menu row. One that can't express this launch — parked,
 * or a prompt past its cap — stays in the list, dimmed, with its reason as
 * the second line; never hidden. */
function LaunchMenuContent({ launches }: { launches: Launch[] }) {
  return (
    <AppMenuContent align="end">
      <AppMenuLabel>Open in</AppMenuLabel>
      {launches.map((launch) =>
        launch.url ? (
          <AppMenuItem
            key={launch.targetId}
            asChild
            description={launch.hint ? `Recommended ${launch.hint}` : undefined}
          >
            <a href={launch.url} {...launchLinkProps(launch)}>
              {launch.label}
            </a>
          </AppMenuItem>
        ) : (
          <AppMenuItem
            key={launch.targetId}
            disabled
            description={launch.unavailableReason}
          >
            {launch.label}
          </AppMenuItem>
        )
      )}
    </AppMenuContent>
  )
}

/**
 * The opened ticket's one real action, as a split button: the primary half
 * copies what the board sends for this ticket, the chevron lists every tool
 * it could open in instead.
 */
export function CopySplitButton({
  value,
  label,
  what,
  launches,
}: {
  value: string
  /** "Copy prompt", "Copy pick-up". */
  label: string
  /** What landed on the clipboard, for the toast. */
  what: string
  launches: Launch[]
}) {
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()

  async function onCopy() {
    if (!(await copyToClipboard(value, what))) return
    setCopied(true)
    // A transient flourish, kept out of the queue a server action would use.
    setTimeout(() => startTransition(() => setCopied(false)), 1500)
  }

  return (
    <div className="inline-flex items-stretch">
      <Button
        type="button"
        size="sm"
        className={cn(
          "text-app-footnote",
          launches.length > 0 && "rounded-r-none"
        )}
        onClick={onCopy}
      >
        {copied ? "Copied" : label}
      </Button>
      {launches.length > 0 ? (
        <AppMenu>
          <AppMenuTrigger asChild>
            {/* A hairline in the button's own foreground splits the two
                halves, the way a native split button draws its seam. */}
            <Button
              type="button"
              size="icon-sm"
              aria-label="Open in a tool"
              className="rounded-l-none border-l border-primary-foreground/25"
            >
              <ChevronDown aria-hidden />
            </Button>
          </AppMenuTrigger>
          <LaunchMenuContent launches={launches} />
        </AppMenu>
      ) : null}
    </div>
  )
}

/**
 * A grouped row whose tap copies a prompt, with the tools as a trailing `…`
 * menu — the maintenance, recut and estate-check launchers. The row and the
 * menu are separate targets, so the menu never copies and the row never
 * opens a tool.
 */
export function CopyLaunchRow({
  icon,
  label,
  description,
  variant,
  prompt,
  launches,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  variant?: "default" | "tint"
  prompt: string
  launches: Launch[]
}) {
  return (
    <GroupedRow
      icon={icon}
      label={label}
      description={description}
      variant={variant}
      onClick={() => void copyToClipboard(prompt, "Prompt")}
      accessory={
        launches.length > 0 ? (
          <AppMenu>
            <AppMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${label} — open in a tool`}
                className="text-app-label-3"
              >
                <Ellipsis aria-hidden />
              </Button>
            </AppMenuTrigger>
            <LaunchMenuContent launches={launches} />
          </AppMenu>
        ) : undefined
      }
    />
  )
}
