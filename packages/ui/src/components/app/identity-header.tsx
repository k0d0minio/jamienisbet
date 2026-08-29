"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { CollapsingHeader } from "./collapsing-header"
import { Monogram } from "./monogram"

// APP TIER — the Contacts-style identity masthead.
//
// A profile screen opens on the person, not on a heading that happens to be
// their name: a disc, the name set large beside it, what they are under that,
// and the one figure that qualifies the whole record set in mono on the
// trailing edge. Scroll past it and the compact bar takes the name, exactly as
// a list screen's large title hands off — the mechanism is shared
// (CollapsingHeader), only the masthead differs.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <IdentityHeader
//     name="Ana Ferreira"
//     meta="Keel · client"
//     figure={<>€1,500<small>/mo</small></>}
//     figureLabel="Value"
//     leading={<BackLink />}
//     badges={<DealBadges … />}
//   >
//     <ActionCircleRow>…</ActionCircleRow>
//   </IdentityHeader>
//
// Children sit below the hand-off point — the action row scrolls with the
// page but the bar has already taken over by the time it leaves.

function IdentityHeader({
  name,
  compactTitle,
  meta,
  figure,
  figureLabel,
  badges,
  avatar,
  children,
  ...props
}: Omit<
  React.ComponentProps<typeof CollapsingHeader>,
  "compactTitle" | "masthead"
> & {
  /** Whose screen this is. Sentence case as they wrote it, and the real <h1>. */
  name: string
  /** A shorter form for the compact bar, when the name would truncate. */
  compactTitle?: React.ReactNode
  /** What they are, under the name — company, status, the state of the record. */
  meta?: React.ReactNode
  /** The one figure that qualifies the record. Always mono; always a figure. */
  figure?: React.ReactNode
  /** What the figure is, in a caption above it. */
  figureLabel?: React.ReactNode
  /** Terms and warnings that ride with the identity, as badges. */
  badges?: React.ReactNode
  /** Replaces the derived monogram — for the day there are photographs. */
  avatar?: React.ReactNode
}) {
  return (
    <CollapsingHeader
      compactTitle={compactTitle ?? name}
      masthead={
        <div
          data-slot="identity"
          className={cn(
            "flex flex-col gap-3 px-app-gutter pt-1",
            badges != null ? "pb-3" : "pb-4"
          )}
        >
          <div className="flex items-start gap-4">
            {avatar ?? <Monogram name={name} size="lg" />}

            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
              <h1 className="text-app-title-1 font-bold text-app-label">
                {name}
              </h1>
              {meta != null && (
                <p className="text-app-subhead text-app-label-3">{meta}</p>
              )}
            </div>

            {figure != null && (
              <div className="flex shrink-0 flex-col items-end gap-0.5 pt-1 text-right">
                {figureLabel != null && (
                  <span className="text-app-caption-2 text-app-label-3">
                    {figureLabel}
                  </span>
                )}
                <span className="font-mono text-app-title-3 font-semibold text-app-label">
                  {figure}
                </span>
              </div>
            )}
          </div>

          {badges}
        </div>
      }
      {...props}
    >
      {children}
    </CollapsingHeader>
  )
}

export { IdentityHeader }
