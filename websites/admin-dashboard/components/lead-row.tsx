"use client"

import { useTransition } from "react"
import { Archive, ArchiveRestore, Check, Mail, Phone, Trash2 } from "lucide-react"

import { archiveClient, markTouched, removeClient } from "@/app/(app)/actions"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"

// One lead in the phone list, wearing the list's gestures: swipe left for the
// tray (call, email, archive — or restore and delete in the archive view),
// swipe right to mark them touched in one stroke. The row content itself is
// rendered by the server page and passed through as children, so this
// component carries only what the gestures need.
export function LeadRow({
  id,
  name,
  phone,
  email,
  archived,
  children,
}: {
  id: string
  name: string
  phone: string | null
  email: string | null
  archived: boolean
  children: React.ReactNode
}) {
  const [, startTransition] = useTransition()

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    startTransition(() => removeClient(id))
  }

  const icon = "size-5" // tray icons read at a glance mid-swipe

  const actions = archived ? (
    <>
      <SwipeAction
        label="Restore"
        icon={<ArchiveRestore className={icon} aria-hidden />}
        className="bg-primary text-primary-foreground"
        onClick={() => startTransition(() => archiveClient(id, false))}
      />
      <SwipeAction
        label="Delete"
        icon={<Trash2 className={icon} aria-hidden />}
        className="bg-destructive text-white"
        onClick={onDelete}
      />
    </>
  ) : (
    <>
      {phone ? (
        <SwipeAction
          label="Call"
          icon={<Phone className={icon} aria-hidden />}
          className="bg-success text-success-foreground"
          href={`tel:${phone}`}
        />
      ) : null}
      {email ? (
        <SwipeAction
          label="Email"
          icon={<Mail className={icon} aria-hidden />}
          className="bg-primary text-primary-foreground"
          href={`mailto:${email}`}
        />
      ) : null}
      <SwipeAction
        label="Archive"
        icon={<Archive className={icon} aria-hidden />}
        className="bg-muted-foreground text-background"
        onClick={() => startTransition(() => archiveClient(id, true))}
      />
    </>
  )

  return (
    <SwipeRow
      className="rounded-lg border bg-card text-card-foreground"
      actions={actions}
      commit={
        archived
          ? undefined
          : {
              label: "Touched",
              icon: <Check className="size-5" aria-hidden />,
              className: "bg-success text-success-foreground",
              // markTouched revalidates the list, so the row's own "waiting"
              // line is the confirmation.
              onCommit: () => startTransition(() => markTouched(id)),
            }
      }
    >
      <span className="sr-only">{`Swipe for actions on ${name}`}</span>
      {children}
    </SwipeRow>
  )
}
