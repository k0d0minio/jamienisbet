"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button, Textarea } from "@jamie-nisbet/ui"

import { clearWorkshopAction } from "@/app/(app)/deals/actions"

export type ChatMessage = {
  id: string
  role: string
  content: string
}

/**
 * The technical workshop — a persisted, per-deal brainstorm on HOW to build
 * the thing. The transcript is server-owned (the API loads and saves it), so
 * this component only ever sends the newest message and renders the stream.
 * "Crystallise" turns the whole transcript into a project-outline draft.
 */
export function WorkshopChat({
  dealId,
  initialMessages,
}: {
  dealId: string
  initialMessages: ChatMessage[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [partial, setPartial] = useState<string | null>(null)
  const [busy, setBusy] = useState<"chat" | "crystallise" | "clear" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    const message = input.trim()
    if (!message || busy) return
    setBusy("chat")
    setError(null)
    setInput("")
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ])
    setPartial("")
    try {
      const res = await fetch("/api/ai/workshop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, message }),
      })
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? `The workshop call failed (${res.status}).`)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setPartial(full)
      }
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: "assistant", content: full },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "The workshop call failed.")
    } finally {
      setPartial(null)
      setBusy(null)
    }
  }

  async function crystallise() {
    if (busy) return
    setBusy("crystallise")
    setError(null)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, kind: "project_outline" }),
      })
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? `Crystallise failed (${res.status}).`)
        return
      }
      // Drain the stream; the draft lands in Documents when it completes.
      const reader = res.body.getReader()
      for (;;) {
        const { done } = await reader.read()
        if (done) break
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crystallise failed.")
    } finally {
      setBusy(null)
    }
  }

  async function clear() {
    if (busy) return
    if (
      !window.confirm(
        "Clear the whole workshop transcript? Crystallised outlines are kept."
      )
    )
      return
    setBusy("clear")
    try {
      await clearWorkshopAction(dealId)
      setMessages([])
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-md border bg-muted/20 p-3">
        {messages.length === 0 && partial === null ? (
          <p className="text-sm text-muted-foreground">
            Think out loud about how to build this — architecture, stack,
            phases, effort. When the direction feels right, crystallise it into
            a project outline.
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-md bg-primary/10 p-3"
                : "mr-8 rounded-md bg-background p-3 shadow-sm"
            }
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {m.role === "user" ? "You" : "Workshop"}
            </p>
            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
          </div>
        ))}
        {partial !== null ? (
          <div className="mr-8 rounded-md bg-background p-3 shadow-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Workshop
            </p>
            <p className="whitespace-pre-wrap text-sm">
              {partial || "Thinking…"}
            </p>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex flex-col gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={3}
          placeholder="e.g. Could we do this as a thin Next.js app over their existing sheet?"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={busy !== null || !input.trim()}>
            {busy === "chat" ? "Answering…" : "Send"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null || (messages.length === 0 && partial === null)}
            onClick={crystallise}
          >
            {busy === "crystallise"
              ? "Crystallising…"
              : "Crystallise → project outline"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy !== null || messages.length === 0}
            onClick={clear}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  )
}
