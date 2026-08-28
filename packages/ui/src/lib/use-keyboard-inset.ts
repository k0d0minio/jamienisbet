"use client"

import * as React from "react"

// How much of the layout viewport the on-screen keyboard is currently covering.
//
// A bottom sheet is pinned to the bottom of the *layout* viewport, and on iOS
// that viewport doesn't move when the keyboard opens — so without this the
// sheet's submit button, and usually the field being typed into, sit behind the
// keyboard. `visualViewport` is what actually shrinks, and the difference
// between the two is the inset to lift by.
//
// Chrome on Android can be told to shrink the layout viewport instead
// (`interactive-widget=resizes-content` in the viewport meta), in which case
// this reads ~0 and the two mechanisms simply don't fight.
//
// Returns 0 everywhere the API is missing, which is every desktop browser and
// the server — so the caller needs no guard of its own.
export function useKeyboardInset(): number {
  const [inset, setInset] = React.useState(0)

  React.useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    function measure() {
      if (!viewport) return
      // `offsetTop` is the part of the visual viewport already scrolled past —
      // without it, a page iOS has nudged upward reads as extra keyboard.
      const covered = window.innerHeight - viewport.height - viewport.offsetTop
      // Small values are the URL bar collapsing, not a keyboard.
      setInset(covered > 80 ? Math.round(covered) : 0)
    }

    measure()
    viewport.addEventListener("resize", measure)
    viewport.addEventListener("scroll", measure)
    return () => {
      viewport.removeEventListener("resize", measure)
      viewport.removeEventListener("scroll", measure)
    }
  }, [])

  return inset
}
