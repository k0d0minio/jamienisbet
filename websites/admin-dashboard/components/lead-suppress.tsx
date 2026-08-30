"use client"

import { useState, useTransition } from "react"
import { Ban, ShieldBan } from "lucide-react"

import {
  AppField,
  AppInput,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"

import { suppressClientContacts } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// "They asked to be removed" — the one gesture on this page that can't be
// taken back, and the legal floor under everything the outreach does.
//
// It is a section of its own rather than a fourth red row in the danger zone,
// because it is a different kind of irreversible. Archiving hides a record and
// deleting destroys one; this one makes a promise *about a person* that has to
// outlive the record either way — the suppression is keyed to the address and
// the number, not to this lead, so it survives the archive, the delete, the
// retention purge and next spring's re-import of the same business. The danger
// zone's footer says "archiving keeps the record, deleting can't be undone",
// which is true of those two and says nothing useful about this.
//
// It sits above the danger zone and below everything you'd open the page to
// read: last on the record, nowhere near the thumb reaching for the status at
// the top, and reached through a sheet rather than a tap — the sheet *is* the
// confirmation, which is why there is no second `confirm()` behind it.
//
// Once a channel is closed it reads back here as a row: what closed, when, and
// what they said. That record is the whole point of the section on a lead
// nobody is going to contact again.

export type SuppressibleChannel = {
  /** 'email' | 'phone' | 'instagram' — the row's key. */
  kind: string
  /** Resolved on the server through the services layer's label lookup: no
   *  surface here capitalises a stored string into the UI. */
  label: string
  /** The address, number or handle, normalized the way it will be stored — a
   *  lowercased address, an E.164 number — so what the sheet promises to close
   *  is literally what lands in the table. */
  value: string
  /** Set when this one has already opted out: when, and what they said. */
  closed: { on: string; reason: string | null } | null
}

export function LeadSuppress({
  clientId,
  clientName,
  channels,
}: {
  clientId: string
  clientName: string
  channels: SuppressibleChannel[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const closed = channels.filter((channel) => channel.closed !== null)
  const reachable = channels.filter((channel) => channel.closed === null)

  return (
    <GroupedSection
      header="Opt-out"
      footer={
        closed.length > 0
          ? "An opt-out is permanent and belongs to the contact, not to this record — a re-import can't bring it back."
          : "Closes every channel for good, moves them to Not won, and keeps the record so a re-import can't start again."
      }
    >
      {closed.map((channel) => (
        <GroupedRow
          key={`${channel.kind}:${channel.value}`}
          icon={<Ban />}
          label={channel.label}
          // What they said is the thing worth reading a year later — it is
          // what tells you this was a request rather than a mis-tap.
          description={channel.closed?.reason ?? "No reason recorded"}
          value={<span className="font-mono">{channel.closed?.on}</span>}
          chevron={false}
        />
      ))}

      {/* Nothing to close and nothing closed: a lead with no contact details
          on file. Said plainly rather than shown as a control that would do
          nothing. */}
      {channels.length === 0 ? (
        <GroupedBlock>
          No email, number or handle on file — there is nothing to close.
        </GroupedBlock>
      ) : null}

      {reachable.length > 0 ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <GroupedRow
              icon={<ShieldBan />}
              label={
                closed.length > 0
                  ? "Close the rest too"
                  : "They asked to be removed"
              }
              variant="destructive"
            />
          </SheetTrigger>
          <SheetContent detents={["medium", "large"]}>
            <SheetHeader>
              <SheetTitle>Record an opt-out</SheetTitle>
              <SheetDescription>
                {clientName} asked not to be contacted again. This closes the
                channels below permanently, moves them to Not won, and clears
                what happens next.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-3">
              {/* What is actually about to close, in the normalized form it
                  will be stored in — so nothing here is a surprise afterwards. */}
              <ul className="grid gap-1.5">
                {reachable.map((channel) => (
                  <li
                    key={`${channel.kind}:${channel.value}`}
                    className="flex items-baseline justify-between gap-3 text-app-subhead"
                  >
                    <span className="text-app-label-2">{channel.label}</span>
                    <span className="truncate font-mono text-app-label">
                      {channel.value}
                    </span>
                  </li>
                ))}
              </ul>

              <form
                action={(formData) =>
                  startTransition(async () => {
                    hapticTick()
                    const result = await suppressClientContacts(
                      clientId,
                      formData
                    )
                    if (!result.ok) {
                      // The sheet stays open on a failure, so the reason you
                      // typed is still there to try again with.
                      toast.error(result.message)
                      return
                    }
                    setOpen(false)
                    toast(
                      result.closed.length > 0
                        ? `Opted out — ${result.closed.join(", ")} closed`
                        : "Opted out"
                    )
                  })
                }
                className="grid gap-3"
              >
                <AppField
                  label="Reason"
                  hint="What they said, in a few words. Optional, and the only thing that explains this later."
                >
                  <AppInput
                    name="reason"
                    placeholder="Replied: remove me"
                    autoCapitalize="sentences"
                    maxLength={200}
                    enterKeyHint="done"
                  />
                </AppField>
                <PendingButton
                  pending={pending}
                  pendingText="Recording…"
                  variant="destructive"
                  className="w-full sm:w-fit"
                >
                  Record the opt-out
                </PendingButton>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </GroupedSection>
  )
}
