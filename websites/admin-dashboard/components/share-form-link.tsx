"use client"

import { useState } from "react"
import { Copy, ExternalLink, Mail, QrCode as QrCodeIcon, Share2 } from "lucide-react"

import {
  GroupedBlock,
  GroupedDisclosure,
  GroupedRow,
  GroupedSection,
  QrCode,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  canEncodeQr,
  cn,
} from "@jamie-nisbet/ui"

import { copyToClipboard } from "@/lib/clipboard"
import { shareOrCopy, useCanShare } from "@/lib/share"

// Four ways to put a questionnaire link in front of the person it was made
// for, and not one of them sends anything: the share sheet hands it to another
// app, the clipboard hands it to you, the mail row opens a draft, and the QR
// waits to be pointed at. A human still presses send — the estate's standing
// rule, and the reason none of this touches Resend.
//
// Which of the four leads depends on the glass. A phone has an OS share sheet
// and that is the one gesture worth having; a laptop mostly doesn't, so the
// clipboard takes the lead there and the copy is honest about it rather than
// offering a button that quietly does nothing.

/** What rides along with the link when it goes out through the share sheet.
 *  Short on purpose: most targets glue text and URL together. */
function sharePayload(formTitle: string, url: string) {
  return {
    title: formTitle,
    text: "A few questions — it takes a few minutes, and the answers come straight back to me.",
    url,
  }
}

/** The draft, in the estate's voice: what it is, the link, what it costs them.
 *  Composed here, sent by a human. */
function mailtoHref(args: {
  email: string
  clientName: string
  formTitle: string
  url: string
}): string {
  const firstName = args.clientName.trim().split(/\s+/)[0] || "there"
  const body = [
    `Hi ${firstName},`,
    "",
    "Here's the questionnaire I mentioned:",
    "",
    args.url,
    "",
    "It takes a few minutes, and the answers come straight back to me.",
    "",
    "Jamie",
  ].join("\n")
  return `mailto:${encodeURIComponent(args.email)}?subject=${encodeURIComponent(
    args.formTitle
  )}&body=${encodeURIComponent(body)}`
}

/**
 * The one-tap action that sits on a pending row: the OS share sheet where
 * there is one, the clipboard where there isn't. Icon-only — it lives on a
 * row that is already carrying a title and a date — so the label is spoken
 * rather than drawn, and it says which of the two it is about to do.
 */
export function ShareLinkButton({
  url,
  formTitle,
  className,
}: {
  url: string
  formTitle: string
  className?: string
}) {
  const canShare = useCanShare()

  return (
    <button
      type="button"
      aria-label={
        canShare ? `Share ${formTitle}` : `Copy the link to ${formTitle}`
      }
      onClick={() => {
        // Nothing awaited before the call: `navigator.share` needs the tap's
        // own activation and an await would have spent it.
        void shareOrCopy(sharePayload(formTitle, url), "Questionnaire link")
      }}
      className={cn(
        "flex size-desk-control items-center justify-center rounded-desk-control",
        "text-desk-fg-2 transition-colors duration-100 hover:bg-desk-sunken hover:text-desk-fg",
        className
      )}
    >
      {canShare ? (
        <Share2 className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
    </button>
  )
}

/**
 * Every way to hand this link over, in one panel. Rendered inside a sheet —
 * either the row's own, or the send sheet the moment a link comes into
 * existence, which is the whole point of the second one: the link and the way
 * to send it arrive in the same gesture.
 */
export function ShareFormLink({
  url,
  formTitle,
  clientName,
  clientEmail,
}: {
  url: string
  formTitle: string
  clientName: string
  /** The lead's address, or null — the mail row degrades rather than vanishes. */
  clientEmail: string | null
}) {
  const canShare = useCanShare()
  const fitsInQr = canEncodeQr(url)

  return (
    <div className="flex flex-col gap-4">
      <GroupedSection header="The link">
        {/* Machine text: mono, selectable, wrapping rather than truncating.
            A link you can only send through buttons is a link you can't
            check, and checking it is sometimes the whole errand. */}
        <GroupedBlock className="font-mono break-all">{url}</GroupedBlock>
      </GroupedSection>

      <GroupedSection footer="Nothing goes out from here — each of these hands you a link or a draft, and you send it.">
        {/* Only where the glass has one. Offering a share sheet that isn't
            there would be a button that looks like it worked. */}
        {canShare ? (
          <GroupedRow
            icon={<Share2 />}
            variant="tint"
            label="Share the link"
            description="Through whatever you already message them in"
            chevron={false}
            onClick={() => {
              void shareOrCopy(sharePayload(formTitle, url), "Questionnaire link")
            }}
          />
        ) : null}

        <GroupedRow
          icon={<Copy />}
          // Lead with it on a laptop, where it is the only way out of here.
          variant={canShare ? "default" : "tint"}
          label="Copy the link"
          chevron={false}
          onClick={() => {
            void copyToClipboard(url, "Questionnaire link")
          }}
        />

        {clientEmail ? (
          <GroupedRow
            icon={<Mail />}
            label="Email a draft"
            description={clientEmail}
            chevron={false}
            href={mailtoHref({ email: clientEmail, clientName, formTitle, url })}
          />
        ) : (
          // The action the record can't support, disabled rather than hidden:
          // its absence is the news, and it explains itself.
          <GroupedRow
            icon={<Mail />}
            label="Email a draft"
            description="No address on this lead yet"
            className="opacity-50"
          />
        )}

        {fitsInQr ? (
          <GroupedDisclosure
            icon={<QrCodeIcon />}
            label="Show a QR code"
            description="For handing it over in person"
          >
            <div className="flex justify-center pt-1">
              {/* Big enough to scan across a table, capped so it doesn't
                  outgrow the sheet on a laptop. The plate is deliberately
                  light in both themes — the hairline is what stops it
                  floating in the dark. */}
              <QrCode
                value={url}
                label={`QR code for ${formTitle}`}
                className="w-full max-w-56 rounded-app-control border border-app-separator"
              />
            </div>
          </GroupedDisclosure>
        ) : (
          // Only reachable with a portfolio base URL long enough to push the
          // link past 213 characters. Said rather than hidden, so the set of
          // ways to send stays the same four everywhere.
          <GroupedRow
            icon={<QrCodeIcon />}
            label="Show a QR code"
            description="This link is too long to fit in one"
            className="opacity-50"
          />
        )}
      </GroupedSection>

      <GroupedSection footer="Opening it is a look at what they will see — nothing is recorded until they submit.">
        <GroupedRow
          icon={<ExternalLink />}
          label="Open the questionnaire"
          href={url}
          target="_blank"
          rel="noreferrer"
          chevron={false}
        />
      </GroupedSection>
    </div>
  )
}

/**
 * The panel behind its own sheet, for a row that already exists. The trigger
 * is the caller's — a button in the fold, most often.
 */
export function ShareFormLinkSheet({
  url,
  formTitle,
  clientName,
  clientEmail,
  description,
  children,
}: {
  url: string
  formTitle: string
  clientName: string
  clientEmail: string | null
  /** What the sheet says under its title — when this link went out. */
  description: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      {/* Half-height is enough for the list; the drag up is for the QR. */}
      <SheetContent detents={["medium", "large"]}>
        <SheetHeader>
          <SheetTitle>Ways to send</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <ShareFormLink
          url={url}
          formTitle={formTitle}
          clientName={clientName}
          clientEmail={clientEmail}
        />
      </SheetContent>
    </Sheet>
  )
}
