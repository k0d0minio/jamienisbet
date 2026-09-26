import { AccountMenu } from "@/components/account-menu"
import { PaletteTitleBarButton } from "@/components/command-palette"

// The phone title bar's trailing controls, wherever a title bar has one: the
// palette's search button and the account menu. From `md` the rail carries
// both (nav.tsx), so this renders nothing there — each of the two self-hides
// via its own `md:hidden`, and the wrapper repeats it so the pair takes no
// space either.

/** The palette's search button and the account menu, in that order. */
export function PhoneChrome() {
  return (
    <div className="flex items-center gap-1 md:hidden">
      <PaletteTitleBarButton />
      <AccountMenu />
    </div>
  )
}
