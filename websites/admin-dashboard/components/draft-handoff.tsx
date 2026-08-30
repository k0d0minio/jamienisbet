"use client"

import { AtSign, Mail, MessageCircle } from "lucide-react"

import { GroupedRow } from "@jamie-nisbet/ui"

import {
  draftInstagramHref,
  draftMailtoHref,
  draftWhatsappHref,
  type DraftChannelValue,
} from "@/lib/draft"
import { copyToClipboard } from "@/lib/clipboard"

// The one row that puts a message into the app it goes out of.
//
// The far end of the estate's standing rule, and the only thing either AI
// surface on this page can do with the text it produced: open somebody else's
// app with the message already typed in. `mailto:` opens a compose window.
// `wa.me?text=` opens a conversation. Instagram has no prefill at all, so the
// draft goes to the clipboard and the profile opens beside it. A thumb presses
// send in every case; nothing here transmits anything.
//
// It is its own component because two panels reach it — the draft panel writes
// the next cold message, and the reply triage writes the answer to one — and a
// second copy of these three URLs is a second place for the WhatsApp number
// rule to drift.

export function DraftHandoff({
  channel,
  /** The address, number or handle this channel is reached on. */
  value,
  /** Email only: the subject line, pulled off the top of the draft. */
  subject,
  /** The message itself, without the subject line. */
  body,
  /** Fired once the draft has gone somewhere else — what the offer to log a
   *  touch waits for. */
  onHandoff,
}: {
  channel: DraftChannelValue
  value: string
  subject: string | null
  body: string
  onHandoff: () => void
}) {
  switch (channel) {
    case "email":
      return (
        <GroupedRow
          icon={<Mail />}
          variant="tint"
          label="Open an email draft"
          description={subject ? `${value} · ${subject}` : value}
          chevron={false}
          href={draftMailtoHref({ email: value, subject, body })}
          onClick={onHandoff}
        />
      )
    case "whatsapp":
      return (
        <GroupedRow
          icon={<MessageCircle />}
          variant="tint"
          label="Open the chat, message typed in"
          description={value}
          chevron={false}
          href={draftWhatsappHref(value, body)}
          target="_blank"
          rel="noreferrer"
          onClick={onHandoff}
        />
      )
    case "instagram":
      return (
        <GroupedRow
          icon={<AtSign />}
          variant="tint"
          label="Copy it and open Instagram"
          description={`@${value}`}
          chevron={false}
          href={draftInstagramHref(value)}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            // Not awaited: the tap's own activation is what lets the link
            // open, and an await before it would spend that.
            void copyToClipboard(body, "Draft")
            onHandoff()
          }}
        />
      )
  }
}
