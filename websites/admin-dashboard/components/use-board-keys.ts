"use client"

import { useEffect, useRef } from "react"

import { DESK_QUERY } from "@/components/use-desk"

// The tickets board's keyboard, from `lg` up. One listener on the document, so
// the keys work from page load without a click into the list first. This file
// only decides *whether* a keypress is the board's and *which* intent it is;
// what each intent does lives with the desk (components/work-desk.tsx),
// which holds the data and the cursors.
//
// A key is never the board's while you are typing, while anything floats over
// the board (a menu, a sheet, a dialog — the key sheet included, whose own Esc
// closes it), or with Ctrl, Cmd or Alt held: browser and OS shortcuts are
// never taken — with one exception, ⌘↵ (Ctrl+↵ off macOS), the reader's
// primary act (spec work-reader §2). It is left to the browser on a focused
// link, where it means "open in a new tab". Below
// `lg` Work is the phone's levels (components/work-phone.tsx), which have no
// keyboard map.

export type BoardKeyIntent =
  | "down"
  | "up"
  | "open"
  | "back"
  | "copy"
  | "github"
  | "refresh"
  | "prevRepo"
  | "nextRepo"
  | "help"
  | "launch"

const INTENTS: Record<string, BoardKeyIntent> = {
  ArrowDown: "down",
  j: "down",
  ArrowUp: "up",
  k: "up",
  Enter: "open",
  ArrowRight: "open",
  l: "open",
  Escape: "back",
  ArrowLeft: "back",
  h: "back",
  c: "copy",
  o: "github",
  r: "refresh",
  "[": "prevRepo",
  "]": "nextRepo",
  "?": "help",
}

/** Anything that floats over the board and owns the keys while it is open.
 *  Radix mounts these only while open, so being in the document is being
 *  open. */
const OVERLAY = '[role="menu"], [role="dialog"], [role="alertdialog"]'

/** Where a keypress is typing, not a command. */
const TEXT_FIELD =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/** Controls whose own Enter is theirs: a row reached by Tab still opens by
 *  its own click, a link still follows, a disclosure still folds. */
const ACTIVATABLE = 'button, a[href], summary, [role="menuitem"]'

/**
 * Calls `onIntent` for every keypress that is the board's. It returns whether
 * it acted: a handled key has its default prevented (the page doesn't also
 * scroll), an unhandled one is left to the browser — the pane's own arrow
 * scroll, say.
 */
export function useBoardKeys(
  onIntent: (intent: BoardKeyIntent, event: KeyboardEvent) => boolean,
  /** Off, no key is the board's — the desk passes false while it is not the
   *  layout on screen (work-screen.tsx). */
  enabled = true
) {
  // The listener is attached once; the board's latest handler is read
  // through this, so it always sees the board as it is now.
  const handler = useRef(onIntent)
  useEffect(() => {
    handler.current = onIntent
  })

  useEffect(() => {
    if (!enabled) return
    const desktop = window.matchMedia(DESK_QUERY)

    function onKeyDown(event: KeyboardEvent) {
      if (!desktop.matches) return
      if (event.defaultPrevented || event.isComposing) return
      // AltGr (reported as Ctrl+Alt on Windows) and macOS Option are how
      // some layouts (Portuguese, German, Spanish among them) type `[`,
      // `]` and `?` themselves — event.key is already the character, so
      // letting those three through here steals no browser shortcut. Meta
      // stays blocked always; every other key keeps ignoring Ctrl/Alt.
      // ⌘↵ / Ctrl+↵ — launch. Still never while typing or under an overlay
      // (the palette and the key sheet are dialogs), and not on a focused
      // link, whose ⌘↵ is the browser's; it fires from a focused button —
      // Enter alone is that button's, ⌘↵ never is.
      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const target = event.target instanceof Element ? event.target : null
        if (target?.closest(TEXT_FIELD)) return
        if (target?.closest("a[href]")) return
        if (document.querySelector(OVERLAY)) return
        if (handler.current("launch", event)) event.preventDefault()
        return
      }
      const isAltGrRepoOrHelpKey =
        event.key === "[" || event.key === "]" || event.key === "?"
      if (event.metaKey) return
      if (!isAltGrRepoOrHelpKey && (event.ctrlKey || event.altKey)) return
      // Shift is only ever part of a key here (`?` on most layouts); an
      // arrow or a letter with Shift held is someone else's.
      if (event.shiftKey && event.key !== "?") return

      const intent = INTENTS[event.key]
      if (!intent) return

      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(TEXT_FIELD)) return
      if (document.querySelector(OVERLAY)) return
      if (event.key === "Enter" && target?.closest(ACTIVATABLE)) return

      if (handler.current(intent, event)) event.preventDefault()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enabled])
}
