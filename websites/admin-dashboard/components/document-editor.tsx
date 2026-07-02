"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"

import { Button, Input, Label, Textarea } from "@jamie-nisbet/ui"

import { saveDocumentAction } from "@/app/(app)/deals/actions"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  )
}

/**
 * The human edit surface every ICM output must have. Read mode shows the
 * document as-is (markdown is the interface — no lossy rendering); edit mode
 * is a plain textarea over the same text. Approved versions are locked — the
 * server refuses edits — so the editor only offers itself on live drafts.
 */
export function DocumentEditor({
  id,
  title,
  content,
  isHtml,
  editable,
}: {
  id: string
  title: string
  content: string
  isHtml: boolean
  editable: boolean
}) {
  const [editing, setEditing] = useState(false)
  const save = saveDocumentAction.bind(null, id)

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        {editable ? (
          <div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        ) : null}
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
          {content}
        </pre>
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        await save(formData)
        setEditing(false)
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid gap-2">
        <Label htmlFor="doc-title">Title</Label>
        <Input id="doc-title" name="title" defaultValue={title} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="doc-content">{isHtml ? "HTML" : "Markdown"}</Label>
        <Textarea
          id="doc-content"
          name="content"
          defaultValue={content}
          rows={24}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <SaveButton />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
