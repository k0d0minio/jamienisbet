"use client"

import { ChevronDown, Ellipsis, ExternalLink } from "lucide-react"

import {
  AppMenu,
  AppMenuContent,
  AppMenuItem,
  AppMenuLabel,
  AppMenuTrigger,
  Button,
  cn,
} from "@jamie-nisbet/ui"

import { launchLinkProps, primaryLaunch, type Launch } from "@/lib/launchers"

// The board's launch controls, drawn from a `Launch[]` and nothing else — one
// entry per registered target, in the registry's order, the default first. No
// component here (or anywhere that uses these) names a tool: adding one is a
// file in `lib/launchers/` and a line in its registry, and it shows up in
// every menu on its own.

/** Every target as a menu row. One that can't express this launch stays in
 * the list, dimmed, with its reason as the second line — never hidden. */
function LaunchMenuContent({ launches }: { launches: Launch[] }) {
  return (
    <AppMenuContent align="end">
      <AppMenuLabel>Start in</AppMenuLabel>
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
 * starts the default target, the chevron lists every target. When the default
 * can't carry the launch the primary half stays, disabled — the caller says
 * why beside it — and the menu shows the same reason on each row it applies to.
 */
export function LaunchButton({ launches }: { launches: Launch[] }) {
  const primary = primaryLaunch(launches)
  if (!primary) return null

  return (
    <div className="inline-flex items-stretch">
      {primary.url ? (
        <Button
          asChild
          size="sm"
          className="rounded-r-none text-app-footnote"
        >
          <a href={primary.url} {...launchLinkProps(primary)}>
            <ExternalLink aria-hidden />
            Start in {primary.label}
          </a>
        </Button>
      ) : (
        <Button size="sm" disabled className="rounded-r-none text-app-footnote">
          <ExternalLink aria-hidden />
          Start in {primary.label}
        </Button>
      )}
      <AppMenu>
        <AppMenuTrigger asChild>
          {/* A hairline in the button's own foreground splits the two halves,
              the way a native split button draws its seam. */}
          <Button
            size="icon-sm"
            aria-label="Start in another tool"
            className="rounded-l-none border-l border-primary-foreground/25"
          >
            <ChevronDown aria-hidden />
          </Button>
        </AppMenuTrigger>
        <LaunchMenuContent launches={launches} />
      </AppMenu>
    </div>
  )
}

/**
 * The same menu as a grouped row's trailing accessory: the row itself still
 * taps through to the default target, and this is the second target of the
 * row, one 44px control at its end.
 */
export function LaunchMenuAccessory({
  launches,
  label,
  className,
}: {
  launches: Launch[]
  /** What the row launches, for the control's accessible name. */
  label: string
  className?: string
}) {
  if (launches.length === 0) return null
  return (
    <AppMenu>
      <AppMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${label} — start in another tool`}
          className={cn("text-app-label-3", className)}
        >
          <Ellipsis aria-hidden />
        </Button>
      </AppMenuTrigger>
      <LaunchMenuContent launches={launches} />
    </AppMenu>
  )
}
