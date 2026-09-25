import { CircleCheck, ExternalLink, Hourglass, Share2 } from "lucide-react"

import {
  DeskButton,
  RecordBlock,
  RecordDisclosure,
  RecordSection,
  cn,
} from "@jamie-nisbet/ui"
import { zipAnswers, type FormLink } from "@jamie-nisbet/services"

import { CopyButton } from "@/components/copy-button"
import { DeleteFormLinkButton } from "@/components/delete-form-link-button"
import { SendFormRow, type FormChoiceView } from "@/components/send-form-control"
import {
  ShareFormLinkSheet,
  ShareLinkButton,
} from "@/components/share-form-link"
import { WriteFormToRepoButton } from "@/components/write-form-to-repo-button"
import { formatDateTime } from "@/lib/format"
import { formLinkUrl } from "@/lib/portfolio"

// The Forms group on a lead's profile: send a questionnaire, then watch for it
// to come back. One row per link, folded — a pending one opens onto the URL
// itself, an answered one onto the reading. The newest set of answers is open
// on arrival, because that is the one you came for.
//
// A pending link is a thing you are trying to give somebody, so it carries the
// giving on the row: the share glyph beside it is one tap to the OS share
// sheet (or the clipboard, on glass that has no such sheet), and the fold holds
// the fuller set — the raw URL, a draft email, a QR code to hold up. None of it
// sends anything; a human still presses send.
//
// This stays a server component: `zipAnswers` lives in @jamie-nisbet/services,
// and pulling that barrel into the browser would take the database client with
// it. Only the small controls inside each fold are client components.

function Answer({ value }: { value: string | boolean | null }) {
  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>
  }
  if (value === null || value.trim() === "") {
    return <span className="text-desk-fg-3">Not answered</span>
  }
  // Answers arrive as typed, newlines and all — a textarea reply is a paragraph
  // or a bullet list, and collapsing it would lose the shape they gave it.
  return <p className="whitespace-pre-wrap">{value}</p>
}

/** When it went out, how big it was, and which repo the markdown came from —
 *  the row's second line. Older snapshots have no `sourceRepo` and every one of
 *  them was a house form, so saying nothing is the right reading of absent. */
