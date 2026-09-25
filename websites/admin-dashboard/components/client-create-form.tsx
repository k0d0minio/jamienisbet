"use client"

import { useRef, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import {
  DeskField,
  DeskInput,
  DeskSelect,
  DeskSelectContent,
  DeskSelectItem,
  DeskSelectTrigger,
  DeskSelectValue,
  DeskTextarea,
  Button,
  DeskButton,
  PendingButton,
  DeskSegmentedControl,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { addClient } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Add someone by hand — the meetup contact, the word-of-mouth introduction, the
// client who has been paying since before this dashboard existed. The public
// forms cover everything that arrives on its own; this is for the rest, which is
// most of them while lead-gen is networking.
//
// One row per person, so a lead and a client are the same record and only
// `status` tells them apart. That is the one choice this form asks for up front:
// entering an existing client as a lead and then advancing them is two extra
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
// ends of the ladder, and the rest of it (in discussion, past, not won) is a
// dropdown away on their profile.
//
// The third copy of the status vocabulary in the dashboard, and the one the
// cold pool deliberately did **not** grow. `prospect` and `nurture` are rungs a
// row is *imported* onto, in a batch of eighty-five, by the seeding script —
// never typed in one business at a time. Offering "Prospect" here would be a
// third button that nobody has a reason to press, and the leads list hides this
// form in the prospects view for the same reason.
const KINDS = [
  {
    key: "lead",
    label: "Lead",
    status: "lead",
    title: "Add lead",
    description:
      "Name is all that's needed — the rest can be filled in on their profile.",
    submit: "Add lead",
    // The box at the foot of the form, which writes to a different column
    // depending on which of these you are adding — so it needs a different
    // label too, not just a different placeholder.
    note: "How they came in (optional)",
    placeholder: "Where they came from, what they need…",
    // Their own words about why they're here: the intake payload, same column
    // the public contact form writes to.
    field: "intakeMessage",
  },
  {
    key: "client",
    label: "Active client",
    status: "active",
    title: "Add client",
    description:
      "Someone already paying. Their value keeps the totals on this page honest from the start.",
    submit: "Add client",
    note: "Working notes (optional)",
    placeholder: "What you're doing for them, where things stand…",
    // Nothing was "taken in" from a client you're already working with, so the
    // same box writes to working notes instead of the intake column.
    field: "notes",
  },
] as const

type Kind = (typeof KINDS)[number]

export function ClientCreateForm({
  trigger = "bar",
}: {
  /** `bar` — today's two triggers: the title bar's `+` from `md` and the
   *  floating button below it. `desk` — the desk Leads header's one "Add
   *  lead" button; that screen renders its phone tree separately, with the
   *  `bar` form, so each breakpoint has exactly one way in. */
  trigger?: "bar" | "desk"
} = {}) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>(KINDS[0])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isClient = kind.key === "client"

  // Both triggers say "Add lead or client": it's a lead nine times out of ten,
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
        // client, and the next person you typed in would silently be filed as
        // one too. The fields look after themselves (Radix unmounts the content
        // when it closes); this is for the state living out here.
        if (next) {
          setError(null)
          setKind(KINDS[0])
        }
      }}
    >
      {trigger === "desk" ? (
        // The desk Leads header: the screen's one primary act, in words.
        <SheetTrigger asChild>
          <DeskButton variant="primary" title="Add lead or client">
            <Plus aria-hidden />
            Add lead
          </DeskButton>
        </SheetTrigger>
      ) : (
        <>
          {/* Desktop: a bar button on the title bar's trailing edge. Keyed to
              `md`, where the chrome swaps the tab bar for the rail — the
              floating button below is positioned against that bar, so the two have
              to hand over on the same breakpoint. Tinted, because it is the one
              thing on this screen that makes something. */}
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Add lead or client"
              title="Add lead or client"
              className={cn(
                "hidden size-desk-control shrink-0 items-center justify-center rounded-desk-control md:flex",
                "text-desk-ink transition-colors duration-100 active:bg-desk-sunken"
              )}
            >
              <Plus className="size-5" aria-hidden />
            </button>
          </SheetTrigger>

          {/* Phone: a floating disc riding above the floating tab bar, reachable
              one-handed. `bottom-above-tabs` reads the bar's own geometry, and
              the gutter token puts it on the same margin as everything else on
              the screen. `shadow-desk-float` is the tier's one shadow, for what
              floats — and this does. */}
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Add lead or client"
              className={cn(
                "fixed right-4 bottom-above-tabs z-20 flex size-14 items-center justify-center md:hidden",
                "rounded-full bg-desk-ink text-desk-ink-fg shadow-desk-float",
                // Press = colour deepens, never a shrink (BRAND.md § Motion).
                "transition-colors duration-100 active:bg-desk-ink-hover"
              )}
            >
              <Plus className="size-6" aria-hidden />
            </button>
          </SheetTrigger>
        </>
      )}

      {/* A bottom sheet on a phone, a centred dialog from `sm` up — the Sheet
          primitive's whole job. One `large` detent rather than two: this is the
          tallest form in the app (a client grows a value, a billing and a
          paid-in field), so resting it at half height would open it already
          scrolling. The handle still drags it off the bottom to dismiss. */}
      <SheetContent detents={["large"]}>
        <SheetHeader>
          <SheetTitle>{kind.title}</SheetTitle>
          <SheetDescription>{kind.description}</SheetDescription>
        </SheetHeader>

        {/* Lead or client, above the fields — the first decision, and the one
            that changes what the rest of the form asks for. The desk tier's
            segmented control, the same one the leads list filters with, so a
            closed choice looks the same wherever it is made. Radio semantics
            rather than tabs: this is a value being chosen, not a view being
            switched. */}
        <DeskSegmentedControl
          aria-label="What you're adding"
          className="w-full"
          value={kind.key}
          onValueChange={(key) =>
            setKind(KINDS.find((option) => option.key === key) ?? kind)
          }
          options={KINDS.map((option) => ({
            value: option.key,
            label: option.label,
          }))}
        />

        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              hapticTick()
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

          {/* The four identity fields carry their label rather than leaning on
              a placeholder: a placeholder is gone the moment you type into it,
              which on the tallest form in the app means scrolling back up to
              remember which box the phone number went in. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <DeskField label="Name">
              <DeskInput
                name="name"
                placeholder="Ana Ferreira"
                required
                autoFocus
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
              />
            </DeskField>
            <DeskField label="Company (optional)">
              <DeskInput
                name="company"
                placeholder="—"
                autoComplete="organization"
                autoCapitalize="words"
                enterKeyHint="next"
              />
            </DeskField>
            <DeskField label="Email (optional)">
              <DeskInput
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                placeholder="—"
              />
            </DeskField>
            <DeskField label="Phone (optional)">
              <DeskInput
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                placeholder="—"
              />
            </DeskField>
          </div>

          {/* What they're worth, asked for only when adding a client. A lead's
              figure is usually a guess at this point and belongs on the profile
              once it firms up; a client's is known now, and leaving it out
              would understate the monthly total the moment they're added — but
              only if there is one. A client paid in a stake or a cut has no fee
              to type, so the field stays optional and the profile takes the
              percentages.
              "Paid in" is here for the same reason and no more: a swap filed as
              cash overstates the pipeline from the moment it's typed. The rest
              of the deal — commission, equity, what's being exchanged — skews no
              total by waiting, so it belongs on the profile. */}
          {isClient ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <DeskField label="Value (€)" hint="Empty if there's no fee.">
                <DeskInput
                  name="value"
                  inputMode="decimal"
                  enterKeyHint="next"
                  placeholder="0.00"
                />
              </DeskField>
              <DeskField label="Billed">
                <DeskSelect name="billingType" defaultValue="one_off">
                  <DeskSelectTrigger className="w-full">
                    <DeskSelectValue />
                  </DeskSelectTrigger>
                  <DeskSelectContent>
                    <DeskSelectItem value="one_off">One-off</DeskSelectItem>
                    <DeskSelectItem value="monthly">Every month</DeskSelectItem>
                  </DeskSelectContent>
                </DeskSelect>
              </DeskField>
              <DeskField label="Paid in">
                <DeskSelect name="dealType" defaultValue="cash">
                  <DeskSelectTrigger className="w-full">
                    <DeskSelectValue />
                  </DeskSelectTrigger>
                  <DeskSelectContent>
                    <DeskSelectItem value="cash">Cash</DeskSelectItem>
                    <DeskSelectItem value="barter">Services</DeskSelectItem>
                  </DeskSelectContent>
                </DeskSelect>
              </DeskField>
            </div>
          ) : null}

          {/* Keyed on the kind so switching gives a genuinely empty box rather
              than carrying text written for the other one into a new column. */}
          <DeskField key={kind.field} label={kind.note}>
            <DeskTextarea
              name={kind.field}
              rows={2}
              autoCapitalize="sentences"
              placeholder={kind.placeholder}
            />
          </DeskField>

          {error ? (
            <p className="text-desk-meta text-destructive">{error}</p>
          ) : null}
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
