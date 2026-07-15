"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, ChevronRight, GitBranch, Loader2 } from "lucide-react"

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
} from "@jamie-nisbet/ui"

import {
  markOnboardingStepAction,
  seedDeliveryRepoAction,
} from "@/app/(app)/deals/actions"

// Serializable projection of lib/onboarding.ts items — computed server-side on
// the deal page and passed down, so this client component stays DB-free.
export type OnboardingChecklistItem = {
  key: string
  label: string
  description: string
  done: boolean
  kind: "derived" | "stored" | "seed"
  stepKey?: string
  href?: string
}

export function OnboardingChecklist({
  dealId,
  items,
}: {
  dealId: string
  items: OnboardingChecklistItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [seedResult, setSeedResult] = useState<{
    ok: boolean
    message: string
  } | null>(null)

  const doneCount = items.filter((i) => i.done).length

  return (
    <Card>
      <CardHeader>
        <CardDescription>Onboarding</CardDescription>
        <CardTitle className="text-lg">
          Deal won — get delivery started ({doneCount}/{items.length})
        </CardTitle>
        <CardDescription>
          Nothing here fires on its own: each step is your click, after your
          review.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-3 rounded-md px-2 py-2.5"
          >
            {item.kind === "stored" && item.stepKey ? (
              <Checkbox
                checked={item.done}
                disabled={pending}
                aria-label={item.label}
                className="mt-0.5"
                onCheckedChange={(checked) =>
                  startTransition(() =>
                    markOnboardingStepAction(
                      dealId,
                      item.stepKey!,
                      checked === true
                    )
                  )
                }
              />
            ) : (
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  item.done
                    ? "border-transparent bg-success text-success-foreground"
                    : "border-input bg-muted"
                )}
                aria-hidden
              >
                {item.done && <Check className="size-3" />}
              </span>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  item.done && "text-muted-foreground line-through"
                )}
              >
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>

              {item.kind === "seed" && !item.done && (
                <div className="mt-1 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setSeedResult(null)
                        try {
                          setSeedResult(await seedDeliveryRepoAction(dealId))
                        } catch (err) {
                          setSeedResult({
                            ok: false,
                            message:
                              err instanceof Error
                                ? err.message
                                : "Seeding failed.",
                          })
                        }
                      })
                    }
                  >
                    {pending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <GitBranch />
                    )}
                    Create + seed delivery repo
                  </Button>
                  {seedResult && (
                    <Alert variant={seedResult.ok ? "default" : "destructive"}>
                      <AlertDescription>{seedResult.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {item.kind === "derived" && !item.done && item.href && (
              <Link
                href={item.href}
                className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Open
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
