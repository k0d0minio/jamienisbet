import { LargeTitleHeader } from "@jamie-nisbet/ui"

import { AppMenu } from "@/components/app-menu"
import { PaletteTitleBarButton } from "@/components/command-palette"

// Every screen in the authenticated area opens through one of these: the app
// tier's scroll-linked header, and the content column under it.
//
// It is what replaced the sticky brand bar. The wordmark used to lead every
// page and the screen's own name came second, in the content, at 24px — so the
// app told you what it was called before it told you where you were. Now the
// screen declares its name, it sets large in the content the way a native app
// sets it, and it hands off to a compact material bar when you scroll past it.
// The only things the bar carries besides the name are, on a phone, the
// palette's search button and the monogram (from `md` the rail carries both),
// a screen's own bar buttons, and, on a detail view, the way back.
//
// The gutter lives here rather than on <main>, so the bar and the sheet of
// content it floats over can run edge to edge of the column while everything
// inside it stays on the same 16px margin. A screen's own rails still bleed
// with `-mx-4 px-4`, as they always did.
//
// So does the reading width. The shell hands every screen the whole window
// right of the rail; Work fills it (`wide`), and every other screen keeps the
// column it has always had until its own redesign decides otherwise.

/** The column every screen but Work keeps — what the shell used to impose. */
const READING_COLUMN = "mx-auto w-full max-w-5xl"

export function AppScreen({
  title,
  compactTitle,
  subtitle,
  masthead,
  back,
  actions,
  wide = false,
  children,
}: {
  /** The screen's name, sentence case. Becomes the page's real <h1>. */
  title: React.ReactNode
  /** A shorter form for the compact bar, where a long name would truncate. */
  compactTitle?: React.ReactNode
  /** One quiet line under the title — a count, a total, a state. */
  subtitle?: React.ReactNode
  /** What sits under the title and scrolls away with it — a `GlanceRow` of
   *  what the screen adds up to. Already inside the page gutter. */
  masthead?: React.ReactNode
  /** A detail view's way back, on the bar's leading edge. */
  back?: React.ReactNode
  /** The screen's own bar buttons, on the trailing edge before the app menu:
   *  a view switch, an add. Icon-only and 44px, the way a bar button is. */
  actions?: React.ReactNode
  /** Take the whole content area rather than the reading column — Work. */
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? "w-full" : READING_COLUMN}>
      {/* `vt-app-header` names the bar out of the page snapshot: it holds its
          position across a navigation while its title cross-fades — see
          globals.css § View transitions. */}
      <LargeTitleHeader
        className="vt-app-header"
        title={title}
        compactTitle={compactTitle}
        subtitle={subtitle}
        leading={back}
        trailing={
          <>
            {actions}
            <PaletteTitleBarButton />
            <AppMenu />
          </>
        }
      >
        {masthead}
      </LargeTitleHeader>
      <div className="px-app-gutter">{children}</div>
    </div>
  )
}
