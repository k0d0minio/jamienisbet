import { IdentityHeader, LargeTitleHeader } from "@jamie-nisbet/ui"

import { AppMenu } from "@/components/app-menu"

// Every screen in the authenticated area opens through one of these: the app
// tier's scroll-linked header, and the content column under it.
//
// It is what replaced the sticky brand bar. The wordmark used to lead every
// page and the screen's own name came second, in the content, at 24px — so the
// app told you what it was called before it told you where you were. Now the
// screen declares its name, it sets large in the content the way a native app
// sets it, and it hands off to a compact material bar when you scroll past it.
// The only thing the bar carries besides the name is the monogram (phones —
// the sidebar has it from `md` up) and, on a detail view, the way back.
//
// The gutter lives here rather than on <main>, so the bar and the sheet of
// content it floats over can run edge to edge of the column while everything
// inside it stays on the same 16px margin. A screen's own rails still bleed
// with `-mx-4 px-4`, as they always did.
export function AppScreen({
  title,
  compactTitle,
  subtitle,
  back,
  children,
}: {
  /** The screen's name, sentence case. Becomes the page's real <h1>. */
  title: React.ReactNode
  /** A shorter form for the compact bar, where a long name would truncate. */
  compactTitle?: React.ReactNode
  /** One quiet line under the title — a count, a total, a state. */
  subtitle?: React.ReactNode
  /** A detail view's way back, on the bar's leading edge. */
  back?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      {/* `vt-app-header` names the bar out of the page snapshot: it holds its
          position across a navigation while its title cross-fades — see
          globals.css § View transitions. */}
      <LargeTitleHeader
        className="vt-app-header"
        title={title}
        compactTitle={compactTitle}
        subtitle={subtitle}
        leading={back}
        trailing={<AppMenu />}
      />
      <div className="px-app-gutter">{children}</div>
    </>
  )
}

// A profile screen — one person, one record — opens on *them* rather than on a
// heading: the Contacts masthead, then the actions, then the record as grouped
// sections. Same bar, same hand-off, same menu as AppScreen; the difference is
// what scrolls away above the fold, and that the content here is a
// `GroupedList`, which owns the gutter itself.
export function AppProfileScreen({
  name,
  compactTitle,
  meta,
  figure,
  figureLabel,
  badges,
  avatar,
  back,
  actions,
  children,
}: {
  /** Whose screen this is. Becomes the page's real <h1>. */
  name: string
  compactTitle?: React.ReactNode
  /** What they are, under the name — company, status. */
  meta?: React.ReactNode
  /** The figure that qualifies the record, set in mono beside the name. */
  figure?: React.ReactNode
  figureLabel?: React.ReactNode
  /** Terms and warnings that ride with the identity. */
  badges?: React.ReactNode
  /** Replaces the derived monogram — a skeleton disc while the record loads. */
  avatar?: React.ReactNode
  back?: React.ReactNode
  /** The circular action row, directly under the identity. */
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <IdentityHeader
        className="vt-app-header"
        name={name}
        compactTitle={compactTitle}
        meta={meta}
        figure={figure}
        figureLabel={figureLabel}
        badges={badges}
        avatar={avatar}
        leading={back}
        trailing={<AppMenu />}
      >
        {actions}
      </IdentityHeader>
      {children}
    </>
  )
}
