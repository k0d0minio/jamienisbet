"use client"

import { useState, useTransition } from "react"
import { Check, ChevronRight } from "lucide-react"

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@jamie-nisbet/ui"

import { saveDealTerms, updateClientStatus } from "@/app/(app)/actions"
import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStripeLink } from "@/components/client-stripe-link"

// Converting a won lead used to be four separate taps scattered across the
// profile — status, repo, deal terms, Stripe — and the skipped ones each broke
// something downstream (no repo: invisible on the tickets board; no terms: the
// money numbers lie). This walks all four in order, composing the exact same
// server actions the individual controls use; every step can be done here or
// skipped explicitly. Skipping is honest — the profile's gap badges will keep
// saying what's missing.

const STEPS = ["Status", "Delivery repo", "Deal terms", "Stripe"] as const

type ClientView = {
  id: string
  status: string
  githubRepo: string | null
  githubDefaultBranch: string | null
  stripeCustomerId: string | null
  valueMinor: number
  billingType: string
  dealType: string
  barterTerms: string | null
}

function StepHeading({
  index,
  active,
  done,
}: {
  index: number
  active: boolean
  done: boolean
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm",
        active ? "font-medium" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
          done && "border-success bg-success-soft text-success",
          active && !done && "border-primary text-primary"
        )}
      >
        {done ? <Check className="size-3" aria-hidden /> : index + 1}
      </span>
      {STEPS[index]}
    </span>
  )
}

function StatusStep({
  client,
  onNext,
}: {
  client: ClientView
  onNext: () => void
}) {
  const [pending, startTransition] = useTransition()
  const won = client.status === "won" || client.status === "delivered"
  if (won) {
    return (
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">
          Already {client.status} — nothing to change here.
        </p>
        <Button type="button" size="sm" className="w-fit" onClick={onNext}>
          Continue
        </Button>
      </div>
    )
  }
  return (
    <div className="grid gap-2">
      <p className="text-xs text-muted-foreground">
        Move them from {client.status} to won.
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateClientStatus(client.id, "won")
              onNext()
            })
          }
        >
          {pending ? "Saving…" : "Mark as won"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onNext}>
          Skip
        </Button>
      </div>
    </div>
  )
}

function DealTermsStep({
  client,
  onNext,
}: {
  client: ClientView
  onNext: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [dealType, setDealType] = useState(
    client.dealType === "barter" ? "barter" : "cash"
  )

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      await saveDealTerms(client.id, formData)
      onNext()
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="convert-value">Value (€)</Label>
          <Input
            id="convert-value"
            name="value"
            inputMode="decimal"
            defaultValue={
              client.valueMinor > 0 ? (client.valueMinor / 100).toFixed(2) : ""
            }
            placeholder="1500"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="convert-billing">Billed</Label>
          <Select name="billingType" defaultValue={client.billingType}>
            <SelectTrigger id="convert-billing" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_off">One-off</SelectItem>
              <SelectItem value="monthly">Every month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Controlled, and posted by the hidden input below — a Radix Select
          driven by `value` doesn't submit itself (the profile-form pattern). */}
      <div className="grid gap-1.5">
        <Label htmlFor="convert-deal-type">Paid in</Label>
        <Select value={dealType} onValueChange={setDealType}>
          <SelectTrigger id="convert-deal-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="barter">Exchange of services</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="dealType" value={dealType} />
      </div>
      {dealType === "barter" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="convert-barter">What&apos;s being exchanged</Label>
          <Textarea
            id="convert-barter"
            name="barterTerms"
            defaultValue={client.barterTerms ?? ""}
            rows={2}
          />
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save terms"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onNext}>
          Skip
        </Button>
      </div>
    </form>
  )
}

export function ConvertFlow({
  client,
  githubConfigured,
  suggestedRepoName,
}: {
  client: ClientView
  githubConfigured: boolean
  suggestedRepoName: string
}) {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)

  const stepDone = [
    client.status === "won" || client.status === "delivered",
    client.githubRepo !== null,
    client.valueMinor > 0,
    client.stripeCustomerId !== null,
  ]

  const next = () =>
    step >= STEPS.length - 1 ? setFinished(true) : setStep(step + 1)

  if (finished) {
    const missing = STEPS.filter((_, i) => !stepDone[i])
    return (
      <p className="text-sm text-muted-foreground">
        {missing.length === 0
          ? "Converted — all four pieces are in place."
          : `Done. Still open: ${missing.join(", ").toLowerCase()} — the badges above will keep pointing at them.`}{" "}
        <button
          type="button"
          onClick={() => {
            setStep(0)
            setFinished(false)
          }}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Walk it again
        </button>
      </p>
    )
  }

  return (
    <ol className="grid gap-3">
      {STEPS.map((label, index) => (
        <li key={label} className="grid gap-2">
          <button
            type="button"
            onClick={() => setStep(index)}
            className="w-fit text-left"
          >
            <StepHeading
              index={index}
              active={index === step}
              done={stepDone[index]}
            />
          </button>
          {index === step ? (
            <div className="border-l-2 border-muted pl-4">
              {index === 0 ? (
                <StatusStep client={client} onNext={next} />
              ) : index === 1 ? (
                <div className="grid gap-2">
                  <ClientRepoLink
                    id={client.id}
                    githubRepo={client.githubRepo}
                    githubDefaultBranch={client.githubDefaultBranch}
                    configured={githubConfigured}
                    suggestedName={suggestedRepoName}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-fit"
                    onClick={next}
                  >
                    {client.githubRepo ? (
                      <>
                        Continue
                        <ChevronRight />
                      </>
                    ) : (
                      "Skip"
                    )}
                  </Button>
                </div>
              ) : index === 2 ? (
                <DealTermsStep client={client} onNext={next} />
              ) : (
                <div className="grid gap-2">
                  <ClientStripeLink
                    id={client.id}
                    stripeCustomerId={client.stripeCustomerId}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-fit"
                    onClick={next}
                  >
                    {client.stripeCustomerId ? (
                      <>
                        Finish
                        <ChevronRight />
                      </>
                    ) : (
                      "Skip"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
