import { LogoLoader } from "@jamie-nisbet/ui"

// The one line a loading screen writes rather than draws: the JN icon,
// drawing itself in and breathing, beside the word. It sits where the screen's
// subtitle (or a profile's meta line) will land, so the skeleton under it stays
// layout-true and the brand still says "this is loading" in its own hand —
// the same indicator pull-to-refresh and the board's refresh show.
//
// Decorative here: every loading screen already carries an sr-only status line
// naming what is loading, so the icon hides and the text is aria-hidden too.
export function LoadingLine({ children = "Loading" }: { children?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-app-subhead text-app-label-3"
      aria-hidden="true"
    >
      <LogoLoader className="size-4" role={undefined} aria-label={undefined} />
      {children}
    </span>
  )
}
