"use client"

import { useRef, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PendingButton,
  SegmentedControl,
  SegmentedItem,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
  cn,
  toast,
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
// only findable by scrolling past it. From `md` up, where there is no tab bar
// to sit above and no thumb zone to sit in, the same action is a `+` bar button
// on the trailing edge of the title bar — the way an iPad app adds a row — and
// the sheet becomes a centred dialog.
//
// Both triggers live in this one component because they open one sheet: two
// components would be two sheets, two pieces of form state, and two chances for
// them to disagree. The floating one is `fixed`, so where it sits in the tree
// makes no difference to where it lands.

// The two ways in. `status` is what actually gets stored — these are the two
// ends of the ladder, and the rungs between them (`talking`, or out to `lost`)
// are a dropdown away on the row itself.
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
    status: "client",
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
    <Sheet
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
      {/* Desktop: a bar button on the title bar's trailing edge. Keyed to
          `md`, where the chrome swaps the tab bar for the sidebar — the
          floating button below is positioned against that bar, so the two have
          to hand over on the same breakpoint. Tinted, because it is the one
          thing on this screen that makes something. */}
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Add lead or customer"
          title="Add lead or customer"
          className={cn(
            "hidden size-app-touch shrink-0 items-center justify-center rounded-app-control md:flex",
            "text-app-tint transition-colors spring-press active:bg-app-press"
          )}
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </SheetTrigger>

      {/* Phone: a floating disc riding above the floating tab bar, reachable
          one-handed. `bottom-above-tabs` reads the bar's own geometry, and
          `right-app-gutter` puts it on the same margin as everything else on
          the screen — the tab bar's pill is capped at `max-w-sm` and centred,
          so on any phone this clears it sideways as well as vertically.
          `shadow-app-chrome` is the tier's "this floats" step, the same one
          the bar under it takes. */}
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Add lead or customer"
          className={cn(
            "fixed right-app-gutter bottom-above-tabs z-20 flex size-14 items-center justify-center md:hidden",
            "rounded-full bg-app-tint text-primary-foreground shadow-app-chrome",
            // Press = colour deepens, never a shrink (BRAND.md § Motion).
            "transition-colors spring-press active:bg-primary-active"
          )}
        >
          <Plus className="size-6" aria-hidden />
        </button>
      </SheetTrigger>

      {/* A bottom sheet on a phone, a centred dialog from `sm` up — the Sheet
          primitive's whole job. One `large` detent rather than two: this is the
          tallest form in the app (a customer grows a value, a billing and a
          paid-in field), so resting it at half height would open it already
          scrolling. The handle still drags it off the bottom to dismiss. */}
      <SheetContent detents={["large"]}>
        <SheetHeader>
          <SheetTitle>{kind.title}</SheetTitle>
          <SheetDescription>{kind.description}</SheetDescription>
        </SheetHeader>

        {/* Lead or customer, above the fields — the first decision, and the one
            that changes what the rest of the form asks for. The app tier's
            segmented control, the same one the leads list filters with, so a
            closed choice looks the same wherever it is made. Radio semantics
            rather than tabs: this is a value being chosen, not a view being
            switched. */}
        <SegmentedControl role="radiogroup" aria-label="What you're adding">
          {KINDS.map((option) => (
            <SegmentedItem
              key={option.key}
              role="radio"
              label={option.label}
              active={option.key === kind.key}
              onClick={() => setKind(option)}
            />
          ))}
        </SegmentedControl>

        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              setError(null)
              try {
                const name = String(formData.get("name") ?? "").trim()
                await addClient(formData)
                formRef.current?.reset()
                setOpen(false)
                toast.success(
                  name ? `Added ${name}` : `Added the ${kind.key}`
                )
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
            <Input
              name="name"
              placeholder="Name"
              required
              autoFocus
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Input
              name="company"
              placeholder="Company (optional)"
              autoComplete="organization"
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="Email (optional)"
            />
            <Input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="Phone (optional)"
            />
          </div>

          {/* What they're worth, asked for only when adding a customer. A lead's
              figure is usually a guess at this point and belongs on the profile
              once it firms up; a customer's is known now, and leaving it out
              would understate the monthly total the moment they're added.
              "Paid in" is here for the same reason and no more: a swap filed as
              cash overstates the pipeline from the moment it's typed. The rest
              of the deal — commission, equity, what's being exchanged — skews no
              total by waiting, so it belongs on the profile. */}
          {isCustomer ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="value">Value (€)</Label>
                <Input
                  id="value"
                  name="value"
                  inputMode="decimal"
                  enterKeyHint="next"
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
              <div className="grid gap-1.5">
                <Label htmlFor="dealType">Paid in</Label>
                <Select name="dealType" defaultValue="cash">
                  <SelectTrigger id="dealType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="barter">Services</SelectItem>
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
            autoCapitalize="sentences"
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
            <PendingButton pending={pending} pendingText="Adding…">
              {kind.submit}
            </PendingButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
