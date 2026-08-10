"use client"

import { useRef, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { Button, Card, Input, Textarea } from "@jamie-nisbet/ui"

import { addLead } from "@/app/(app)/actions"

// Add a lead by hand — the meetup contact, the word-of-mouth introduction. The
// public forms cover everything that arrives on its own; this is for the rest,
// which is most of them while lead-gen is networking. Name is the only required
// field: the profile is where a record gets fleshed out.
export function LeadCreateForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        <Plus />
        Add lead
      </Button>
    )
  }

  return (
    <Card className="p-4">
      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            setError(null)
            try {
              await addLead(formData)
              formRef.current?.reset()
              setOpen(false)
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not add the lead.")
            }
          })
        }
        className="flex flex-col gap-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="name" placeholder="Name" required autoFocus />
          <Input name="company" placeholder="Company (optional)" />
          <Input name="email" type="email" placeholder="Email (optional)" />
          <Input name="phone" type="tel" placeholder="Phone (optional)" />
        </div>
        <Textarea
          name="intakeMessage"
          rows={2}
          placeholder="Where they came from, what they need… (optional)"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Adding…" : "Add lead"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setError(null)
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
