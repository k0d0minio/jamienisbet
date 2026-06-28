"use client"

import * as React from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { Check, Copy, Mail, MessageCircle, Users } from "lucide-react"

import { pitchScripts, type PitchScript } from "@/lib/site"

const icons = { MessageCircle, Mail, Users }

export function PitchScripts({ shareUrl }: { shareUrl: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {pitchScripts.map((script) => (
        <PitchCard key={script.channel} script={script} shareUrl={shareUrl} />
      ))}
    </div>
  )
}

function PitchCard({
  script,
  shareUrl,
}: {
  script: PitchScript
  shareUrl: string
}) {
  const Icon = icons[script.icon]
  // Bake the seller's personal link into the message so the 10% follows it.
  const message = script.body.replaceAll("{link}", shareUrl)
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (insecure context, denied permission); the
      // message stays on screen to copy by hand, so just leave the label as-is.
      setCopied(false)
    }
  }

  return (
    <Card className="gap-4">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Icon className="size-5" />
          </div>
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {script.channel}
          </span>
        </div>
        <CardTitle className="text-lg">{script.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">
          {message}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={copy}
          aria-live="polite"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy message"}
        </Button>
      </CardContent>
    </Card>
  )
}
