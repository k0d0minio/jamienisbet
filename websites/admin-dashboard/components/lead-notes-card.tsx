"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import {
  Button,
  Card,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
  toast,
} from "@jamie-nisbet/ui"

import { saveClientNotes } from "@/app/(app)/actions"

// Working notes, read on the page and written in a sheet — on a phone a live
// five-row textarea is a scroll trap (the page scroll and the box's own scroll
// fight), and the sheet gives the keyboard the whole screen instead.
export function LeadNotesCard({ id, notes }: { id: string; notes: string | null }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-3 py-1.5 pr-2 pl-4">
        <h2 className="text-sm font-semibold">Notes</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Pencil />
              Edit
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notes</SheetTitle>
              <SheetDescription>
                Calls, decisions, next steps — the running record.
              </SheetDescription>
            </SheetHeader>
            <form
              action={(formData) =>
                startTransition(async () => {
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
              <Textarea
                name="notes"
                rows={8}
                autoFocus
                defaultValue={notes ?? ""}
                placeholder="Working notes — calls, decisions, next steps…"
                aria-label="Notes"
              />
              <PendingButton
                pending={pending}
                pendingLabel="Saving…"
                className="w-full sm:w-fit"
              >
                Save
              </PendingButton>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {notes ? (
        <p className="border-t px-4 py-3 text-sm whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="border-t px-4 py-4 text-sm text-muted-foreground">
          No notes yet.
        </p>
      )}
    </Card>
  )
}
