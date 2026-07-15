"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Trash2 } from "lucide-react"

import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@jamie-nisbet/ui"

import {
  deleteTouchAction,
  logTouchAction,
  saveTouchAction,
  setTouchStatusAction,
} from "@/app/(app)/clients/actions"
import { CopyButton } from "@/components/copy-button"

// Serializable projection of a biz.touches row.
export type TouchDraft = {
  id: string
  kind: string
  contentMd: string
  version: number
  status: string
  loggedAt: string | null // ISO
  channel: string | null
  createdAt: string // ISO
}

// Mirror the canonical sets in @jamie-nisbet/services — kept local so this
// client component doesn't pull the services barrel into the browser bundle.
const KINDS = [
  { value: "outreach", label: "Outreach (first touch)" },
  { value: "follow_up", label: "Follow-up (nudge)" },
  { value: "chase", label: "Payment chase" },
] as const

const CHANNELS = ["email", "whatsapp", "in_person", "other"] as const

const KIND_LABEL: Record<string, string> = {
  outreach: "Outreach",
  follow_up: "Follow-up",
  chase: "Chase",
}

// The draft-only outreach surface on a client's page: pick a shape, generate a
// draft in Jamie's voice, edit it, approve it (only then can it be copied
// out), and log the send after it went from Jamie's OWN email/WhatsApp.
// Nothing here sends anything.
export function OutreachComposer({
  clientId,
  touches,
}: {
  clientId: string
  touches: TouchDraft[]
}) {
  const router = useRouter()
  const [kind, setKind] = useState<string>("outreach")
  const [guidance, setGuidance] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          kind,
          guidance: guidance.trim() || undefined,
        }),
      })
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? `Drafting failed (${res.status}).`)
        return
      }
      // Drain the stream; the draft lands as a touches row when it completes.
      const reader = res.body.getReader()
      for (;;) {
        const { done } = await reader.read()
        if (done) break
      }
      setGuidance("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drafting failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Draft it
          </Button>
        </div>
        <Textarea
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          rows={2}
          placeholder="Optional steer for this draft (e.g. 'mention the meetup on Thursday', 'invoice #12, €800, due last Monday')"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {touches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No drafts yet. Drafts are review-gated: approve one before copying it
          out, and log the send once it went from your own email.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {touches.map((touch) => (
            <TouchCard key={touch.id} touch={touch} />
          ))}
        </div>
      )}
    </div>
  )
}

function TouchCard({ touch }: { touch: TouchDraft }) {
  const [pending, startTransition] = useTransition()
  const [content, setContent] = useState(touch.contentMd)
  const [editing, setEditing] = useState(false)
  const [channel, setChannel] = useState<string>("email")

  const approved = touch.status === "approved"
  const sent = touch.loggedAt !== null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {KIND_LABEL[touch.kind] ?? touch.kind} · v{touch.version}
        </span>
        {sent ? (
          <Badge variant="success">
            Sent via {touch.channel ?? "?"} ·{" "}
            {new Date(touch.loggedAt!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        ) : (
          <Badge
            variant={
              approved
                ? "success"
                : touch.status === "in_review"
                  ? "default"
                  : "outline"
            }
            className="capitalize"
          >
            {touch.status.replace("_", " ")}
          </Badge>
        )}
        {!sent && (
          <button
            type="button"
            aria-label="Delete draft"
            disabled={pending}
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => startTransition(() => deleteTouchAction(touch.id))}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {editing ? (
        <>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await saveTouchAction(touch.id, content)
                  setEditing(false)
                })
              }
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setContent(touch.contentMd)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <pre className="max-h-56 overflow-y-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
          {content}
        </pre>
      )}

      {!sent && !editing && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          {!approved ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  setTouchStatusAction(touch.id, "approved")
                )
              }
            >
              Approve
            </Button>
          ) : (
            <>
              {/* The review gate in action: copy only unlocks on approval. */}
              <CopyButton value={content} label="Copy email" />
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger size="sm" className="w-28 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(() => logTouchAction(touch.id, channel))
                }
              >
                Mark as sent
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
