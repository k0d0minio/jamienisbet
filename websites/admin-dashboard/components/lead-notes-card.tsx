"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import {
  AppTextarea,
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

import { saveClientNotes } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Working notes, read on the page and written in a sheet — on a phone a live
// five-row textarea is a scroll trap (the page scroll and the box's own scroll
// fight), and the sheet gives the keyboard the whole screen instead. It opens
// at the medium detent and can be dragged up to full height for a long note.
export function LeadNotesCard({ id, notes }: { id: string; notes: string | null }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <GroupedSection header="Notes">
      {notes ? (
        <GroupedBlock>
          <p className="whitespace-pre-wrap">{notes}</p>
        </GroupedBlock>
      ) : (
        <GroupedBlock>
          Nothing written down yet — calls, decisions and next steps go here.
        </GroupedBlock>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <GroupedRow
            icon={<Pencil />}
            label={notes ? "Edit notes" : "Write a note"}
          />
        </SheetTrigger>
        <SheetContent detents={["medium", "large"]}>
          <SheetHeader>
            <SheetTitle>Notes</SheetTitle>
            <SheetDescription>
              Calls, decisions, next steps — the running record.
            </SheetDescription>
          </SheetHeader>
          <form
            action={(formData) =>
              startTransition(async () => {
                hapticTick()
                try {
                  await saveClientNotes(id, formData)
                  setOpen(false)
                } catch {
                  // The sheet stays open on a failure, so the note you just
                  // typed is still there to try again with.
                  toast.error("Couldn't save the note")
                }
              })
            }
            className="grid gap-3"
          >
            <AppTextarea
              name="notes"
              rows={8}
              autoFocus
              defaultValue={notes ?? ""}
              placeholder="Working notes — calls, decisions, next steps…"
              aria-label="Notes"
            />
            <PendingButton
              pending={pending}
              pendingText="Saving…"
              className="w-full sm:w-fit"
            >
              Save
            </PendingButton>
          </form>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
