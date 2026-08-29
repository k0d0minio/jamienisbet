"use client"

import * as React from "react"

import { CollapsingHeader } from "./collapsing-header"

// APP TIER — the scroll-linked large title.
//
// The screen opens with its name set large in the content, the way a native
// app does: the title is part of what you are reading, not a bar bolted to
// the top. Scroll past it and it hands off — a compact material bar takes
// over, carrying the same name in a title-bar weight, so you never lose
// where you are.
//
// Requires "@jamie-nisbet/ui/app.css" — the marketing entry never loads it.
//
//   <LargeTitleHeader
//     title="Leads"
//     subtitle="14 open, 3 gone quiet"
//     leading={<BackLink />}
//     trailing={<IconButton …/>}
//   />
//   <GroupedList>…</GroupedList>
//
// The hand-off itself lives in CollapsingHeader, which IdentityHeader shares —
// this component is the list-screen masthead: a name, a quiet line under it,
// and whatever the screen puts beneath both.

function LargeTitleHeader({
  title,
  compactTitle,
  subtitle,
  children,
  ...props
}: Omit<
  React.ComponentProps<typeof CollapsingHeader>,
  "compactTitle" | "masthead"
> & {
  /** The screen's name. Sentence case, and the page's real `<h1>`. */
  title: React.ReactNode
  /** A shorter form for the compact bar, when the large title is too long. */
  compactTitle?: React.ReactNode
  /** One quiet line under the title — a count, a state, a date. */
  subtitle?: React.ReactNode
}) {
  return (
    <CollapsingHeader
      compactTitle={compactTitle ?? title}
      masthead={
        <div data-slot="large-title" className="px-app-gutter pt-1 pb-3">
          <h1 className="text-app-large-title font-bold text-app-label">
            {title}
          </h1>
          {subtitle != null && (
            <p className="mt-1 text-app-subhead text-app-label-3">{subtitle}</p>
          )}
          {children}
        </div>
      }
      {...props}
    />
  )
}

export { LargeTitleHeader }