function sentLine(link: FormLink): string {
  const count = link.formSnapshot.fields.length
  const source = link.formSnapshot.sourceRepo?.split("/").pop() ?? null
  return [
    `Sent ${formatDateTime(link.sentAt)}`,
    `${count} ${count === 1 ? "question" : "questions"}`,
    source,
    link.completedAt ? `answered ${formatDateTime(link.completedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function PendingBody({
  link,
  clientId,
  clientName,
  clientEmail,
}: {
  link: FormLink
  clientId: string
  clientName: string
  clientEmail: string | null
}) {
  const url = formLinkUrl(link.id)
  return (
    <div className="flex flex-col gap-3">
      {/* The whole point of the pending state. Mono and selectable, wrapping
          rather than truncating — a link you can only send through buttons is
          a link you can't check. */}
      <div className="rounded-desk-control border border-desk-line bg-desk-canvas px-3 py-2 font-mono text-desk-meta break-all">
        {url}
      </div>
      {/* One wrapping row, leading with the two that hand the link over. It
          breaks where the glass makes it break rather than where a div does. */}
      <div className="flex flex-wrap items-center gap-1">
        <ShareFormLinkSheet
          url={url}
          formTitle={link.formSnapshot.title}
          clientName={clientName}
          clientEmail={clientEmail}
          description={`Sent ${formatDateTime(link.sentAt)}. Pick how it reaches them.`}
        >
          <DeskButton type="button" variant="secondary" size="sm">
            <Share2 />
            Ways to send
          </DeskButton>
        </ShareFormLinkSheet>
        <CopyButton value={url} what="Questionnaire link" />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-desk-control-sm items-center gap-1.5 rounded-desk-control px-2.5 text-desk-ui font-semibold text-desk-fg-2 transition-colors duration-100 hover:bg-desk-sunken hover:text-desk-fg"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Preview
        </a>
        <DeleteFormLinkButton id={link.id} clientId={clientId} answered={false} />
      </div>
    </div>
  )
}

function AnsweredBody({
  link,
  clientId,
  hasDealFolder,
}: {
  link: FormLink
  clientId: string
  hasDealFolder: boolean
}) {
  const answered = zipAnswers(link.formSnapshot, link.answers)
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3">
        {answered.map((field) => (
          <div key={field.key} className="grid gap-1">
            <dt className="text-desk-meta text-desk-fg-3">{field.label}</dt>
            <dd className="text-desk-body text-desk-fg">
              <Answer value={field.answer} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-1">
        {/* Only offered when the row has a deal folder — that is where the
            snapshot belongs (icm-board D24). The folder is named after the
            delivery repo (D28), so connecting a repo is what makes the button
            appear; without one it says why it isn't here. */}
        {hasDealFolder ? (
          <WriteFormToRepoButton linkId={link.id} clientId={clientId} />
        ) : (
          <span className="text-desk-meta text-desk-fg-3">
            Connect a repo to snapshot these answers into its deal folder.
          </span>
        )}
        <DeleteFormLinkButton id={link.id} clientId={clientId} answered />
      </div>
    </div>
  )
}

export function FormLinks({
  clientId,
  clientName,
  clientEmail,
  dealFolder,
  links,
  forms,
  formErrors,
}: {
  clientId: string
  clientName: string
  /** The lead's address, or null — gates the mail draft among the ways to send. */
  clientEmail: string | null
  /** The row's deal folder in icm-board — named after its repo (D28) — or null
   *  while it has none; gates the answers snapshot. */
  dealFolder: string | null
  links: FormLink[]
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const newestAnswered = links.findIndex((link) => link.completedAt !== null)

  return (
    <RecordSection
      header="Forms"
      footer={`The house questionnaires live in icm-board's workspaces/sell/references/forms/; ${clientName}'s own in their delivery repo's .icm/onboarding/. Sending one publishes a link; handing it over is yours to do. Answers stay in Neon — a snapshot goes to the deal folder only when you ask.`}
    >
      <SendFormRow
        clientId={clientId}
        clientName={clientName}
        clientEmail={clientEmail}
        forms={forms}
        formErrors={formErrors}
      />

      {links.length === 0 ? (
        <RecordBlock>
          Nothing sent yet. Sending one publishes a link you can share, email or
          hold up as a QR code — and the answers land back here.
        </RecordBlock>
      ) : (
        links.map((link, index) => {
          const done = link.completedAt !== null
          return (
            <RecordDisclosure
              key={link.id}
              label={link.formSnapshot.title}
              description={sentLine(link)}
              // The newest answered set is the one worth opening on arrival.
              defaultOpen={done && index === newestAnswered}
              // Sharing is what a pending link is *for*, so it sits on the row
              // rather than a fold away. An answered one has nothing left to
              // hand over.
              accessory={
                done ? undefined : (
                  <ShareLinkButton
                    url={formLinkUrl(link.id)}
                    formTitle={link.formSnapshot.title}
                  />
                )
              }
              value={
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-desk-meta",
                    done ? "text-desk-done" : "text-desk-fg-3"
                  )}
                >
                  {done ? (
                    <CircleCheck className="size-3.5" aria-hidden />
                  ) : (
                    <Hourglass className="size-3.5" aria-hidden />
                  )}
                  {/* Waiting is the default state and says nothing new; it
                      gives its words back to the title and the share button
                      beside it, and keeps the glyph. Answered is the news. */}
                  {done ? "Answered" : <span className="sr-only">Waiting</span>}
                </span>
              }
            >
              {done ? (
                <AnsweredBody
                  link={link}
                  clientId={clientId}
                  hasDealFolder={dealFolder !== null}
                />
              ) : (
                <PendingBody
                  link={link}
                  clientId={clientId}
                  clientName={clientName}
                  clientEmail={clientEmail}
                />
              )}
            </RecordDisclosure>
          )
        })
      )}
    </RecordSection>
  )
}
