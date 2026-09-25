"use client"

import { useTransition } from "react"
import { Ban } from "lucide-react"

import {
  DeskField,
  DeskInput,
  PendingButton,
  RecordRow,
  RecordSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@jamie-nisbet/ui"

import { suppressClientContacts } from "@/app/(app)/actions"
import { useLeadProfile } from "@/components/lead-profile"
import { hapticTick } from "@/lib/haptics"

// "They asked to be removed" — the one gesture on this page that can't be
// taken back, and the legal floor under everything the outreach does.
//
// It is a different kind of irreversible from archive and delete: those hide
// or destroy a record; this makes a promise *about a person* that has to
// outlive the record either way — the suppression is keyed to the address and
// the number, not to this lead, so it survives the archive, the delete, the
// retention purge and next spring's re-import of the same business.
//
// Two parts. The sheet is reached from the head's menu, beside archive and
// delete and nowhere near the thumb — the sheet *is* the confirmation, which
// is why there is no second `confirm()` behind it. And once a channel is
// closed it reads back on the record as a row: what closed, when, and what
// they said — the whole point of the section on a lead nobody is going to
// contact again.

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

/** The channels that have opted out, as a record. Nothing when none has. */
export function LeadOptOuts({ channels }: { channels: SuppressibleChannel[] }) {
  const closed = channels.filter((channel) => channel.closed !== null)
  if (closed.length === 0) return null

  return (
    <RecordSection
      header="Opt-out"
      footer="An opt-out is permanent and belongs to the contact, not to this record — a re-import can't bring it back."
    >
      {closed.map((channel) => (
        <RecordRow
          key={`${channel.kind}:${channel.value}`}
          icon={<Ban />}
          label={channel.label}
          description={channel.closed?.reason ?? "No reason recorded"}
          value={
            <span className="font-mono text-desk-meta">
              {channel.closed?.on}
            </span>
          }
        />
      ))}
    </RecordSection>
  )
}

/** The opt-out sheet, opened from the head's menu (the profile holds its open
 *  state). Lists what will close, takes a reason, records it. */
export function LeadOptOutSheet({
  clientId,
  clientName,
  channels,
}: {
  clientId: string
  clientName: string
  channels: SuppressibleChannel[]
}) {
  const profile = useLeadProfile()
  const [pending, startTransition] = useTransition()
  const reachable = channels.filter((channel) => channel.closed === null)
  const open = profile?.optOutOpen ?? false
  const setOpen = (next: boolean) => profile?.setOptOutOpen(next)
  const closedAlready = reachable.length < channels.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>
            {closedAlready ? "Close the rest too" : "Record an opt-out"}
          </SheetTitle>
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
                className="flex items-baseline justify-between gap-3 text-desk-ui"
              >
                <span className="text-desk-fg-2">{channel.label}</span>
                <span className="truncate font-mono text-desk-fg">
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
            <DeskField
              label="Reason"
              hint="What they said, in a few words. Optional, and the only thing that explains this later."
            >
              <DeskInput
                name="reason"
                placeholder="Replied: remove me"
                autoCapitalize="sentences"
                maxLength={200}
                enterKeyHint="done"
              />
            </DeskField>
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
  )
}
