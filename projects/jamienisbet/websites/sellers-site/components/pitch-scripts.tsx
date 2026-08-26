import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { Mail, MessageCircle, Users } from "lucide-react"

import { CopyButton } from "@jamie-nisbet/app-shell"

type PitchScript = { key: string; channel: string; title: string; body: string }
type FollowUp = { key: string; when: string; context: string; body: string }
type CopyLabel = { copy: string; copied: string }

// Channel key → icon. Keys are stable across locales (set in the dictionaries).
const icons: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail,
  inperson: Users,
}

// Bake the seller's personal link into a message so the 10% follows the share.
function withLink(body: string, shareUrl: string) {
  return body.replaceAll("{link}", shareUrl)
}

export function PitchScripts({
  shareUrl,
  scripts,
  copyLabel,
}: {
  shareUrl: string
  scripts: PitchScript[]
  copyLabel: CopyLabel
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {scripts.map((script) => (
        <PitchCard
          key={script.key}
          script={script}
          shareUrl={shareUrl}
          copyLabel={copyLabel}
        />
      ))}
    </div>
  )
}

function PitchCard({
  script,
  shareUrl,
  copyLabel,
}: {
  script: PitchScript
  shareUrl: string
  copyLabel: CopyLabel
}) {
  const Icon = icons[script.key] ?? MessageCircle
  const message = withLink(script.body, shareUrl)

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
        <CopyButton text={message} copyLabel={copyLabel} />
      </CardContent>
    </Card>
  )
}

// The follow-up sequence — same copy-card pattern, ordered as a numbered timeline.
export function FollowUps({
  shareUrl,
  steps,
  copyLabel,
}: {
  shareUrl: string
  steps: FollowUp[]
  copyLabel: CopyLabel
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {steps.map((step, i) => (
        <FollowUpCard
          key={step.key}
          step={step}
          index={i + 1}
          shareUrl={shareUrl}
          copyLabel={copyLabel}
        />
      ))}
    </div>
  )
}

function FollowUpCard({
  step,
  index,
  shareUrl,
  copyLabel,
}: {
  step: FollowUp
  index: number
  shareUrl: string
  copyLabel: CopyLabel
}) {
  const message = withLink(step.body, shareUrl)

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{step.when}</CardTitle>
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground">
            0{index}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{step.context}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">
          {message}
        </p>
        <CopyButton text={message} copyLabel={copyLabel} />
      </CardContent>
    </Card>
  )
}
