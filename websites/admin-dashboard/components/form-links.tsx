import { CircleCheck, ExternalLink, Hourglass } from "lucide-react"

import {
  GroupedBlock,
  GroupedDisclosure,
  GroupedSection,
  cn,
} from "@jamie-nisbet/ui"
import { zipAnswers, type FormLink } from "@jamie-nisbet/services"

import { CopyButton } from "@/components/copy-button"
import { DeleteFormLinkButton } from "@/components/delete-form-link-button"
import { SendFormRow, type FormChoiceView } from "@/components/send-form-control"
import { WriteFormToRepoButton } from "@/components/write-form-to-repo-button"
import { formatDateTime } from "@/lib/format"
import { formLinkUrl } from "@/lib/portfolio"

// The Forms group on a lead's profile: send a questionnaire, then watch for it
// to come back. One row per link, folded — a pending one opens onto the URL you
// need to copy into an email, an answered one onto the reading. The newest set
// of answers is open on arrival, because that is the one you came for.
//
// This stays a server component: `zipAnswers` lives in @jamie-nisbet/services,
// and pulling that barrel into the browser would take the database client with
// it. Only the small controls inside each fold are client components.

function Answer({ value }: { value: string | boolean | null }) {
  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>
  }
  if (value === null || value.trim() === "") {
    return <span className="text-app-label-3">Not answered</span>
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

function PendingBody({ link, clientId }: { link: FormLink; clientId: string }) {
  const url = formLinkUrl(link.id)
  return (
    <div className="flex flex-col gap-3">
      {/* The whole point of the pending state. Mono and selectable, wrapping
          rather than truncating — a link you can only copy with a button is a
          link you can't check. */}
      <div className="rounded-app-control border border-app-separator bg-app-canvas px-3 py-2 font-mono text-app-caption break-all">
        {url}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <CopyButton value={url} />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-app-touch items-center gap-1.5 rounded-app-control px-3 text-app-subhead text-app-label-3 transition-colors spring-press active:bg-app-press"
        >
          <ExternalLink className="size-4" aria-hidden />
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
  hasRepo,
}: {
  link: FormLink
  clientId: string
  hasRepo: boolean
}) {
  const answered = zipAnswers(link.formSnapshot, link.answers)
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3 border-l-2 border-success/40 pl-3">
        {answered.map((field) => (
          <div key={field.key} className="grid gap-1">
            <dt className="text-app-footnote text-app-label-3">{field.label}</dt>
            <dd className="text-app-callout text-app-label">
              <Answer value={field.answer} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-1">
        {/* Only offered when there's a repo to write to — no repo, no button,
            and connecting one later makes it appear. */}
        {hasRepo ? (
          <WriteFormToRepoButton linkId={link.id} clientId={clientId} />
        ) : null}
        <DeleteFormLinkButton id={link.id} clientId={clientId} answered />
      </div>
    </div>
  )
}

export function FormLinks({
  clientId,
  clientName,
  clientRepo,
  links,
  forms,
  formErrors,
}: {
  clientId: string
  clientName: string
  /** The lead's delivery repo ("owner/name"), or null — gates "Write to repo". */
  clientRepo: string | null
  links: FormLink[]
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  const newestAnswered = links.findIndex((link) => link.completedAt !== null)

  return (
    <GroupedSection
      header="Forms"
      footer={`Questionnaires live in .icm/onboarding/ — in this repo, or in ${clientName}'s own delivery repo. The link is copied here and emailed by hand.`}
    >
      <SendFormRow
        clientId={clientId}
        forms={forms}
        formErrors={formErrors}
      />

      {links.length === 0 ? (
        <GroupedBlock>
          Nothing sent yet. Sending one gives you a link to paste into an
          email — the answers land back here.
        </GroupedBlock>
      ) : (
        links.map((link, index) => {
          const done = link.completedAt !== null
          return (
            <GroupedDisclosure
              key={link.id}
              label={link.formSnapshot.title}
              description={sentLine(link)}
              // The newest answered set is the one worth opening on arrival.
              defaultOpen={done && index === newestAnswered}
              value={
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-app-footnote",
                    done ? "text-success" : "text-app-label-3"
                  )}
                >
                  {done ? (
                    <CircleCheck className="size-4" aria-hidden />
                  ) : (
                    <Hourglass className="size-4" aria-hidden />
                  )}
                  {done ? "Answered" : "Waiting"}
                </span>
              }
            >
              {done ? (
                <AnsweredBody
                  link={link}
                  clientId={clientId}
                  hasRepo={clientRepo !== null}
                />
              ) : (
                <PendingBody link={link} clientId={clientId} />
              )}
            </GroupedDisclosure>
          )
        })
      )}
    </GroupedSection>
  )
}
