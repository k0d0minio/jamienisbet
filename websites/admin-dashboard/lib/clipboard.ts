"use client"

import { toast } from "@jamie-nisbet/ui"

// One clipboard behaviour for the whole app: put the value on the clipboard and
// say so, or say why it didn't land. Both the copy *button* and the copy *row*
// in an action sheet go through here, so a copy reads the same wherever it is
// made.
//
// The failure is worth naming rather than swallowing: the clipboard is blocked
// outside a secure context and by some embedded webviews, and the link is
// usually still on screen to be copied by hand.
export async function copyToClipboard(value: string, what = "Link") {
  try {
    await navigator.clipboard.writeText(value)
    toast(`${what} copied`)
    return true
  } catch {
    toast.error("Couldn't reach the clipboard — copy it by hand")
    return false
  }
}
