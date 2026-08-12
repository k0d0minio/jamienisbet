import {
  ChevronRight,
  CircleCheck,
  ExternalLink,
  Hourglass,
} from "lucide-react"

import { Badge, cn } from "@jamie-nisbet/ui"
import { zipAnswers, type FormLink } from "@jamie-nisbet/services"

import { CopyButton } from "@/components/copy-button"
import { DeleteFormLinkButton } from "@/components/delete-form-link-button"
import { SendFormControl, type FormChoiceView } from "@/components/send-form-control"
import { WriteFormToRepoButton } from "@/components/write-form-to-repo-button"
import { formatDateTime } from "@/lib/format"
import { formLinkUrl } from "@/lib/portfolio"

// The Forms card on a lead's profile: send a questionnaire, then watch for it
// to come back. Two states per link and they want different things on screen —
// a pending one is a URL you need to copy into an email, an answered one is
// reading material — so they don't share a layout beyond the header strip.

function Answer({ value }: { value: string | boolean | null }) {
  if (typeof value === "boolean") {
    return <span className="text-sm">{value ? "Yes" : "No"}</span>
  }
  if (value === null || value.trim() === "") {
    return <span className="text-sm text-muted-foreground">Not answered</span>
  }
  // Answers arrive as typed, newlines and all — a textarea reply is a paragraph
  // or a bullet list, and collapsing it would lose the shape they gave it.
  return <p className="text-sm whitespace-pre-wrap">{value}</p>
}

function SentLine({ link }: { link: FormLink }) {
  const count = link.formSnapshot.fields.length
  // Which repo the markdown came out of, for links sent since questionnaires
  // went multi-repo. Older snapshots have no `sourceRepo` and every one of them
  // was a house form, so saying nothing is the right reading of absent.
  const source = link.formSnapshot.sourceRepo?.split("/").pop() ?? null
  return (
    <p className="text-xs text-muted-foreground">
      Sent {formatDateTime(link.sentAt)} · {count}{" "}
      {count === 1 ? "question" : "questions"}
      {source ? ` · ${source}` : null}
      {link.completedAt
        ? ` · answered ${formatDateTime(link.completedAt)}`
        : null}
    </p>
  )
}

function PendingLink({ link, clientId }: { link: FormLink; clientId: string }) {
  const url = formLinkUrl(link.id)
  return (
    <>
      {/* The whole point of the pending state. Mono and selectable, wrapping
          rather than truncating — a link you can only copy with a button is a
          link you can't check. */}
      <div className="rounded-sm border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
        {url}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <CopyButton value={url} />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-4" aria-hidden />
          Preview
        </a>
        <DeleteFormLinkButton id={link.id} clientId={clientId} answered={false} />
      </div>
    </>
  )
}

// Answers fold. The newest set is open — that's the one you came to read — and
// older ones collapse, so a lead who has answered three questionnaires doesn't
// bury the rest of their profile under thirty paragraphs. Native <details>, so
// it costs no JavaScript and works before hydration.
function AnsweredLink({
  link,
  clientId,
  hasRepo,
  defaultOpen,
}: {
  link: FormLink
  clientId: string
  hasRepo: boolean
  defaultOpen: boolean
}) {
  const answered = zipAnswers(link.formSnapshot, link.answers)
  return (
    <>
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronRight
            className="size-4 shrink-0 transition-transform group-open:rotate-90"
            aria-hidden
          />
          {answered.length} {answered.length === 1 ? "answer" : "answers"}
        </summary>
        <dl className="mt-3 grid gap-3 border-l-2 border-success/40 pl-3">
          {answered.map((field) => (
            <div key={field.key} className="grid gap-1">
              <dt className="text-xs text-muted-foreground">{field.label}</dt>
              <dd>
                <Answer value={field.answer} />
              </dd>
            </div>
          ))}
        </dl>
      </details>
      <div className="flex flex-wrap items-center gap-1">
        {/* Only offered when there's a repo to write to — no repo, no button,
            and connecting one later makes it appear. */}
        {hasRepo ? (
          <WriteFormToRepoButton linkId={link.id} clientId={clientId} />
        ) : null}
        <DeleteFormLinkButton id={link.id} clientId={clientId} answered />
      </div>
    </>
  )
}

export function FormLinks({
  clientId,
  clientRepo,
  links,
  forms,
  formErrors,
}: {
  clientId: string
  /** The lead's delivery repo ("owner/name"), or null — gates "Write to repo". */
  clientRepo: string | null
  links: FormLink[]
  forms: FormChoiceView[]
  formErrors: string[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <SendFormControl
        clientId={clientId}
        forms={forms}
        formErrors={formErrors}
      />

      {links.length === 0 ? (
        <p className="border-t pt-4 text-sm text-muted-foreground">
          Nothing sent yet. Sending one gives you a link to paste into an
          email — the answers land back here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 border-t pt-4">
          {links.map((link, index) => {
            const done = link.completedAt !== null
            // The newest answered set is the one worth opening on arrival.
            const newestAnswered =
              links.findIndex((l) => l.completedAt !== null) === index
            return (
              <li
                key={link.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-3",
                  done ? "bg-success-soft/30" : "bg-card"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      {link.formSnapshot.title}
                    </span>
                    <SentLine link={link} />
                  </div>
                  <Badge variant={done ? "success" : "outline"}>
                    {done ? (
                      <CircleCheck aria-hidden />
                    ) : (
                      <Hourglass aria-hidden />
                    )}
                    {done ? "Answered" : "Awaiting reply"}
                  </Badge>
                </div>

                {done ? (
                  <AnsweredLink
                    link={link}
                    clientId={clientId}
                    hasRepo={clientRepo !== null}
                    defaultOpen={newestAnswered}
                  />
                ) : (
                  <PendingLink link={link} clientId={clientId} />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
