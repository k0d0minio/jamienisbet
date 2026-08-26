"use client"

import * as React from "react"
import { Button } from "@jamie-nisbet/ui"
import { Check, Copy } from "lucide-react"

// Shared copy-to-clipboard button. Clipboard can be blocked (insecure context,
// denied permission); on failure the label just stays as-is and the source text
// remains on screen to copy by hand. `copyLabel` carries the translated
// idle/done labels.
export function CopyButton({
  text,
  copyLabel,
}: {
  text: string
  copyLabel: { copy: string; copied: string }
}) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={copy}
      aria-live="polite"
    >
      {copied ? <Check /> : <Copy />}
      {copied ? copyLabel.copied : copyLabel.copy}
    </Button>
  )
}
