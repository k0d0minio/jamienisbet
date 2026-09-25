import { AccountMenu } from "@/components/account-menu"
import { PaletteTitleBarButton } from "@/components/command-palette"

// The screens that are one column rather than panes — Money, "not here",
// "didn't load", the phone's leads list — open through this: a flat title bar
// on the desk tier, and the content column under it.
//
// The bar is the pane header's shape (BRAND.md § Desk tier): the screen's name
// at the heading step, a quiet line under it, and trailing controls, on a
// hairline. It sticks, so the name never scrolls away — there is no large
// title to hand off from. Besides the name the bar carries, on a phone, the
// palette's search button and the account menu (from `md` the rail carries
// both), a screen's own bar buttons, and, on a detail view, the way back.
//
// The gutter lives here rather than on <main>, so the bar can run edge to edge
// of the column while everything inside it stays on the same 16px margin.
//
// So does the reading width: every screen but Work keeps the column it has
// always had, unless it asks for the whole content area (`wide`).

/** The column every screen but Work keeps. */
const READING_COLUMN = "mx-auto w-full max-w-5xl"

export function DeskScreen({
  title,
  subtitle,
  masthead,
  back,
  actions,
  wide = false,
  children,
}: {
  /** The screen's name, sentence case. Becomes the page's real <h1>. */
  title: React.ReactNode
  /** One quiet line under the title — a count, a total, a state. */
  subtitle?: React.ReactNode
  /** What sits under the bar and scrolls with the page — the figures the
   *  screen adds up to. Already inside the page gutter. */
  masthead?: React.ReactNode
  /** A detail view's way back, on the bar's leading edge. */
  back?: React.ReactNode
  /** The screen's own bar buttons, on the trailing edge before the account
   *  menu: a view switch, an add. */
  actions?: React.ReactNode
  /** Take the whole content area rather than the reading column. */
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? "w-full" : READING_COLUMN}>
      {/* `vt-app-header` names the bar out of the page snapshot: it holds its
          position across a navigation while the content under it changes —
          see globals.css § View transitions. */}
      <header
        className="vt-app-header sticky top-0 z-20 border-b border-desk-line bg-desk-canvas px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex min-h-desk-pane-header items-center gap-2 py-2">
          {back}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-desk-heading font-bold text-desk-fg">
              {title}
            </h1>
            {subtitle != null && (
              // A div rather than a <p>: a loading screen puts a Skeleton bar
              // here, and a div inside a <p> is a hydration error.
              <div className="truncate text-desk-meta text-desk-fg-3">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <PaletteTitleBarButton />
            <AccountMenu />
          </div>
        </div>
      </header>
      {masthead != null && <div className="px-4 pt-4 pb-3">{masthead}</div>}
      <div className="px-4">{children}</div>
    </div>
  )
}
