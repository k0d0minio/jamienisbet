"use client"

import { createContext, useContext } from "react"

import { useDesk } from "@/components/use-desk"

// Work's two layouts, one of them live: the three desk panes from `lg`, the
// phone's levels under it (work-phone.tsx). Both arrive rendered from the server; until the width
// is known (hydration) both stand behind their CSS breakpoints so either
// width paints right, and neither is live — neither may rewrite the URL or
// take a key, or the hidden one would correct the address for the one on
// screen. Once the width is known only the live one stays mounted: one
// keyboard, one URL resolver, one refresh button. The two wrappers never
// change place, so the live layout is not remounted when the width settles.

const LiveContext = createContext(true)

/** Whether this layout is the one on screen — false through hydration, and
 *  for the other layout. */
export function useWorkLive(): boolean {
  return useContext(LiveContext)
}

export function WorkScreen({
  desk,
  phone,
}: {
  desk: React.ReactNode
  phone: React.ReactNode
}) {
  const atDesk = useDesk()
  const settled = atDesk !== null
  return (
    <>
      <div className={settled ? "contents" : "hidden lg:contents"}>
        <LiveContext.Provider value={atDesk === true}>
          {atDesk === false ? null : desk}
        </LiveContext.Provider>
      </div>
      <div className={settled ? "contents" : "lg:hidden"}>
        <LiveContext.Provider value={atDesk === false}>
          {atDesk === true ? null : phone}
        </LiveContext.Provider>
      </div>
    </>
  )
}
