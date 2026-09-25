"use client"

import { useState, useTransition } from "react"
import { ScanSearch } from "lucide-react"

import {
  Button,
  RecordBlock,
  RecordRow,
  RecordSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Switch,
  toast,
} from "@jamie-nisbet/ui"

import {
  enrichFromWebsite,
  saveEnrichment,
  type EnrichPreview,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Read their website, and change nothing until you say so.
//
// The other half of the facts card. Editing fills the facts in by hand; this
// reads the business's own site and *proposes* — and the whole component is
// built around the gap between those two words. Nothing it fetches reaches a
// column until a switch is on and Save is pressed, and the switches are the
// design:
//
//   **A blank fills itself; a value argues its case.** A proposal for an empty
//   column arrives switched on — that is a correction, and making somebody tap
//   nine times to accept nine corrections trains them to tap without reading. A
//   proposal that would *replace* something arrives switched off, every time,
//   with what is already there printed beside it. The hook is why: it is the
//   most valuable sentence on the record, often hand-written by the person
//   reading this sheet, and a model must not be able to quietly better it.
//
//   **The tier is not on the list.** It is derived from the facts once they
//   land — `deriveFitTier` in the services layer — so it is reported here, not
//   offered. AI proposes facts; a pure function decides the letter.
//
//   **Findings are read, not stored.** What the model saw is the evidence
//   behind the grade, and it lives exactly as long as this sheet does. There is
//   no findings column and no provenance table: that is the ceremony the
//   2026-08 reversal removed, and it is not coming back for this.
//
// Accepting nothing is a real outcome and still stamps the row as read — "I
// looked and there was nothing new" is precisely what stops the batch script
// fetching the same page again next week.
//
// It sends nothing to anybody and it never can: the estate's standing rule is
// about outbound messages, and the only thing that leaves this feature is a
// GET to a public home page.

type Change = EnrichPreview["changes"][number]

export function LeadEnrich({
  clientId,
  websiteUrl,
  /** False when there is no AI Gateway key: the row says so and does nothing,
   *  the way an unconfigured Stripe or GitHub does. */
  configured,
  /** When the site was last read, already formatted — or null if never. */
  enrichedOn,
}: {
  clientId: string
  websiteUrl: string | null
  configured: boolean
  enrichedOn: string | null
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<EnrichPreview | null>(null)
  const [accepted, setAccepted] = useState<ReadonlySet<string>>(new Set())
  const [problem, setProblem] = useState<string | null>(null)
  const [reading, startReading] = useTransition()
  const [saving, startSaving] = useTransition()

  // Two ways the row can't do its job, and they are not the same news: no
  // address is this record's gap, no key is Jamie's. Disabled and saying which,
  // rather than hidden — a control that vanishes is a feature nobody knows
  // exists.
  const blocked = !websiteUrl?.trim()
    ? "No website on file — add one below first."
    : !configured
      ? "Not set up — there's no Gateway key on this deployment."
      : null

  function read() {
    startReading(async () => {
      hapticTick()
      setProblem(null)
      const result = await enrichFromWebsite(clientId)
      if (!result.ok) {
        setProblem(result.message)
        setPreview(null)
        return
      }
      setPreview(result.preview)
      // Blanks on, replacements off. The one decision this component makes on
      // anybody's behalf, and it makes it in the safe direction.
      setAccepted(
        new Set(
          result.preview.changes
            .filter((change) => !change.conflict)
            .map((change) => change.field)
        )
      )
    })
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // There is nothing to choose before reading — no channel, no rung, no
      // options at all — so opening the sheet *is* the request. A screen whose
      // only content was a button saying "go on then" would be a tap spent on
      // nothing.
      read()
      return
    }
    // Reset on the way out, so the closing animation doesn't play over the
    // sheet emptying itself.
    setPreview(null)
    setAccepted(new Set())
    setProblem(null)
  }

  function toggle(field: string) {
    setAccepted((current) => {
      const next = new Set(current)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  function save() {
    if (!preview) return
    startSaving(async () => {
      hapticTick()
      const formData = new FormData()
      for (const change of preview.changes) {
        if (!accepted.has(change.field)) continue
        formData.append("accept", change.field)
        formData.set(`value:${change.field}`, change.value)
      }

      const result = await saveEnrichment(clientId, formData)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      onOpenChange(false)
      toast(
        result.saved === 0
          ? "Marked as read"
          : `${result.saved === 1 ? "1 fact" : `${result.saved} facts`} saved${
              result.tier ? ` — ${result.tier} tier` : ""
            }`
      )
    })
  }

  // A blocked row is not a trigger: it says why and does nothing, rather than
  // opening a sheet whose only content is the same sentence. Stated rather than
  // hidden — a control that vanishes is a feature nobody knows exists — and
  // static rather than a dead button: with no handler on it the row is a plain
  // line of the record, which is what an unavailable action is here.
  if (blocked) {
    return (
      <RecordRow
        icon={<ScanSearch />}
        label="Read their website"
        description={blocked}
      />
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <RecordRow
          icon={<ScanSearch />}
          label="Read their website"
          value={
            <span className="font-mono text-desk-meta text-desk-fg-3">
              {enrichedOn ? `Last read ${enrichedOn}` : "Propose facts"}
            </span>
          }
          variant="tint"
        />
      </SheetTrigger>

      {/* Two detents: a page with one change to accept fits at half height,
          and a thin site with five findings and a new hook wants the whole
          sheet. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>What their site says</SheetTitle>
          <SheetDescription>
            Read from {preview?.source.url ?? websiteUrl}. Nothing is saved
            until you say so — a proposal that would replace something starts
            switched off.
          </SheetDescription>
        </SheetHeader>

        {reading ? (
          // Layout-true: the block of findings and the two or three rows of
          // changes that are about to take its place.
          <div className="grid gap-3" aria-busy="true">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="mt-2 h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <span className="sr-only">Reading the site…</span>
          </div>
        ) : problem ? (
          <div className="grid gap-3">
            <p className="rounded-desk-pane border border-desk-line bg-desk-surface px-4 py-3 text-desk-body text-desk-fg-2">
              {problem}
            </p>
            <div className="flex items-center gap-2">
              <PendingButton
                type="button"
                pending={reading}
                pendingText="Reading…"
                className="w-full sm:w-fit"
                onClick={read}
              >
                Try again
              </PendingButton>
            </div>
          </div>
        ) : preview ? (
          <div className="grid gap-4">
            {preview.findings.length > 0 ? (
              <RecordSection header="What the site shows">
                <RecordBlock>
                  <ul className="grid gap-1 text-desk-fg">
                    {preview.findings.map((finding) => (
                      <li key={finding}>{finding}</li>
                    ))}
                  </ul>
                </RecordBlock>
              </RecordSection>
            ) : null}

            <RecordSection
              header={
                preview.changes.length === 0
                  ? "Nothing to change"
                  : "What would change"
              }
              footer={
                preview.changes.length === 0
                  ? undefined
                  : "Everything left on is written when you save. Everything else is forgotten."
              }
            >
              {preview.changes.length === 0 ? (
                <RecordBlock>
                  The site says what this record already does. Saving records
                  that it was read, so the batch pass leaves it alone.
                </RecordBlock>
              ) : (
                preview.changes.map((change) =>
                  change.field === "hook" ? (
                    <HookChange
                      key={change.field}
                      change={change}
                      checked={accepted.has(change.field)}
                      onToggle={() => toggle(change.field)}
                    />
                  ) : (
                    <RecordRow
                      key={change.field}
                      label={change.label}
                      description={
                        change.current ? `Now ${change.current}` : "Empty"
                      }
                      value={change.proposed}
                      chevron={false}
                      accessory={
                        <Switch
                          checked={accepted.has(change.field)}
                          onCheckedChange={() => toggle(change.field)}
                          aria-label={`Take ${change.label}: ${change.proposed}`}
                        />
                      }
                    />
                  )
                )
              )}
            </RecordSection>

            {/* The letter, reported rather than offered — and reported
                honestly: it is what the facts add up to if all of them are
                taken, so it is worded that way rather than following the
                switches. The one authority on a tier is the pure function in
                the services layer, and a second copy of the weights running in
                a sheet is the drift this whole ticket exists to prevent. */}
            {preview.tier.ifAccepted ? (
              <RecordSection header="Fit tier">
                <RecordBlock>
                  <p className="text-desk-fg">
                    Taking all of it makes them{" "}
                    <span className="font-mono">{preview.tier.ifAccepted}</span>
                    {preview.tier.now === null
                      ? ", from untiered."
                      : preview.tier.now === preview.tier.ifAccepted
                        ? " — the same as today."
                        : ` — they are ${preview.tier.now} today.`}
                  </p>
                  <p className="mt-1 text-desk-meta text-desk-fg-3">
                    {preview.tier.reasons.join(" · ")}
                  </p>
                </RecordBlock>
              </RecordSection>
            ) : null}

            <div className="flex items-center gap-2">
              <PendingButton
                type="button"
                pending={saving}
                pendingText="Saving…"
                className="w-full sm:w-fit"
                onClick={save}
              >
                {accepted.size === 0
                  ? "Save nothing, mark as read"
                  : accepted.size === 1
                    ? "Save 1 fact"
                    : `Save ${accepted.size} facts`}
              </PendingButton>
              <Button
                type="button"
                variant="ghost"
                className="px-3"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Discard
              </Button>
            </div>

            <p className="text-desk-meta text-desk-fg-3">
              Read by <span className="font-mono">{preview.model}</span>. The
              tier is derived from the facts, never proposed.
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * The hook, which is prose and cannot be a 44px row.
 *
 * The facts card gives the stored hook a block of its own for the same reason:
 * it is a sentence you read before writing one, and a line that truncates loses
 * the half that matters. So both sentences are shown in full, the current one
 * quiet above the proposed one, and the switch sits with them rather than at
 * the end of a row.
 */
function HookChange({
  change,
  checked,
  onToggle,
}: {
  change: Change
  checked: boolean
  onToggle: () => void
}) {
  return (
    <RecordBlock>
      <div className="flex items-start justify-between gap-3">
        <span className="text-desk-fg-3">{change.label}</span>
        <Switch
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={`Take the proposed hook: ${change.proposed}`}
        />
      </div>
      {change.current ? (
        <p className="mt-1 text-desk-meta text-desk-fg-3">
          Now: {change.current}
        </p>
      ) : null}
      <p className="mt-1 whitespace-pre-wrap text-desk-fg">{change.proposed}</p>
    </RecordBlock>
  )
}
