"use client"

import { useState } from "react"

import { Button } from "@jamie-nisbet/ui"

// Copy a value to the clipboard with brief "Copied" feedback. Used for hosted
// invoice URLs and payment links so the owner can paste them into an email/chat.
export function CopyButton({
  value,
  label = "Copy link",
  size = "sm",
}: {
  value: string
  label?: string
  size?: "sm" | "default"
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked (e.g. insecure context) — no-op; the link is still visible.
    }
  }

  return (
    <Button type="button" variant="secondary" size={size} onClick={onCopy}>
      {copied ? "Copied" : label}
    </Button>
  )
}
