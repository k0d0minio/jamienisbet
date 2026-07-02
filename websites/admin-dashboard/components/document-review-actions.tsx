"use client"

import { useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import {
  approveDocumentAction,
  rejectDocumentAction,
  removeDocumentAction,
  reopenDocumentAction,
} from "@/app/(app)/deals/actions"

/**
 * The review gate as buttons. Approve is the one human sign-off the ICM
 * contracts require before an artifact can feed anything downstream — it gets
 * an explicit confirm so it's never a stray tap on a phone.
 */
export function DocumentReviewActions({
  id,
  status,
}: {
  id: string
  status: string
}) {
  const [pending, startTransition] = useTransition()

  const run = (fn: (id: string) => Promise<void>, confirmText?: string) => () => {
    if (confirmText && !window.confirm(confirmText)) return
    startTransition(() => fn(id))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" || status === "in_review" ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={run(
              approveDocumentAction,
              "Approve this version? Approval unlocks downstream steps (dependent documents, invoicing, export, repo sync) and locks this content."
            )}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={run(rejectDocumentAction)}
          >
            Reject
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={run(
            reopenDocumentAction,
            status === "approved"
              ? "Reopen this approved version as a draft? Anything already produced from it is unaffected, but it will no longer count as approved."
              : undefined
          )}
        >
          Reopen as draft
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={run(
          removeDocumentAction,
          "Delete this version permanently? This cannot be undone."
        )}
      >
        Delete
      </Button>
    </div>
  )
}
