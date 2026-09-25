"use client"

import { useDesk } from "@/components/use-desk"

// Work's two layouts, one of them live: the three desk panes from `lg`, the
// phone board under it. Both arrive rendered from the server; until the width
// is known (hydration) both stand behind their CSS breakpoints so either
// width paints right, and from then on only the live one is mounted — one
// keyboard, one URL resolver, one refresh button, never two answering at once.
export function WorkScreen({
  desk,
  phone,
}: {
  desk: React.ReactNode
  phone: React.ReactNode
}) {
  const atDesk = useDesk()
  if (atDesk === true) return desk
  if (atDesk === false) return phone
  return (
    <>
      <div className="hidden lg:contents">{desk}</div>
      <div className="lg:hidden">{phone}</div>
    </>
  )
}
