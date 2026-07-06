"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from "@jamie-nisbet/ui"

/**
 * Generate one of the deal's auxiliary documents (fit assessment, negotiation
 * strategy, contract) and drop the draft into Documents behind the review gate.
 * Same shape as the brainstorm's "Draft pitch": POST, drain the stream, refresh
 * — the document itself is reviewed on its own page, never inline here. An
 * optional note lets Jamie steer a single run without editing a Layer-3 file.
 */
export function DocumentGenerator({
  dealId,
  kind,
  title,
  blurb,
  cta,
  notePlaceholder,
}: {
  dealId: string
  kind: "triage" | "negotiation" | "contract"
  title: string
  blurb: string
  cta: string
  notePlaceholder?: string
}) {
  const router = useRouter()
  const [instructions, setInstructions] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function generate() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch("/api/ai/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          kind,
          instructions: instructions.trim() || undefined,
        }),
      })
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? `Generating the draft failed (${res.status}).`)
        return
      }
      // Drain the stream; the draft lands in Documents when it completes.
      const reader = res.body.getReader()
      for (;;) {
        const { done: streamDone } = await reader.read()
        if (streamDone) break
      }
      setInstructions("")
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generating the draft failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{blurb}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          placeholder={notePlaceholder ?? "Optional: anything to steer this draft"}
          disabled={busy}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {done ? (
          <p className="text-sm text-muted-foreground">
            Draft ready —{" "}
            <Link
              href={`/deals/${dealId}/documents`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              review it in Documents
            </Link>
            .
          </p>
        ) : null}
        <div>
          <Button type="button" size="sm" onClick={generate} disabled={busy}>
            {busy ? "Drafting…" : cta}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
