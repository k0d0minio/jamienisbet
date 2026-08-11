"use client"

import { useRef, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Textarea,
} from "@jamie-nisbet/ui"

import { addLead } from "@/app/(app)/actions"

// Add a lead by hand — the meetup contact, the word-of-mouth introduction. The
// public forms cover everything that arrives on its own; this is for the rest,
// which is most of them while lead-gen is networking. Name is the only required
// field: the profile is where a record gets fleshed out.
//
// Adding a lead is the one thing you do on this screen that isn't reading, so on
// a phone it gets a floating button in the thumb zone above the tab bar and the
// form opens as a bottom sheet — never a form wedged into the scroll, which is
// only findable by scrolling past it. Desktop keeps the plain inline button and
// gets the same content as a centred dialog.
export function LeadCreateForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      {/* Desktop: an ordinary button beside the page heading. */}
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="hidden sm:inline-flex">
          <Plus />
          Add lead
        </Button>
      </DialogTrigger>

      {/* Phone: a floating button pinned above the tab bar, reachable one-handed. */}
      <DialogTrigger asChild>
        <Button
          type="button"
          aria-label="Add lead"
          className="fixed right-4 bottom-above-tabs z-20 size-14 rounded-full shadow-lg sm:hidden"
        >
          <Plus className="size-6" />
        </Button>
      </DialogTrigger>

      {/* A bottom sheet on a phone, a centred dialog from `sm` up. */}
      <DialogContent
        className={[
          "top-auto bottom-0 left-0 max-h-[85dvh] w-full max-w-none translate-x-0 translate-y-0",
          "overflow-y-auto rounded-b-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
          "data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8",
          "sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-none sm:max-w-lg",
          "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6",
        ].join(" ")}
      >
        {/* Sheet grab handle — phones only; a dialog doesn't need one. */}
        <div
          className="mx-auto -mt-1 mb-1 h-1 w-10 rounded-full bg-border sm:hidden"
          aria-hidden
        />
        <DialogHeader className="text-left">
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Name is all that&apos;s needed — the rest can be filled in on their
            profile.
          </DialogDescription>
        </DialogHeader>

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
                setError(
                  err instanceof Error ? err.message : "Could not add the lead."
                )
              }
            })
          }
          className="flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Name" required autoFocus />
            <Input name="company" placeholder="Company (optional)" />
            <Input
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Email (optional)"
            />
            <Input
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="Phone (optional)"
            />
          </div>
          <Textarea
            name="intakeMessage"
            rows={2}
            placeholder="Where they came from, what they need… (optional)"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {/* Primary action full-width and last on a phone — thumb lands on it. */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setError(null)
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
