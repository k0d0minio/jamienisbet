"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import {
  Button,
  Card,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
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
                  await saveClientNotes(id, formData)
                  setOpen(false)
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
              <Button type="submit" disabled={pending} className="w-full sm:w-fit">
                {pending ? "Saving…" : "Save"}
              </Button>
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
