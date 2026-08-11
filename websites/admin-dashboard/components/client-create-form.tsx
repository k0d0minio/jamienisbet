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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@jamie-nisbet/ui"

import { addClient } from "@/app/(app)/actions"

// Add someone by hand — the meetup contact, the word-of-mouth introduction, the
// client who has been paying since before this dashboard existed. The public
// forms cover everything that arrives on its own; this is for the rest, which is
// most of them while lead-gen is networking.
//
// One row per person, so a lead and a customer are the same record and only
// `status` tells them apart. That is the one choice this form asks for up front:
// entering an existing customer as a lead and then advancing them is two extra
// steps for a fact you already knew when you started typing.
//
// Adding someone is the one thing you do on this screen that isn't reading, so on
// a phone it gets a floating button in the thumb zone above the tab bar and the
// form opens as a bottom sheet — never a form wedged into the scroll, which is
// only findable by scrolling past it. Desktop keeps the plain inline button and
// gets the same content as a centred dialog.

// The two ways in. `status` is what actually gets stored — these are the entry
// points of the pipeline's two halves, and anywhere else along it (contacted,
// proposed, delivered…) is a dropdown away on the row itself.
const KINDS = [
  {
    key: "lead",
    label: "Lead",
    status: "new",
    title: "Add lead",
    description:
      "Name is all that's needed — the rest can be filled in on their profile.",
    submit: "Add lead",
    placeholder: "Where they came from, what they need… (optional)",
    // Their own words about why they're here: the intake payload, same column
    // the public contact form writes to.
    field: "intakeMessage",
  },
  {
    key: "customer",
    label: "Customer",
    status: "won",
    title: "Add customer",
    description:
      "Someone already paying. Their value keeps the totals on this page honest from the start.",
    submit: "Add customer",
    placeholder: "What you're doing for them, where things stand… (optional)",
    // Nothing was "taken in" from a customer you're already working with, so the
    // same box writes to working notes instead of the intake column.
    field: "notes",
  },
] as const

type Kind = (typeof KINDS)[number]

export function ClientCreateForm() {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>(KINDS[0])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isCustomer = kind.key === "customer"

  // Both triggers say "lead": that's what you're adding nine times out of ten,
  // and the choice is the first thing inside the sheet anyway.
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Reset on the way *in*, not on the way out. Closing after a successful
        // add — and the Cancel button — set `open` directly, and Radix only
        // calls onOpenChange for closes it initiates itself, so a reset here
        // guarded on `!next` would be skipped on exactly those paths: add a
        // customer, and the next person you typed in would silently be filed as
        // one too. The fields look after themselves (Radix unmounts the content
        // when it closes); this is for the state living out here.
        if (next) {
          setError(null)
          setKind(KINDS[0])
        }
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
          aria-label="Add lead or customer"
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
          <DialogTitle>{kind.title}</DialogTitle>
          <DialogDescription>{kind.description}</DialogDescription>
        </DialogHeader>

        {/* Lead or customer, as a segmented control above the fields — the first
            decision, and the one that changes what the rest of the form asks
            for. Radio semantics rather than tabs: this is a value being chosen,
            not a view being switched. */}
        <div
          role="radiogroup"
          aria-label="What you're adding"
          className="flex gap-1 rounded-sm bg-muted p-1"
        >
          {KINDS.map((option) => {
            const active = option.key === kind.key
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setKind(option)}
                // Same recipe as the filter chips (components/chip.tsx): the
                // selected one is a raised card against the sunken track. Weight
                // alone doesn't carry it in the light theme.
                className={cn(
                  "h-10 flex-1 rounded-sm text-sm transition-colors",
                  active
                    ? "border border-border bg-card font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              setError(null)
              try {
                await addClient(formData)
                formRef.current?.reset()
                setOpen(false)
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : `Could not add the ${kind.key}.`
                )
              }
            })
          }
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="status" value={kind.status} />

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

          {/* What they're worth, asked for only when adding a customer. A lead's
              figure is usually a guess at this point and belongs on the profile
              once it firms up; a customer's is known now, and leaving it out
              would understate the monthly total the moment they're added. */}
          {isCustomer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="value">Value (€)</Label>
                <Input
                  id="value"
                  name="value"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="billingType">Billed</Label>
                <Select name="billingType" defaultValue="one_off">
                  <SelectTrigger id="billingType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_off">One-off</SelectItem>
                    <SelectItem value="monthly">Every month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {/* Keyed on the kind so switching gives a genuinely empty box rather
              than carrying text written for the other one into a new column. */}
          <Textarea
            key={kind.field}
            name={kind.field}
            rows={2}
            placeholder={kind.placeholder}
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
              {pending ? "Adding…" : kind.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
