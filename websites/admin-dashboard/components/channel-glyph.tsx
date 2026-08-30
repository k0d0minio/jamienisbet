import { AtSign, Ellipsis, Footprints, Mail, MessageCircle, Phone } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

// One glyph per channel, in one place.
//
// Three surfaces draw a channel now — the touch log's history, the contact
// card, and the Needs you feed's outreach queue — and a WhatsApp that is a
// speech bubble on one screen and an envelope on another is a lie told twice.
// So the substitutions live here rather than being retyped: Lucide ships no
// brand marks, and inventing them per screen is how a set drifts.
//
// No "use client" of its own, deliberately: the feed renders its queue on the
// server and gets the markup for free, while the touch log — which is a client
// component — pulls it into its own bundle as it always did. A directive here
// would have cost the feed the first without buying the second anything.
export function ChannelGlyph({
  channel,
  className,
}: {
  /** A `TouchChannel`, or anything else — an unrecognised value gets the
   *  catch-all rather than a hole in the row. */
  channel: string | null
  className?: string
}) {
  const size = cn("size-5", className)
  switch (channel) {
    case "whatsapp":
      return <MessageCircle className={size} aria-hidden />
    case "phone":
      return <Phone className={size} aria-hidden />
    case "email":
      return <Mail className={size} aria-hidden />
    case "walkin":
      return <Footprints className={size} aria-hidden />
    case "instagram":
      return <AtSign className={size} aria-hidden />
    default:
      return <Ellipsis className={size} aria-hidden />
  }
}
