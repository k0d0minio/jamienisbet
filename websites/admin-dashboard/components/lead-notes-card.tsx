"use client"

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import {
  DeskButton,
  RecordSection,
  toast,
} from "@jamie-nisbet/ui"

import { saveClientNotes } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Working notes — the note itself is the editor. Tap the text and it becomes a
// textarea exactly where it was reading, with the caret at the end of what is
// already written.
//
// This used to be a sheet, for a real reason: a fixed-height box that scrolls
// inside a page that also scrolls is a trap on a phone. The fix is not the
// sheet, it is the box — `field-sizing: content` grows the textarea to its content on
// every keystroke, so it has nothing to scroll and the page keeps the only
// scroll on screen. With that gone, so is the reason to send a one-line
// correction through a bottom sheet.
//
// It saves when focus leaves — dismissing the keyboard on a phone is the same
// gesture as being done — and on Save. Cancel and Save hold focus themselves
// (mousedown prevented), so pressing either is one intention, not a blur race.
export function LeadNotesCard({
  id,
  notes,
}: {
  id: string
  notes: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  // What the closed card reads while a save is in flight. `notes` is the
  // server's answer: when the action lands the optimistic layer falls away
  // onto it, so a refused write puts the old note back on its own.
  const [shown, showNote] = useOptimistic(notes ?? "")
  const box = useRef<HTMLTextAreaElement>(null)

  // Focus the box and put the caret after the last word rather than selecting
  // the note — you almost always came to add a line, not to replace it.
  useEffect(() => {
    if (!editing) return
    const el = box.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  function edit() {
    setDraft(notes ?? "")
    setEditing(true)
  }

  function commit() {
    const next = draft.trim()
    setEditing(false)
    if (next === (notes ?? "")) return

    startTransition(async () => {
      showNote(next)
      hapticTick()
      const formData = new FormData()
      formData.set("notes", next)
      try {
        await saveClientNotes(id, formData)
      } catch {
        // The draft is untouched, so putting the editor back is enough to
        // hand the words back with it.
        toast.error("Couldn't save the note — it's still in the box")
        setEditing(true)
      }
    })
  }

  if (editing) {
    return (
      <RecordSection header="Notes">
        <div className="grid gap-3 pt-1">
          <textarea
            ref={box}
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEditing(false)
              // The one keyboard shortcut a multi-line box needs, since
              // return is a newline here.
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                commit()
              }
            }}
            placeholder="Working notes — calls, decisions, next steps…"
            aria-label="Notes"
            autoCapitalize="sentences"
            // Grows with what is written.
            className="field-sizing-content min-h-24 w-full resize-none rounded-desk-control border border-desk-line-strong bg-desk-surface px-3 py-2 text-desk-body text-desk-fg placeholder:text-desk-fg-3"
          />
          <div className="flex items-center justify-end gap-2">
            <DeskButton
              type="button"
              variant="ghost"
              // Keep the caret where it is: without this the press blurs the
              // box first, which would save the very draft it discards.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setEditing(false)}
            >
              Cancel
            </DeskButton>
            <DeskButton
              type="button"
              loading={pending}
              onMouseDown={(event) => event.preventDefault()}
              onClick={commit}
            >
              {pending ? "Saving…" : "Save"}
            </DeskButton>
          </div>
        </div>
      </RecordSection>
    )
  }

  return (
    <RecordSection header="Notes">
      <button
        type="button"
        onClick={edit}
        aria-label={shown ? "Edit notes" : "Write a note"}
        aria-busy={pending || undefined}
        className="flex w-full items-start gap-3 rounded-desk-control py-2 text-left text-desk-body text-desk-fg transition-colors duration-100 hover:bg-desk-hover"
      >
        {shown ? (
          <span className="min-w-0 flex-1 whitespace-pre-wrap">{shown}</span>
        ) : (
          // Empty, and designed: it says what belongs here and it is the
          // thing you tap to start writing it.
          <span className="min-w-0 flex-1 text-desk-fg-3">
            Nothing written down yet — calls, decisions and next steps go
            here.
          </span>
        )}
        <Pencil
          className="mt-1 size-3.5 shrink-0 text-desk-fg-3"
          aria-hidden
        />
      </button>
    </RecordSection>
  )
}
