"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Label,
  Textarea,
} from "@jamie-nisbet/ui"

// Which upstream approvals exist — computed server-side and passed down. The
// buttons disable themselves on a missing gate purely as UX; the API enforces
// the same gates authoritatively (409 on a miss).
export type DealGates = {
  approvedTriage: boolean
  approvedOutline: boolean
  approvedStrategy: boolean
  approvedProposal: boolean
}

type GeneratorButton = {
  kind: string
  label: string
  hint?: string
  gate?: (g: DealGates) => string | null
  privateDoc?: boolean
}

const GENERATORS: GeneratorButton[] = [
  {
    kind: "triage_assessment",
    label: "Run triage",
    hint: "Scores fit / budget / strategic value and drafts the customer feedback page too.",
  },
  {
    kind: "project_outline",
    label: "Project outline",
    hint: "Crystallises the workshop (if any) into architecture, phases, and effort bands.",
  },
  {
    kind: "negotiation_strategy",
    label: "Negotiation strategy",
    privateDoc: true,
    hint: "Private coaching doc — anchor, target, floor, talk-track. Never client-facing.",
  },
  {
    kind: "proposal",
    label: "Proposal",
    gate: (g) =>
      g.approvedStrategy
        ? null
        : "Needs an approved negotiation strategy first (stage 03's CRITICAL gate).",
  },
  {
    kind: "quote",
    label: "Quote",
    gate: (g) =>
      g.approvedStrategy && g.approvedProposal
        ? null
        : "Needs an approved proposal (and strategy) first.",
  },
  {
    kind: "brd",
    label: "BRD",
    gate: (g) =>
      g.approvedOutline
        ? null
        : "Needs an approved project outline first — the BRD is its customer translation.",
  },
  {
    kind: "customer_feedback",
    label: "Customer feedback",
    gate: (g) =>
      g.approvedTriage ? null : "Needs an approved triage assessment first.",
  },
]

export function GeneratePanel({
  dealId,
  gates,
}: {
  dealId: string
  gates: DealGates
}) {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [streamed, setStreamed] = useState("")
  const [error, setError] = useState<string | null>(null)
  const instructionsRef = useRef<HTMLTextAreaElement>(null)

  async function run(kind: string) {
    setRunning(kind)
    setStreamed("")
    setError(null)
    try {
      if (kind === "triage_assessment") {
        const res = await fetch("/api/ai/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          setError(json?.error ?? `Generation failed (${res.status}).`)
          return
        }
        setStreamed(
          `Triage complete — decision: ${json.decision}. Both drafts are in Documents below.`
        )
      } else {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId,
            kind,
            instructions: instructionsRef.current?.value || undefined,
          }),
        })
        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null)
          setError(json?.error ?? `Generation failed (${res.status}).`)
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setStreamed((prev) => prev + chunk)
        }
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.")
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {GENERATORS.map((g) => {
          const blocked = g.gate ? g.gate(gates) : null
          return (
            <div key={g.kind} className="flex flex-col gap-1">
              <Button
                size="sm"
                variant={blocked ? "outline" : "default"}
                disabled={running !== null || Boolean(blocked)}
                title={blocked ?? g.hint}
                onClick={() => run(g.kind)}
              >
                {running === g.kind ? "Generating…" : g.label}
                {g.privateDoc ? (
                  <Badge variant="outline" className="ml-1">
                    private
                  </Badge>
                ) : null}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gen-instructions">
          Steering notes (optional, applied to the next run)
        </Label>
        <Textarea
          id="gen-instructions"
          ref={instructionsRef}
          rows={2}
          placeholder="e.g. lean into the retainer option; the client is non-technical…"
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Not generated</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {streamed ? (
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {running
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
