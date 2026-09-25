"use client"

import { useOptimistic, useTransition } from "react"
import { Moon, Sunrise } from "lucide-react"

import { Button, GroupedRow, GroupedSection, cn, toast } from "@jamie-nisbet/ui"

import { pushWake, wakeProspect } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Wakes — parked relationships whose date has come.
//
// `nurture` is the rung that exists so a spent cadence doesn't have to end in a
// lie: nobody is "not won" just because five messages went unanswered, so they
// are parked with a date instead. This section is the other half of that
// promise. Without it `wake_at` is a column nobody reads, and a parked lead is
// a lost one with better paperwork.
//
// So the whole section is built for a decision made in the time it takes to
// read a name. Two answers, both one tap, neither opening anything: pick them
// back up — onto `prospect`, with a next step due today — or push the date out
// another ninety days. The row itself is the first, because that is what a
// wake is *for*; parking again is the deliberate one and takes the button.
//
// It acts in place for the same reason the Waiting on you rows do: there is
// nowhere better to send you. Both answers are recoverable from the lead's own
// profile, and a row leaves the list the instant the thumb lifts — the server's
// answer lands underneath, and a refused write puts the row back with a toast
// saying what didn't happen.

/** A woken row, as the feed needs it — everything pre-formatted on the server,
 *  so nothing here reads the clock. */
export type Wake = {
  id: string
  name: string
  /** When it was due to wake: "12 Jun". */
  wakeLabel: string
  /** Whole days since that date passed. 0 means it woke today. */
  late: number
  /** What they are, in the pool's own words — sector and town. */
  detail: string | null
}

export function NurtureWakes({ wakes, more }: { wakes: Wake[]; more: number }) {
  const [, startTransition] = useTransition()
  const [decided, markDecided] = useOptimistic<string[], string>(
    [],
    (state, id) => [...state, id]
  )

  const open = wakes.filter((wake) => !decided.includes(wake.id))
  if (open.length === 0 && more === 0) return null

  return (
    <GroupedSection
      header="Wakes"
      footer={
        more > 0
          ? `${more} more parked ${more === 1 ? "relationship has" : "relationships have"} woken up. They keep until you get to them.`
          : "Picking one back up puts a first step on today's queue. Later parks them for another 90 days."
      }
    >
      {open.length === 0 ? (
        <GroupedRow
          icon={<Sunrise />}
          label="All decided"
          description="Nothing else has woken up today."
          chevron={false}
        />
      ) : null}

      {open.map((wake) => (
        <GroupedRow
          key={wake.id}
          icon={<Sunrise />}
          label={wake.name}
          description={
            <>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  // A wake three months stale is a different fact from one
                  // that came due this morning, and the only one worth
                  // raising a voice about.
                  wake.late > 30 ? "font-medium text-destructive" : "text-app-label-3"
                )}
              >
                {wake.wakeLabel}
              </span>
              {wake.detail ? ` · ${wake.detail}` : null}
            </>
          }
          onClick={() =>
            startTransition(async () => {
              markDecided(wake.id)
              hapticTick()
              try {
                await wakeProspect(wake.id)
                toast(`${wake.name} is back on the cadence`)
              } catch {
                toast.error(`Couldn't pick ${wake.name} back up`)
              }
            })
          }
          accessory={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Park ${wake.name} for another 90 days`}
              onClick={() =>
                startTransition(async () => {
                  markDecided(wake.id)
                  hapticTick()
                  try {
                    await pushWake(wake.id)
                    toast(`${wake.name} parked for another 90 days`)
                  } catch {
                    toast.error(`Couldn't push ${wake.name}'s wake date`)
                  }
                })
              }
            >
              <Moon aria-hidden />
              {/* The word is what makes the second answer findable; it costs
                  about 45px, which on a narrow phone is the difference between
                  a readable name and a truncated one. So it waits for the
                  room — the aria-label carries it under `sm`. */}
              <span className="hidden sm:inline">Later</span>
            </Button>
          }
        />
      ))}
    </GroupedSection>
  )
}
