import {
  AtSign,
  Ellipsis,
  Footprints,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react"

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

/** The date, in mono like every other figure on this tier. */
function LoggedOn({ on }: { on: string }) {
  return (
    <span className="font-mono text-desk-meta text-desk-fg-3 tabular-nums">
      {on}
    </span>
  )
}

// One line of the Activity timeline, on the desk tier: the date, which way it
// went, then the channel and what came of it, with the note under it as it
// was written. The note is read in place — it is what the history is for —
// and only a draft folds, because a whole message is a page of its own.
//
// Direction is a glyph rather than a word: → went out, ← came in. Every row
// says it, so the column reads down the page as the rhythm of the exchange.
export function TouchRow({ touch }: { touch: LeadTouchRow }) {
  const inbound = touch.direction === "in"

  return (
    <li className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-x-2 border-b border-desk-line py-2">
      <LoggedOn on={touch.loggedOn} />
      <span
        className="font-mono text-desk-meta text-desk-fg-3"
        title={inbound ? "They got in touch" : "You reached out"}
      >
        <span aria-hidden>{inbound ? "←" : "→"}</span>
        <span className="sr-only">{inbound ? "In:" : "Out:"}</span>
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-1.5 text-desk-ui font-semibold text-desk-fg">
          <span className="flex shrink-0 text-desk-fg-3 [&>svg]:size-desk-icon">
            <ChannelGlyph channel={touch.channel} />
          </span>
          <span className="truncate">
            {channelLabel(touch.channel)} · {outcomeLabel(touch.outcome)}
          </span>
        </span>
        {touch.note ? (
          <p className="text-desk-ui whitespace-pre-wrap text-desk-fg-2">
            {touch.note}
          </p>
        ) : null}
        {touch.draftMd ? (
          <details className="group/draft">
            <summary className="cursor-pointer list-none text-desk-meta text-desk-fg-3 hover:text-desk-fg [&::-webkit-details-marker]:hidden">
              Draft
              {/* Which model wrote it — a courtesy, so a message that reads
                  oddly can be traced to whatever drafted it. */}
              {touch.model ? (
                <>
                  {" · "}
                  <span className="font-mono">{touch.model}</span>
                </>
              ) : null}
              <span aria-hidden> ▸</span>
            </summary>
            <div className="mt-1 text-desk-ui text-desk-fg-2">
              <Markdown>{touch.draftMd}</Markdown>
            </div>
          </details>
        ) : null}
      </div>
    </li>
  )
}

/** The timeline's last line: the day the record began, and the door it came
 *  through. Derived from the row itself (`created_at`, `source`) — nothing is
 *  logged for it, so it is always there and always last. */
export function CameInRow({ on, source }: { on: string; source: string }) {
  return (
    <li className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-x-2 border-b border-desk-line py-2">
      <LoggedOn on={on} />
      <span aria-hidden className="font-mono text-desk-meta text-desk-fg-3">
        ·
      </span>
      <span className="text-desk-ui font-semibold text-desk-fg">
        Came in · {source}
      </span>
    </li>
  )
}
