"use client"

import { useState, useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { copyToClipboard } from "@/lib/clipboard"

// Copy a value to the clipboard. Used for hosted invoice URLs and payment links
// so the owner can paste them into an email or chat.
//
// Two acknowledgements, doing different jobs: the label flips to "Copied" for
// the eye already on the button, and the toast is for the one case the label
// can't cover — a copy from a row that scrolls away, or from a sheet that
// closes behind it.
export function CopyButton({
  value,
  label = "Copy link",
  // What landed on the clipboard, for the toast. Defaults to the button's own
  // label so a caller only names it when "link" would be wrong.
  what = "Link",
  size = "sm",
}: {
  value: string
  label?: string
  what?: string
  size?: "sm" | "default"
}) {
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()

  async function onCopy() {
    if (!(await copyToClipboard(value, what))) return
    setCopied(true)
    // The label is a transient flourish, not state the page depends on —
    // outside a transition it would sit in the same queue as a server action.
    setTimeout(() => startTransition(() => setCopied(false)), 1500)
  }

  return (
    <Button type="button" variant="secondary" size={size} onClick={onCopy}>
      {copied ? "Copied" : label}
    </Button>
  )
}
