"use client"

import { useOptimistic, useTransition } from "react"
import {
  Archive,
  ArchiveRestore,
  Check,
  Mail,
  MessageCircle,
  Trash2,
} from "lucide-react"

import { toast } from "@jamie-nisbet/ui"

import { archiveClient, markTouched, removeClient } from "@/app/(app)/actions"
import { SwipeAction, SwipeRow } from "@/components/swipe-row"
import { whatsappUrl } from "@/lib/format"
import { hapticTick } from "@/lib/haptics"

// One lead in the phone list, wearing the list's gestures: swipe left for the
// tray (WhatsApp, email, archive — or restore and delete in the archive view),
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
  // Archive, restore and delete all end with this row not being in this list.
  // It leaves on the tap rather than a round-trip later; if the write is
  // refused the optimistic layer falls away and the row is simply back, which
  // is why the failure toast has to name what didn't happen.
  const [leaving, setLeaving] = useOptimistic(false)

  // The three tray actions are the same shape: buzz once, take the row out,
  // then say what happened — the row is gone by the time it lands, so the
  // toast is the only place the outcome can be read.
  function commitRemoval(
    run: () => Promise<void>,
    done: string,
    failed: string
  ) {
    hapticTick()
    startTransition(async () => {
      setLeaving(true)
      try {
        await run()
        toast(done)
      } catch {
        toast.error(failed)
      }
    })
  }

  function onDelete() {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    commitRemoval(
      () => removeClient(id),
      `Deleted ${name}`,
      `Couldn't delete ${name}`
    )
  }

  if (leaving) return null

  const icon = "size-5" // tray icons read at a glance mid-swipe

  const actions = archived ? (
    <>
      <SwipeAction
        label="Restore"
        icon={<ArchiveRestore className={icon} aria-hidden />}
        className="bg-primary text-primary-foreground"
        onClick={() =>
          commitRemoval(
            () => archiveClient(id, false),
            `Restored ${name}`,
            `Couldn't restore ${name}`
          )
        }
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
        // WhatsApp chat, not a call — the number should open the conversation,
        // never surprise-dial the lead.
        <SwipeAction
          label="WhatsApp"
          icon={<MessageCircle className={icon} aria-hidden />}
          className="bg-success text-success-foreground"
          href={whatsappUrl(phone)}
          external
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
        onClick={() =>
          commitRemoval(
            () => archiveClient(id, true),
            `Archived ${name}`,
            `Couldn't archive ${name}`
          )
        }
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
              // The row's own "waiting" line is rendered on the server, so it
              // can't move until the revalidation lands — the green underlay
              // under the thumb, the tick SwipeRow fires on commit, and this
              // toast are what close the loop in the meantime.
              onCommit: () =>
                startTransition(async () => {
                  try {
                    await markTouched(id)
                    toast(`Marked ${name} as worked today`)
                  } catch {
                    toast.error(`Couldn't mark ${name} touched`)
                  }
                }),
            }
      }
    >
      <span className="sr-only">{`Swipe for actions on ${name}`}</span>
      {children}
    </SwipeRow>
  )
}
