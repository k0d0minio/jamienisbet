"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button, Input, Label, Textarea } from "@jamie-nisbet/ui"

import { formatMoney, parseAmountToMinor } from "@/lib/money"

type MilestoneRow = { key: number; label: string; amount: string }

/**
 * Step 2 — the proposal builder. After the meeting, Jamie writes down what
 * was agreed (plan, timeline, payment structure) and this drafts the proposal
 * document from it. The payment rows are stored structured on the deal — they
 * are what step 3 invoices through Stripe, so the document and the billing
 * can never say different things.
 */
export function ProposalBuilder({ dealId }: { dealId: string }) {
  const router = useRouter()
  const [agreedPlan, setAgreedPlan] = useState("")
  const [timeline, setTimeline] = useState("")
  const [notes, setNotes] = useState("")
  const [rows, setRows] = useState<MilestoneRow[]>([
    { key: 1, label: "50% deposit to start", amount: "" },
    { key: 2, label: "Balance on delivery", amount: "" },
  ])
  const [busy, setBusy] = useState(false)
  const [streamed, setStreamed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsedRows = rows
    .filter((r) => r.label.trim() || r.amount.trim())
    .map((r) => ({
      label: r.label.trim(),
      amountMinor: parseAmountToMinor(r.amount),
    }))
  const totalMinor = parsedRows.reduce((sum, r) => sum + (r.amountMinor ?? 0), 0)

  function setRow(key: number, patch: Partial<MilestoneRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  async function draft() {
    if (busy) return
    setError(null)

    if (!agreedPlan.trim()) {
      setError("Describe what you agreed with the client first.")
      return
    }
    if (parsedRows.length === 0) {
      setError("Add at least one payment milestone.")
      return
    }
    const bad = parsedRows.find((r) => !r.label || r.amountMinor === null)
    if (bad) {
      setError("Every payment milestone needs a label and a valid EUR amount.")
      return
    }

    setBusy(true)
    setStreamed("")
    try {
      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          agreedPlan,
          timeline: timeline || undefined,
          notes: notes || undefined,
          milestones: parsedRows,
        }),
      })
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? `Drafting the proposal failed (${res.status}).`)
        setStreamed(null)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setStreamed((prev) => (prev ?? "") + chunk)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drafting the proposal failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="proposal-plan">What you agreed with the client</Label>
        <Textarea
          id="proposal-plan"
          value={agreedPlan}
          onChange={(e) => setAgreedPlan(e.target.value)}
          rows={5}
          placeholder="The solution you settled on over coffee: what gets built, what it must do, what's explicitly out…"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="proposal-timeline">Timeline (optional)</Label>
        <Input
          id="proposal-timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. 4 weeks from deposit, launch mid-September"
        />
      </div>

      <div className="grid gap-2">
        <Label>Payment structure</Label>
        <p className="text-xs text-muted-foreground">
          These exact milestones go into the proposal and become the Stripe
          invoices in step 3.
        </p>
        {rows.map((row) => (
          <div key={row.key} className="flex gap-2">
            <Input
              value={row.label}
              onChange={(e) => setRow(row.key, { label: e.target.value })}
              placeholder="Milestone (e.g. 50% deposit)"
              className="flex-1"
            />
            <Input
              value={row.amount}
              onChange={(e) => setRow(row.key, { amount: e.target.value })}
              placeholder="€ amount"
              inputMode="decimal"
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={rows.length === 1}
              onClick={() =>
                setRows((prev) => prev.filter((r) => r.key !== row.key))
              }
              aria-label="Remove milestone"
            >
              ✕
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                { key: Math.max(...prev.map((r) => r.key)) + 1, label: "", amount: "" },
              ])
            }
          >
            Add milestone
          </Button>
          <p className="text-sm text-muted-foreground">
            Total:{" "}
            <span className="font-medium text-foreground">
              {totalMinor > 0 ? formatMoney(totalMinor, "eur") : "—"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="proposal-notes">Anything else (optional)</Label>
        <Textarea
          id="proposal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. they're non-technical — keep the technical section light; they asked about hosting costs…"
        />
      </div>

      <div>
        <Button type="button" disabled={busy} onClick={draft}>
          {busy ? "Drafting…" : "Draft proposal"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {streamed !== null ? (
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {busy
              ? "Drafting live — the finished draft lands in Documents…"
              : "Done — the draft is in Documents below, awaiting your review."}
          </p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {streamed}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
