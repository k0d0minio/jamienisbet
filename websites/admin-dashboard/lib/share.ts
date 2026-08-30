"use client"

import { useEffect, useState } from "react"

import { copyToClipboard } from "@/lib/clipboard"

// Handing a link to somebody, on whatever the browser can actually do.
//
// On a phone that is the OS share sheet — every app the owner already sends
// links through, without this app having to know any of them. On a desktop
// browser there is usually no such thing, so the clipboard is the fallback and
// the button says "copy" rather than pretending otherwise.
//
// Either way nothing leaves this app: the share sheet hands the link to
// something else, and the estate's "no outbound action without review" rule
// stays intact — a human still writes and sends the message.

export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed"

/** Read at call time, not at import — a webview can be missing `share` and
 *  still have a `navigator`. */
function nativeShareSupported(payload?: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false
  }
  // `canShare` is the only honest answer for a payload the target might
  // refuse; where it doesn't exist, `share` existing is all we have to go on.
  return payload == null || navigator.canShare == null || navigator.canShare(payload)
}

/**
 * Whether *this* browser can open a share sheet — for choosing the glyph and
 * the label before anyone taps.
 *
 * False through the server render and the first client one, so the markup
 * matches on both sides and hydration stays quiet; the phone flips it a frame
 * later. Both states draw the same size, so nothing moves when it does.
 */
export function useCanShare(): boolean {
  const [can, setCan] = useState(false)
  useEffect(() => setCan(nativeShareSupported()), [])
  return can
}

/**
 * Share it, or put it on the clipboard. Call this straight out of the click
 * handler with nothing awaited first — `navigator.share` needs the user
 * gesture still to be live, and an `await` before it spends that.
 */
export async function shareOrCopy(
  payload: { title: string; text: string; url: string },
  what = "Link"
): Promise<ShareOutcome> {
  if (nativeShareSupported(payload)) {
    try {
      await navigator.share(payload)
      return "shared"
    } catch (err) {
      // Backing out of the sheet is a decision, not a failure — say nothing.
      if (err instanceof DOMException && err.name === "AbortError") return "dismissed"
      // Anything else (blocked by policy, no target that takes a URL) still
      // leaves the link worth having, so fall through to the clipboard.
    }
  }
  return (await copyToClipboard(payload.url, what)) ? "copied" : "failed"
}
