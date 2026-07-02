"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@jamie-nisbet/ui"

export type MockupRef = {
  id: string
  version: number
  status: string
  title: string
}

// Three deliberately different starting points for the fan-out, so the client
// conversation starts from contrast rather than three shades of the same idea.
const DIRECTIONS = [
  "Bold and confident — large type, strong colour blocking from the brand palette, generous whitespace",
  "Minimal and calm — restrained, airy, typography-led, almost monochrome with one brand accent",
  "Warm and personal — friendly, rounded, approachable; feels like working with a person, not an agency",
]

export function MockupPanel({
  dealId,
  mockups,
}: {
  dealId: string
  mockups: MockupRef[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [baseId, setBaseId] = useState<string>("")
  const instructionsRef = useRef<HTMLTextAreaElement>(null)

  async function callMockup(payload: Record<string, string | undefined>) {
    const res = await fetch("/api/ai/mockup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId, ...payload }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      throw new Error(json?.error ?? `Mockup generation failed (${res.status}).`)
    }
  }

  async function generateOne() {
    setBusy("one")
    setError(null)
    setProgress("Generating mockup…")
    try {
      await callMockup({
        instructions: instructionsRef.current?.value || undefined,
        baseDocumentId: baseId || undefined,
      })
      setProgress("Done — the draft is in Documents.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mockup generation failed.")
      setProgress(null)
    } finally {
      setBusy(null)
    }
  }

  async function generateDirections() {
    setBusy("three")
    setError(null)
    setProgress("Generating 3 directions in parallel…")
    try {
      const results = await Promise.allSettled(
        DIRECTIONS.map((direction) =>
          callMockup({
            direction,
            instructions: instructionsRef.current?.value || undefined,
          })
        )
      )
      const failed = results.filter((r) => r.status === "rejected").length
      setProgress(
        failed === 0
          ? "Done — 3 directions are in Documents."
          : `${3 - failed} of 3 landed; ${failed} failed — retry if needed.`
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mockup generation failed.")
      setProgress(null)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="mockup-instructions">
          What should the mockup show? (optional)
        </Label>
        <Textarea
          id="mockup-instructions"
          ref={instructionsRef}
          rows={2}
          placeholder="e.g. landing page for the booking service: hero, 3 benefits, pricing teaser, contact"
        />
      </div>

      {mockups.length > 0 ? (
        <div className="grid gap-2">
          <Label>Iterate on an existing version (optional)</Label>
          <Select value={baseId || "none"} onValueChange={(v) => setBaseId(v === "none" ? "" : v)}>
            <SelectTrigger size="sm" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Start fresh</SelectItem>
              {mockups.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  v{m.version} — {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy !== null} onClick={generateOne}>
          {busy === "one" ? "Generating…" : baseId ? "Iterate" : "Generate mockup"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null || Boolean(baseId)}
          title={
            baseId
              ? "Directions start fresh — clear the iterate selection first."
              : "Three contrasting takes, generated in parallel."
          }
          onClick={generateDirections}
        >
          {busy === "three" ? "Generating…" : "Generate 3 directions"}
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Not generated</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {progress && !error ? (
        <p className="text-sm text-muted-foreground">{progress}</p>
      ) : null}
    </div>
  )
}
