import {
  ArrowDownLeft,
  AtSign,
  Ellipsis,
  Footprints,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react"

import { GroupedDisclosure, GroupedRow } from "@jamie-nisbet/ui"

import { Markdown } from "@/components/markdown"
import { channelLabel, outcomeLabel } from "@/lib/touches"

// One touch, as it reads in the history.
//
// A server component, and deliberately: a draft is markdown, and rendering it
// where the log sheet lives would put react-markdown in the browser bundle of
// every lead profile to read a field that is empty on all of them until the
// Gateway starts writing one. So the rows are rendered on the server and handed
// to the client section as children — the same trick the leads list uses to
// wear its swipe gestures without moving the row's content into the browser.
//
// Two shapes, decided by whether the touch has anything to say. A bare touch
// ("WhatsApp · Sent") is a row: there is nothing to open. One carrying a note
// or a draft is a fold, with the note's first line showing as the preview,
// because that line is what you scan a history for and the rest is what you
// open it for.

/** Serializable projection of a `biz.touches` row, dates pre-formatted on the
 *  server so nothing downstream reads a clock. */
export type LeadTouchRow = {
  id: string
  channel: string
  direction: string
  outcome: string
  note: string | null
  draftMd: string | null
  model: string | null
  /** "2 Sep". */
  loggedOn: string
}

/** Lucide has no brand glyphs, so WhatsApp is a chat bubble and Instagram is an
 *  at-sign — the same substitutions the contact card already makes. A walk-in
 *  is footprints, which is the one channel with no digital metaphor at all. */
function ChannelGlyph({ channel }: { channel: string }) {
  switch (channel) {
    case "whatsapp":
      return <MessageCircle />
    case "phone":
      return <Phone />
    case "email":
      return <Mail />
    case "walkin":
      return <Footprints />
    case "instagram":
      return <AtSign />
    default:
      return <Ellipsis />
  }
}

function TouchLabel({ touch }: { touch: LeadTouchRow }) {
  const inbound = touch.direction === "in"
  return (
    <span className="inline-flex items-center gap-1.5">
      {channelLabel(touch.channel)} · {outcomeLabel(touch.outcome)}
      {/* Outbound is the ordinary case, so only inbound says so — an arrow
          rather than a word, because "in" on every second row would read as
          noise and this is the row where they came to you. */}
      {inbound ? (
        <>
          <ArrowDownLeft className="size-3.5 shrink-0 text-app-tint" aria-hidden />
          <span className="sr-only">— they got in touch</span>
        </>
      ) : null}
    </span>
  )
}

/** The date, in mono like every other figure on this tier. */
function LoggedOn({ on }: { on: string }) {
  return <span className="font-mono tabular-nums">{on}</span>
}

export function TouchRow({ touch }: { touch: LeadTouchRow }) {
  const label = <TouchLabel touch={touch} />
  const when = <LoggedOn on={touch.loggedOn} />

  if (!touch.note && !touch.draftMd) {
    return (
      <GroupedRow
        icon={<ChannelGlyph channel={touch.channel} />}
        label={label}
        value={when}
        chevron={false}
      />
    )
  }

  return (
    <GroupedDisclosure
      icon={<ChannelGlyph channel={touch.channel} />}
      label={label}
      description={touch.note ?? "Draft"}
      value={when}
    >
      {touch.note ? (
        <p className="whitespace-pre-wrap text-app-footnote text-app-label-2">
          {touch.note}
        </p>
      ) : null}

      {touch.draftMd ? (
        <div className={touch.note ? "mt-3" : undefined}>
          <span className="text-app-label-3">
            Draft
            {/* Which model wrote it — a courtesy, so a message that reads
                oddly can be traced to whatever drafted it. */}
            {touch.model ? (
              <>
                {" · "}
                <span className="font-mono">{touch.model}</span>
              </>
            ) : null}
          </span>
          <div className="mt-1">
            <Markdown>{touch.draftMd}</Markdown>
          </div>
        </div>
      ) : null}
    </GroupedDisclosure>
  )
}
